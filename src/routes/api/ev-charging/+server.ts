import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EvCharger } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseMunicipality } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 21600; // 6 hours (infrastructure inventory — changes rarely)

// City of Victoria — public EV charging stations (parking infrastructure layer).
const VICTORIA_EV =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_Parking/MapServer/8';

const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { x: number; y: number };
}

async function fetchVictoriaEvChargers(): Promise<EvCharger[]> {
	try {
		const params = new URLSearchParams({
			where: "LifecycleStatus='ACT'",
			outFields: 'Type,RatePerHour,Description,MaxTime,HoursInEffect,Owner,InfrastructureID',
			returnGeometry: 'true',
			outSR: '4326',
			resultRecordCount: '200',
			f: 'json'
		});

		const response = await fetch(`${VICTORIA_EV}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];

		const data = (await response.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];
		return data.features.map((f) => mapToCharger(f.attributes, f.geometry));
	} catch (err) {
		console.error('Failed to fetch Victoria EV chargers:', err);
		return [];
	}
}

function mapToCharger(
	props: Record<string, unknown>,
	geometry: { x: number; y: number } | undefined
): EvCharger {
	const desc = str(props.Description);
	const rate = str(props.RatePerHour);
	const id = str(props.InfrastructureID);

	// Description embeds the venue + sometimes a network note. Take the first readable clause.
	const name = cleanName(desc) || 'EV charging station';
	// Only trust the rate field for "free" — Description often says "download the free FLO app".
	const free = /^free\b/i.test(rate.trim());
	const network = /\bFLO\b/i.test(desc) ? 'FLO' : undefined;

	return {
		id: `vic-ev-${id || hashCode(desc)}`,
		name,
		address: desc && desc !== name ? desc : undefined,
		chargerType: str(props.Type) || undefined,
		rate: rate || undefined,
		free,
		maxTime: str(props.MaxTime) || undefined,
		hours: str(props.HoursInEffect) || undefined,
		network,
		owner: str(props.Owner) || undefined,
		municipality: 'victoria',
		coordinates:
			geometry && isFinite(geometry.x) && isFinite(geometry.y)
				? [geometry.x, geometry.y]
				: undefined,
		source: 'victoria-opendata'
	};
}

/** Pull a human venue name out of the free-text Description. */
function cleanName(desc: string): string {
	if (!desc) return '';
	// Strip a leading "Ver Network XXX-000" style prefix, then take the first sentence/clause.
	const stripped = desc.replace(/^Ver Network\s+[A-Z]{2,}-\d+\s*/i, '').trim();
	const firstClause = stripped.split(/[.(]/)[0].trim();
	return firstClause.length > 3 ? firstClause : stripped.split(/[.(]/)[0].trim();
}

function getSeedChargers(): EvCharger[] {
	return [
		{
			id: 'vic-ev-seed-1',
			name: 'View Street Parkade',
			chargerType: 'non-metered',
			rate: 'Regular parking fees apply.',
			free: false,
			network: 'FLO',
			owner: 'VC',
			municipality: 'victoria',
			coordinates: [-123.36381, 48.42512],
			source: 'seed'
		},
		{
			id: 'vic-ev-seed-2',
			name: 'Hillside Mall Rooftop',
			chargerType: 'non-metered',
			rate: 'Free',
			free: true,
			owner: 'VC',
			municipality: 'victoria',
			coordinates: [-123.33506, 48.4469],
			source: 'seed'
		}
	];
}

function str(val: unknown): string {
	if (val === null || val === undefined) return '';
	return String(val).trim();
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(municipality)} EV charging data is not in this open feed. Shown data covers City of Victoria public stations.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let chargers = await fetchVictoriaEvChargers();
	const live = chargers.length > 0;
	if (!live) chargers = getSeedChargers();

	const freeCount = chargers.filter((c) => c.free).length;

	return json(
		{
			data: chargers,
			meta: {
				total: chargers.length,
				municipality,
				live,
				freeCount,
				note: live
					? 'Public EV charging stations, City of Victoria.'
					: 'Live Victoria feed unavailable — showing sample records.'
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
			}
		}
	);
};
