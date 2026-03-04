import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { TransitAlert } from '$lib/types/index';
import { parseLimit } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 300; // 5 minutes

/** GTFS-RT cause enum to human-readable label */
const CAUSE_MAP: Record<number, string> = {
	1: 'UNKNOWN',
	2: 'OTHER',
	3: 'TECHNICAL_PROBLEM',
	4: 'STRIKE',
	5: 'DEMONSTRATION',
	6: 'ACCIDENT',
	7: 'HOLIDAY',
	8: 'WEATHER',
	9: 'MAINTENANCE',
	10: 'CONSTRUCTION',
	11: 'POLICE_ACTIVITY',
	12: 'MEDICAL_EMERGENCY'
};

/** GTFS-RT effect enum to human-readable label */
const EFFECT_MAP: Record<number, string> = {
	1: 'NO_SERVICE',
	2: 'REDUCED_SERVICE',
	3: 'SIGNIFICANT_DELAYS',
	4: 'DETOUR',
	5: 'ADDITIONAL_SERVICE',
	6: 'MODIFIED_SERVICE',
	7: 'OTHER',
	8: 'UNKNOWN',
	9: 'STOP_MOVED'
};

/** Fetch BC Transit Victoria service alerts from GTFS-RT protobuf feed */
async function fetchBCTransitAlerts(): Promise<TransitAlert[]> {
	try {
		// Dynamically import to avoid issues with ESM/CJS
		const GtfsRealtimeBindings = await import('gtfs-realtime-bindings');
		const FeedMessage =
			GtfsRealtimeBindings.default?.transit_realtime?.FeedMessage ??
			GtfsRealtimeBindings.transit_realtime?.FeedMessage;

		if (!FeedMessage) {
			console.warn('GTFS-RT bindings not available');
			return [];
		}

		const response = await fetch('https://bct.tmix.se/gtfs-realtime/alerts.pb?operatorIds=48', {
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) return [];

		const buffer = await response.arrayBuffer();
		const feed = FeedMessage.decode(new Uint8Array(buffer));

		const alerts: TransitAlert[] = [];

		for (const entity of feed.entity || []) {
			const alert = entity.alert;
			if (!alert) continue;

			const headerText = getTranslation(alert.headerText);
			const descriptionText = getTranslation(alert.descriptionText);
			const url = getTranslation(alert.url);

			const routeIds: string[] = [];
			const stopIds: string[] = [];
			for (const ie of alert.informedEntity || []) {
				if (ie.routeId) routeIds.push(String(ie.routeId));
				if (ie.stopId) stopIds.push(String(ie.stopId));
			}

			const activePeriod = (alert.activePeriod || [])[0];
			const cause = CAUSE_MAP[alert.cause as number] || 'UNKNOWN';
			const effect = EFFECT_MAP[alert.effect as number] || 'UNKNOWN';

			// Determine severity from effect
			let severity: TransitAlert['severity'] = 'INFO';
			if (effect === 'NO_SERVICE' || effect === 'SIGNIFICANT_DELAYS') {
				severity = 'SEVERE';
			} else if (effect === 'REDUCED_SERVICE' || effect === 'DETOUR') {
				severity = 'WARNING';
			}

			alerts.push({
				id: String(entity.id || `transit-${alerts.length}`),
				headerText: headerText || 'Transit Alert',
				descriptionText: descriptionText || '',
				cause,
				effect,
				severity,
				activePeriodStart: activePeriod?.start
					? new Date(Number(activePeriod.start) * 1000).toISOString()
					: undefined,
				activePeriodEnd: activePeriod?.end
					? new Date(Number(activePeriod.end) * 1000).toISOString()
					: undefined,
				routeIds: routeIds.length > 0 ? routeIds : undefined,
				stopIds: stopIds.length > 0 ? stopIds : undefined,
				url: url || undefined,
				source: 'bctransit'
			});
		}

		return alerts;
	} catch (err) {
		console.error('Failed to fetch BC Transit alerts:', err);
		return [];
	}
}

/** Extract text from GTFS-RT TranslatedString */
interface GtfsTranslation {
	text?: string | null;
	language?: string | null;
}

interface GtfsTranslatedString {
	translation?: GtfsTranslation[] | null;
}

function getTranslation(translatedString: GtfsTranslatedString | null | undefined): string | null {
	if (!translatedString?.translation?.length) return null;
	const translations = translatedString.translation;
	// Prefer English, fall back to first available
	const en = translations.find((t) => t.language === 'en');
	return en?.text || translations[0]?.text || null;
}

function getSeedAlerts(): TransitAlert[] {
	return [
		{
			id: 'transit-seed-1',
			headerText: 'Route 6 — Detour via Quadra St',
			descriptionText:
				'Due to road construction on Douglas St between Hillside and Bay, Route 6 is detoured via Quadra St. Expect delays of 5-10 minutes.',
			cause: 'CONSTRUCTION',
			effect: 'DETOUR',
			severity: 'WARNING',
			activePeriodStart: '2026-02-01T06:00:00-08:00',
			activePeriodEnd: '2026-04-15T22:00:00-07:00',
			routeIds: ['6'],
			routeShortNames: ['6'],
			source: 'seed'
		},
		{
			id: 'transit-seed-2',
			headerText: 'Route 50 — Reduced service weekends',
			descriptionText:
				'Route 50 (Langford/Downtown) will operate on reduced weekend frequency due to operator shortage. Buses every 30 min instead of 15 min.',
			cause: 'OTHER',
			effect: 'REDUCED_SERVICE',
			severity: 'WARNING',
			activePeriodStart: '2026-02-15T00:00:00-08:00',
			routeIds: ['50'],
			routeShortNames: ['50'],
			source: 'seed'
		},
		{
			id: 'transit-seed-3',
			headerText: 'Temporary stop closure — Uptown Exchange Bay 4',
			descriptionText:
				'Bay 4 at Uptown Exchange is temporarily closed for maintenance. Routes 30, 31, 39 will board from Bay 5.',
			cause: 'MAINTENANCE',
			effect: 'STOP_MOVED',
			severity: 'INFO',
			activePeriodStart: '2026-02-28T08:00:00-08:00',
			activePeriodEnd: '2026-03-07T17:00:00-08:00',
			routeIds: ['30', '31', '39'],
			routeShortNames: ['30', '31', '39'],
			stopIds: ['uptown-bay-4'],
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const limit = parseLimit(url.searchParams.get('limit'), 50);

	let alerts = await fetchBCTransitAlerts();

	if (alerts.length === 0) {
		alerts = getSeedAlerts();
	}

	alerts = alerts.slice(0, limit);

	return json(
		{
			data: alerts,
			meta: {
				total: alerts.length
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`
			}
		}
	);
};
