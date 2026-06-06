import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PublicLandParcel } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 86400; // 24 hours (land inventory changes slowly)

// City of Victoria — "City Owned or Leased Parcels" (the public land bank).
const LAYER = 'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_Land/MapServer/3';
const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { rings?: number[][][] };
}

async function fetchVictoriaPublicLand(): Promise<PublicLandParcel[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields: 'OBJECTID,OwnerName,OwnerType,InventoryClass,PID,LegalDescription',
			returnGeometry: 'true',
			outSR: '4326',
			resultRecordCount: '2000',
			f: 'json'
		});
		const res = await fetch(`${LAYER}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(12000)
		});
		if (!res.ok) return [];
		const data = (await res.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];

		const seen = new Set<string>();
		const out: PublicLandParcel[] = [];
		for (const f of data.features) {
			const a = f.attributes;
			const id = `vic-land-${str(a.OBJECTID) || hashCode(str(a.PID) + str(a.LegalDescription))}`;
			if (seen.has(id)) continue;
			seen.add(id);
			out.push({
				id,
				ownerName: titleCase(str(a.OwnerName)) || 'City of Victoria',
				ownerType: titleCase(str(a.OwnerType)) || 'Municipal',
				inventoryClass: spaceCamel(str(a.InventoryClass)) || 'Other',
				pid: str(a.PID) || undefined,
				legalDescription: str(a.LegalDescription) || undefined,
				municipality: 'victoria',
				coordinates: centroid(f.geometry?.rings),
				source: 'victoria-opendata'
			});
		}
		return out;
	} catch {
		return [];
	}
}

function centroid(rings: number[][][] | undefined): [number, number] | undefined {
	const ring = rings?.[0];
	if (!ring || ring.length === 0) return undefined;
	let sx = 0;
	let sy = 0;
	let n = 0;
	for (const pt of ring) {
		if (pt.length < 2 || !isFinite(pt[0]) || !isFinite(pt[1])) continue;
		sx += pt[0];
		sy += pt[1];
		n++;
	}
	if (n === 0) return undefined;
	const lng = sx / n;
	const lat = sy / n;
	if (lng > -124.2 && lng < -123.0 && lat > 48.2 && lat < 48.8) return [lng, lat];
	return undefined;
}

function getSeed(): PublicLandParcel[] {
	return [
		{
			id: 'vic-land-seed-1',
			ownerName: 'City of Victoria',
			ownerType: 'Municipal',
			inventoryClass: 'Park',
			pid: '000-000-000',
			legalDescription: 'Sample city-owned park parcel',
			municipality: 'victoria',
			coordinates: [-123.3657, 48.4287],
			source: 'seed'
		}
	];
}

function str(v: unknown): string {
	return v === null || v === undefined ? '' : String(v).trim();
}

function titleCase(s: string): string {
	return s ? s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()) : s;
}

/** "RoadROW" -> "Road ROW"; keeps existing spaces. */
function spaceCamel(s: string): string {
	return s.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const inventoryClass = url.searchParams.get('class');
	const limit = parseLimit(url.searchParams.get('limit'), 100, 500);

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(municipality)} does not publish a public-land inventory. Shown data covers City of Victoria holdings.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let parcels = await fetchVictoriaPublicLand();
	const live = parcels.length > 0;
	if (!live) parcels = getSeed();

	const byClass: Record<string, number> = {};
	for (const p of parcels) byClass[p.inventoryClass] = (byClass[p.inventoryClass] ?? 0) + 1;

	if (inventoryClass) parcels = parcels.filter((p) => p.inventoryClass === inventoryClass);
	const fullCount = parcels.length;
	parcels = parcels.slice(0, limit);

	return json(
		{
			data: parcels,
			meta: {
				total: fullCount,
				municipality,
				live,
				byClass,
				note: live
					? 'Parcels owned or leased by the City of Victoria (the public land bank).'
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
