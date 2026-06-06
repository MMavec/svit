import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MobilityFeature } from '$lib/types/index';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 21600; // 6 hours (infrastructure inventory)

const PARKING = 'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_Parking/MapServer';
const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { x: number; y: number };
}

async function fetchLayer(
	layer: number,
	where: string,
	outFields: string,
	max: number
): Promise<ArcGisFeature[]> {
	try {
		const params = new URLSearchParams({
			where,
			outFields,
			returnGeometry: 'true',
			outSR: '4326',
			resultRecordCount: String(max),
			f: 'json'
		});
		const res = await fetch(`${PARKING}/${layer}/query?${params}`, {
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

function coords(g: { x: number; y: number } | undefined): [number, number] | undefined {
	if (!g || !isFinite(g.x) || !isFinite(g.y)) return undefined;
	if (g.x > -124.2 && g.x < -123.0 && g.y > 48.2 && g.y < 48.8) return [g.x, g.y];
	return undefined;
}

function str(v: unknown): string {
	return v === null || v === undefined ? '' : String(v).trim();
}

function titleCase(s: string): string {
	return s ? s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()) : s;
}

async function fetchVictoriaMobility(): Promise<MobilityFeature[]> {
	const [bikes, carShare, payStations] = await Promise.all([
		fetchLayer(0, "LifecycleStatus='ACT'", 'OBJECTID,TYPE,BikeRackShape,BlockName', 250),
		fetchLayer(1, '1=1', 'OBJECTID', 200),
		fetchLayer(5, '1=1', 'OBJECTID,Civic,Street,Zone', 250)
	]);

	const out: MobilityFeature[] = [];
	for (const f of bikes) {
		const a = f.attributes;
		out.push({
			id: `vic-bike-${str(a.OBJECTID)}`,
			kind: 'bike-rack',
			label: titleCase(str(a.BlockName)) || titleCase(str(a.TYPE)) || 'Bike rack',
			detail: str(a.BikeRackShape) ? `${str(a.BikeRackShape)} rack` : undefined,
			municipality: 'victoria',
			coordinates: coords(f.geometry),
			source: 'victoria-opendata'
		});
	}
	for (const f of carShare) {
		out.push({
			id: `vic-carshare-${str(f.attributes.OBJECTID)}`,
			kind: 'car-share',
			label: 'Car share space',
			municipality: 'victoria',
			coordinates: coords(f.geometry),
			source: 'victoria-opendata'
		});
	}
	for (const f of payStations) {
		const a = f.attributes;
		const loc = [str(a.Civic), titleCase(str(a.Street))].filter(Boolean).join(' ');
		out.push({
			id: `vic-pay-${str(a.OBJECTID)}`,
			kind: 'pay-station',
			label: loc || 'Pay station',
			detail: titleCase(str(a.Zone)) || undefined,
			municipality: 'victoria',
			coordinates: coords(f.geometry),
			source: 'victoria-opendata'
		});
	}
	return out;
}

function getSeed(): MobilityFeature[] {
	return [
		{
			id: 'vic-bike-seed-1',
			kind: 'bike-rack',
			label: '900 Block Blanshard St',
			detail: 'U rack',
			municipality: 'victoria',
			coordinates: [-123.36292, 48.4233],
			source: 'seed'
		},
		{
			id: 'vic-pay-seed-1',
			kind: 'pay-station',
			label: '1200 Broad',
			detail: 'On-Street',
			municipality: 'victoria',
			coordinates: [-123.36642, 48.42586],
			source: 'seed'
		},
		{
			id: 'vic-carshare-seed-1',
			kind: 'car-share',
			label: 'Car share space',
			municipality: 'victoria',
			coordinates: [-123.36146, 48.42924],
			source: 'seed'
		}
	];
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

const KIND_VALUES = new Set<MobilityFeature['kind']>(['bike-rack', 'car-share', 'pay-station']);

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const kind = parseEnum(url.searchParams.get('kind'), KIND_VALUES);
	const limit = parseLimit(url.searchParams.get('limit'), 80, 400);

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(municipality)} mobility infrastructure is not in this open feed. Shown data covers the City of Victoria.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let features = await fetchVictoriaMobility();
	const live = features.length > 0;
	if (!live) features = getSeed();

	const byKind: Record<string, number> = {};
	for (const f of features) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;

	if (kind) features = features.filter((f) => f.kind === kind);
	const fullCount = features.length;
	features = features.slice(0, limit);

	return json(
		{
			data: features,
			meta: {
				total: fullCount,
				municipality,
				live,
				byKind,
				note: live
					? 'Bike racks, car-share spaces and parking pay stations, City of Victoria.'
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
