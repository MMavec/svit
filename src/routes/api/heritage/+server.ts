import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { HeritageSite } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 86400; // 24 hours (static heritage register)

// City of Victoria — Prominent Heritage Sites (the only heritage layer with name + address).
// Building-footprint polygons; we compute a centroid client-side for the map pin.
const LAYER =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_PlanningAndDevelopment/MapServer/8';
const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { rings?: number[][][] };
}

async function fetchVictoriaHeritage(): Promise<HeritageSite[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields: 'OBJECTID,Name,Address,Protected',
			returnGeometry: 'true',
			outSR: '4326',
			resultRecordCount: '200',
			f: 'json'
		});
		const res = await fetch(`${LAYER}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!res.ok) return [];
		const data = (await res.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];

		const seen = new Set<string>();
		const out: HeritageSite[] = [];
		for (const f of data.features) {
			const a = f.attributes;
			const name = titleCase(str(a.Name)) || 'Heritage site';
			const id = `vic-her-${str(a.OBJECTID) || hashCode(name)}`;
			if (seen.has(id)) continue;
			seen.add(id);
			out.push({
				id,
				name,
				address: str(a.Address) ? titleCase(str(a.Address)) : undefined,
				isProtected: /^y/i.test(str(a.Protected)),
				municipality: 'victoria',
				coordinates: centroid(f.geometry?.rings),
				source: 'victoria-opendata'
			});
		}
		return out.sort((x, y) => x.name.localeCompare(y.name));
	} catch {
		return [];
	}
}

/** Average of the outer ring's vertices — good enough for a map pin on a building footprint. */
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

function getSeed(): HeritageSite[] {
	return [
		{
			id: 'vic-her-seed-1',
			name: 'Craigdarroch Castle',
			address: '1050 Joan Cres',
			isProtected: true,
			municipality: 'victoria',
			coordinates: [-123.34896, 48.42388],
			source: 'seed'
		},
		{
			id: 'vic-her-seed-2',
			name: 'Christ Church Cathedral',
			address: '911 Quadra St',
			isProtected: true,
			municipality: 'victoria',
			coordinates: [-123.36213, 48.42374],
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

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const protectedOnly = url.searchParams.get('protected') === 'true';
	const limit = parseLimit(url.searchParams.get('limit'), 60);

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(municipality)} does not publish an open heritage register. Shown data covers the City of Victoria.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let sites = await fetchVictoriaHeritage();
	const live = sites.length > 0;
	if (!live) sites = getSeed();

	const protectedCount = sites.filter((s) => s.isProtected).length;
	if (protectedOnly) sites = sites.filter((s) => s.isProtected);
	const fullCount = sites.length;
	sites = sites.slice(0, limit);

	return json(
		{
			data: sites,
			meta: {
				total: fullCount,
				municipality,
				live,
				protectedCount,
				note: live
					? 'Prominent heritage sites, City of Victoria. (Legally protected status shown per site.)'
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
