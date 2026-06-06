import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CoolingResource } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 21600; // 6 hours

// City of Victoria — Extreme Heat Resources (cooling centres, water fountains, misting/spray, pools).
const LAYER =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_EmergencyServices/MapServer/11';
const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { x: number; y: number };
}

const INDOOR = new Set(['Community Centre', 'Library', 'Mall']);
const WATER = new Set([
	'Portable Water Fountain',
	'Misting Station',
	'Spray Parks',
	'Swimming Pools and Docks'
]);

async function fetchVictoriaCooling(): Promise<CoolingResource[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields: 'OBJECTID,Name,HeatResourceType,LocationDescription,Hours,PetFriendly',
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
		const out: CoolingResource[] = [];
		for (const f of data.features) {
			const a = f.attributes;
			const resourceType = str(a.HeatResourceType);
			const name = str(a.Name) || resourceType || 'Cooling resource';
			const hoursRaw = str(a.Hours);
			const id = `vic-cool-${str(a.OBJECTID) || hashCode(name + str(a.LocationDescription))}`;
			if (seen.has(id)) continue;
			seen.add(id);
			out.push({
				id,
				name,
				category: INDOOR.has(resourceType) ? 'indoor' : WATER.has(resourceType) ? 'water' : 'other',
				resourceType: resourceType || 'Resource',
				location: str(a.LocationDescription) || undefined,
				hours: hoursRaw && !/^https?:\/\//i.test(hoursRaw) ? hoursRaw : undefined,
				hoursUrl: /^https?:\/\//i.test(hoursRaw) ? hoursRaw : undefined,
				petFriendly: str(a.PetFriendly) || undefined,
				municipality: 'victoria',
				coordinates: coords(f.geometry),
				source: 'victoria-opendata'
			});
		}
		return out;
	} catch {
		return [];
	}
}

function getSeed(): CoolingResource[] {
	return [
		{
			id: 'vic-cool-seed-1',
			name: 'Central Library',
			category: 'indoor',
			resourceType: 'Library',
			location: '735 Broughton St',
			municipality: 'victoria',
			coordinates: [-123.36405, 48.42542],
			source: 'seed'
		},
		{
			id: 'vic-cool-seed-2',
			name: 'Portable Water Fountain',
			category: 'water',
			resourceType: 'Portable Water Fountain',
			location: 'Centennial Square',
			municipality: 'victoria',
			coordinates: [-123.36556, 48.42878],
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

const CAT_VALUES = new Set<CoolingResource['category']>(['indoor', 'water', 'other']);

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const category = parseEnum(url.searchParams.get('category'), CAT_VALUES);
	const limit = parseLimit(url.searchParams.get('limit'), 60);

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(municipality)} does not publish a cooling-resource feed. Shown data covers the City of Victoria.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let resources = await fetchVictoriaCooling();
	const live = resources.length > 0;
	if (!live) resources = getSeed();

	const byCategory: Record<string, number> = {};
	for (const r of resources) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;

	if (category) resources = resources.filter((r) => r.category === category);
	const fullCount = resources.length;
	resources = resources.slice(0, limit);

	return json(
		{
			data: resources,
			meta: {
				total: fullCount,
				municipality,
				live,
				byCategory,
				note: live
					? 'Extreme-heat relief: cooling centres and public water, City of Victoria.'
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
