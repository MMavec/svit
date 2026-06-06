import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PowerOutage } from '$lib/types/index';
import { parseLimit } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 120; // 2 minutes (outages move fast)

// BC Hydro's outage map is backed by this undocumented public JSON feed (no key).
const BCHYDRO = 'https://www.bchydro.com/power-outages/app/outages-map-data.json';

// Greater Victoria / CRD bounding box. The feed is province-wide; filter by coordinate.
const CRD = { minLat: 48.3, maxLat: 48.72, minLng: -123.95, maxLng: -123.2 };
// Wider Vancouver Island box for the "elsewhere on the Island" context count.
const ISLAND = { minLat: 48.2, maxLat: 51.0, minLng: -128.5, maxLng: -123.0 };

interface RawOutage {
	id?: number;
	municipality?: string;
	area?: string;
	cause?: string;
	numCustomersOut?: number;
	crewStatusDescription?: string;
	crewEta?: number | null;
	dateOff?: number | null;
	lastUpdated?: number | null;
	latitude?: number;
	longitude?: number;
}

function inBox(o: RawOutage, b: typeof CRD): boolean {
	return (
		typeof o.latitude === 'number' &&
		typeof o.longitude === 'number' &&
		o.latitude >= b.minLat &&
		o.latitude <= b.maxLat &&
		o.longitude >= b.minLng &&
		o.longitude <= b.maxLng
	);
}

function iso(ms: number | null | undefined): string | undefined {
	if (!ms || !isFinite(ms)) return undefined;
	const d = new Date(ms);
	return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function mapOutage(o: RawOutage): PowerOutage {
	return {
		id: `bch-${o.id ?? Math.round((o.latitude ?? 0) * 1e4)}`,
		municipality: String(o.municipality || 'Unknown').trim(),
		area: String(o.area || '').trim(),
		cause: String(o.cause || 'Under investigation').trim(),
		customersAffected: Number(o.numCustomersOut) || 0,
		crewStatus: o.crewStatusDescription ? String(o.crewStatusDescription).trim() : undefined,
		eta: iso(o.crewEta),
		off: iso(o.dateOff),
		lastUpdated: iso(o.lastUpdated),
		coordinates:
			typeof o.latitude === 'number' && typeof o.longitude === 'number'
				? [o.longitude, o.latitude]
				: undefined,
		source: 'bc-hydro'
	};
}

/** Returns the outage array, or null if the feed could not be reached. */
async function fetchOutages(): Promise<RawOutage[] | null> {
	try {
		const res = await fetch(BCHYDRO, {
			headers: { 'User-Agent': 'Mozilla/5.0 (SVIT civic dashboard)' },
			signal: AbortSignal.timeout(10000)
		});
		if (!res.ok) return null;
		const data = await res.json();
		const arr = Array.isArray(data) ? data : (data?.outages ?? data?.data ?? []);
		return Array.isArray(arr) ? (arr as RawOutage[]) : [];
	} catch {
		return null;
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const limit = parseLimit(url.searchParams.get('limit'), 40);

	const raw = await fetchOutages();
	const live = raw !== null;
	const all = raw ?? [];
	const islandCount = all.filter((o) => inBox(o, ISLAND)).length;

	let outages = all
		.filter((o) => inBox(o, CRD))
		.map(mapOutage)
		.sort((a, b) => b.customersAffected - a.customersAffected);

	const customersOut = outages.reduce((s, o) => s + o.customersAffected, 0);
	const fullCount = outages.length;
	outages = outages.slice(0, limit);

	return json(
		{
			data: outages,
			meta: {
				total: fullCount,
				live,
				customersOut,
				islandCount,
				note: !live
					? 'BC Hydro outage feed is temporarily unavailable.'
					: fullCount > 0
						? `${fullCount} active outage${fullCount === 1 ? '' : 's'} in Greater Victoria.`
						: islandCount > 0
							? `Power is on across Greater Victoria. ${islandCount} outage${islandCount === 1 ? '' : 's'} elsewhere on Vancouver Island.`
							: 'No active power outages in Greater Victoria.'
			}
		},
		{
			headers: { 'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=300` }
		}
	);
};
