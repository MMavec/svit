import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EmergencyAlert } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 300; // 5 minutes

// Provincial Evacuation Orders & Alerts (BC), filtered spatially to Vancouver Island.
const EVAC =
	'https://services6.arcgis.com/ubm4tcTYICKBpist/arcgis/rest/services/Evacuation_Orders_and_Alerts/FeatureServer/0';
// Environment Canada GeoMet marine forecasts (warnings light up the four Greater-Victoria zones).
const MARINE = 'https://api.weather.gc.ca/collections/marineweather-realtime/items';

const VI_ENVELOPE = '-128.5,48.2,-123.0,51.0'; // xmin,ymin,xmax,ymax
const VICTORIA_MARINE_BBOX = '-125.5,48.0,-122.7,49.2';

function str(v: unknown): string {
	return v === null || v === undefined ? '' : String(v).trim();
}

function iso(ms: unknown): string | undefined {
	const n = Number(ms);
	if (!isFinite(n) || n <= 0) return undefined;
	const d = new Date(n);
	return isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function fetchEvacuations(): Promise<EmergencyAlert[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			geometry: VI_ENVELOPE,
			geometryType: 'esriGeometryEnvelope',
			inSR: '4326',
			spatialRel: 'esriSpatialRelIntersects',
			outFields: 'EVENT_NAME,EVENT_TYPE,ORDER_ALERT_STATUS,ISSUING_AGENCY,DATE_MODIFIED',
			returnGeometry: 'false',
			f: 'json'
		});
		const res = await fetch(`${EVAC}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!res.ok) return [];
		const data = (await res.json()) as {
			features?: { attributes: Record<string, unknown> }[];
			error?: unknown;
		};
		if (data.error || !Array.isArray(data.features)) return [];
		// Drop stale entries: the BC layer sometimes retains year-old notices. Keep last ~120 days.
		const cutoff = Date.now() - 120 * 24 * 60 * 60 * 1000;
		return data.features
			.filter((f) => {
				const modified = Number(f.attributes.DATE_MODIFIED);
				return !isFinite(modified) || modified >= cutoff;
			})
			.map((f) => {
				const a = f.attributes;
				const status = str(a.ORDER_ALERT_STATUS) || 'Alert';
				return {
					id: `evac-${hashCode(str(a.EVENT_NAME) + status)}`,
					title: str(a.EVENT_NAME) || 'Evacuation notice',
					category: 'evacuation' as const,
					status,
					severity: /order/i.test(status) ? ('high' as const) : ('moderate' as const),
					area: str(a.EVENT_TYPE) || undefined,
					agency: str(a.ISSUING_AGENCY) || undefined,
					updated: iso(a.DATE_MODIFIED),
					source: 'emergencyinfobc'
				};
			});
	} catch {
		return [];
	}
}

interface MarineFeature {
	properties?: {
		area?: { value?: { en?: string } };
		lastUpdated?: string;
		warnings?: { locations?: { name?: { en?: string }; warningType?: string }[] } | null;
	};
}

async function fetchMarine(): Promise<EmergencyAlert[]> {
	try {
		const res = await fetch(`${MARINE}?bbox=${VICTORIA_MARINE_BBOX}&f=json`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!res.ok) return [];
		const data = (await res.json()) as { features?: MarineFeature[] };
		if (!Array.isArray(data.features)) return [];
		const out: EmergencyAlert[] = [];
		for (const f of data.features) {
			const p = f.properties || {};
			const locs = p.warnings?.locations;
			if (!Array.isArray(locs) || locs.length === 0) continue; // no active marine warning
			const zone = str(p.area?.value?.en) || 'Marine zone';
			const warnType = str(locs[0]?.warningType) || str(locs[0]?.name?.en) || 'warning';
			out.push({
				id: `marine-${hashCode(zone + warnType)}`,
				title: `Marine warning: ${zone}`,
				category: 'marine',
				status: warnType,
				severity: 'moderate',
				area: zone,
				agency: 'Environment Canada',
				updated: p.lastUpdated || undefined,
				source: 'eccc-marine'
			});
		}
		return out;
	} catch {
		return [];
	}
}

const SEV_RANK: Record<EmergencyAlert['severity'], number> = { high: 0, moderate: 1, info: 2 };

export const GET: RequestHandler = async ({ url }) => {
	const limit = parseLimit(url.searchParams.get('limit'), 40);

	const [evacRes, marineRes] = await Promise.allSettled([fetchEvacuations(), fetchMarine()]);
	const raw: EmergencyAlert[] = [];
	if (evacRes.status === 'fulfilled') raw.push(...evacRes.value);
	if (marineRes.status === 'fulfilled') raw.push(...marineRes.value);

	// An event can span multiple polygons (e.g. one landslide as two evac areas) -> dedupe by id so
	// Svelte list keys stay unique.
	const seenIds = new Set<string>();
	const alerts: EmergencyAlert[] = [];
	for (const a of raw) {
		if (seenIds.has(a.id)) continue;
		seenIds.add(a.id);
		alerts.push(a);
	}

	alerts.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);

	const byCategory: Record<string, number> = {};
	for (const a of alerts) byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
	const fullCount = alerts.length;

	return json(
		{
			data: alerts.slice(0, limit),
			meta: {
				total: fullCount,
				live: true,
				byCategory,
				note:
					fullCount > 0
						? `${fullCount} active emergency alert${fullCount === 1 ? '' : 's'} for the region.`
						: 'No active evacuation or marine warnings for Greater Victoria & Vancouver Island.'
			}
		},
		{
			headers: { 'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600` }
		}
	);
};
