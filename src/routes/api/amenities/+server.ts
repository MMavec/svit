import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PublicAmenity } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 21600; // 6 hours

const FACILITIES =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_Facilities/MapServer';
const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { x: number; y: number };
}

async function fetchLayer(
	layer: number,
	where: string,
	outFields: string
): Promise<ArcGisFeature[]> {
	try {
		const params = new URLSearchParams({
			where,
			outFields,
			returnGeometry: 'true',
			outSR: '4326',
			resultRecordCount: '200',
			f: 'json'
		});
		const res = await fetch(`${FACILITIES}/${layer}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!res.ok) return [];
		const data = (await res.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];
		return data.features;
	} catch {
		return [];
	}
}

async function fetchVictoriaAmenities(): Promise<PublicAmenity[]> {
	const [washrooms, facilities] = await Promise.all([
		fetchLayer(8, "LifecycleStatus='ACT'", 'OBJECTID,FacilityName,Address,HoursOfOperation'),
		fetchLayer(7, '1=1', 'OBJECTID,FacilityName,Address,Type')
	]);

	const out: PublicAmenity[] = [];
	for (const f of washrooms) {
		const a = f.attributes;
		out.push({
			id: `vic-wc-${str(a.OBJECTID) || hashCode(str(a.FacilityName))}`,
			kind: 'washroom',
			name: str(a.FacilityName) || 'Public washroom',
			address: str(a.Address) || undefined,
			hours: str(a.HoursOfOperation) || undefined,
			municipality: 'victoria',
			coordinates: coords(f.geometry),
			source: 'victoria-opendata'
		});
	}
	for (const f of facilities) {
		const a = f.attributes;
		out.push({
			id: `vic-fac-${str(a.OBJECTID) || hashCode(str(a.FacilityName))}`,
			kind: 'facility',
			name: str(a.FacilityName) || 'City facility',
			address: str(a.Address) || undefined,
			category: str(a.Type) || undefined,
			municipality: 'victoria',
			coordinates: coords(f.geometry),
			source: 'victoria-opendata'
		});
	}
	return out;
}

function getSeed(): PublicAmenity[] {
	return [
		{
			id: 'vic-wc-seed-1',
			kind: 'washroom',
			name: 'Langley Street Toilets',
			address: '1211 Langley Street',
			hours: '24 hours a day, 7 days a week',
			municipality: 'victoria',
			coordinates: [-123.36838, 48.42596],
			source: 'seed'
		},
		{
			id: 'vic-fac-seed-1',
			kind: 'facility',
			name: 'Crystal Pool and Fitness Centre',
			address: '2275 Quadra Street',
			category: 'Recreation',
			municipality: 'victoria',
			coordinates: [-123.35726, 48.43345],
			source: 'seed'
		}
	];
}

function coords(g: { x: number; y: number } | undefined): [number, number] | undefined {
	if (!g || !isFinite(g.x) || !isFinite(g.y)) return undefined;
	if (g.x > -124.2 && g.x < -123.0 && g.y > 48.2 && g.y < 48.8) return [g.x, g.y];
	return undefined;
}

function str(v: unknown): string {
	return v === null || v === undefined ? '' : String(v).trim();
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

const KIND_VALUES = new Set<PublicAmenity['kind']>(['washroom', 'facility']);

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const kind = parseEnum(url.searchParams.get('kind'), KIND_VALUES);
	const limit = parseLimit(url.searchParams.get('limit'), 60);

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(municipality)} amenity data is not in this open feed. Shown data covers the City of Victoria.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let amenities = await fetchVictoriaAmenities();
	const live = amenities.length > 0;
	if (!live) amenities = getSeed();

	const byKind: Record<string, number> = {};
	for (const a of amenities) byKind[a.kind] = (byKind[a.kind] ?? 0) + 1;

	if (kind) amenities = amenities.filter((a) => a.kind === kind);
	const fullCount = amenities.length;
	amenities = amenities.slice(0, limit);

	return json(
		{
			data: amenities,
			meta: {
				total: fullCount,
				municipality,
				live,
				byKind,
				note: live
					? 'Public washrooms and civic facilities, City of Victoria.'
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
