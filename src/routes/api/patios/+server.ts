import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PatioArea } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 86400; // 24 hours (slow-changing licence inventory)

// City of Victoria — Patio Area polygons (parklets, hubs, patio licences). NOTE: business name /
// address / licence fields are 100% null in this feed; only PatioAreaType + a free-text note exist.
const LAYER = 'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_City/MapServer/31';
const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { rings?: number[][][] };
}

async function fetchVictoriaPatios(): Promise<PatioArea[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields: 'OBJECTID,PatioAreaType,Comments',
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
		const out: PatioArea[] = [];
		for (const f of data.features) {
			const a = f.attributes;
			const id = `vic-patio-${str(a.OBJECTID) || hashCode(str(a.PatioAreaType) + str(a.Comments))}`;
			if (seen.has(id)) continue;
			seen.add(id);
			out.push({
				id,
				patioType: titleCase(str(a.PatioAreaType)) || 'Patio',
				note: str(a.Comments) || undefined,
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

function getSeed(): PatioArea[] {
	return [
		{
			id: 'vic-patio-seed-1',
			patioType: 'Parklet',
			note: 'Downtown',
			municipality: 'victoria',
			coordinates: [-123.3675, 48.4255],
			source: 'seed'
		},
		{
			id: 'vic-patio-seed-2',
			patioType: 'Patio Licence',
			note: '2023',
			municipality: 'victoria',
			coordinates: [-123.366, 48.4248],
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
	const type = parseEnum(
		url.searchParams.get('type'),
		new Set(['Parklet', 'Hub', 'Bbv Licence', 'Patio Licence'])
	);
	const limit = parseLimit(url.searchParams.get('limit'), 80, 200);

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(municipality)} patio data is not in this open feed. Shown data covers the City of Victoria.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let patios = await fetchVictoriaPatios();
	const live = patios.length > 0;
	if (!live) patios = getSeed();

	const byType: Record<string, number> = {};
	for (const p of patios) byType[p.patioType] = (byType[p.patioType] ?? 0) + 1;

	if (type) patios = patios.filter((p) => p.patioType === type);
	const fullCount = patios.length;
	patios = patios.slice(0, limit);

	return json(
		{
			data: patios,
			meta: {
				total: fullCount,
				municipality,
				live,
				byType,
				note: live
					? 'Outdoor patio & parklet areas, City of Victoria. (Business names are not in this open dataset.)'
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
