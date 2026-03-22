import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GroceryFlyer, FlyerHighlight, StoreLocation } from '$lib/types/index';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 3600; // 1 hour
const FLIPP_POSTAL = 'V8T1A1'; // Victoria, BC
const FLIPP_BASE = 'https://backflipp.wishabi.com/flipp';

interface StoreMeta {
	locations: StoreLocation[];
	flyerPage: string;
}

/** Store metadata with all individual locations and municipality coverage */
const STORE_META: Record<number, StoreMeta> = {
	2328: {
		// Thrifty Foods — 10 CRD locations
		locations: [
			{
				name: 'Thrifty Foods — Fairfield',
				municipality: 'victoria',
				coordinates: [-123.3438, 48.4173]
			},
			{
				name: 'Thrifty Foods — Hillside',
				municipality: 'victoria',
				coordinates: [-123.3491, 48.4421]
			},
			{
				name: 'Thrifty Foods — James Bay',
				municipality: 'victoria',
				coordinates: [-123.3706, 48.4095]
			},
			{
				name: 'Thrifty Foods — Cloverdale',
				municipality: 'saanich',
				coordinates: [-123.3476, 48.4398]
			},
			{
				name: 'Thrifty Foods — Broadmead',
				municipality: 'saanich',
				coordinates: [-123.358, 48.4741]
			},
			{
				name: 'Thrifty Foods — McKenzie',
				municipality: 'saanich',
				coordinates: [-123.365, 48.4584]
			},
			{
				name: 'Thrifty Foods — Admirals Walk',
				municipality: 'esquimalt',
				coordinates: [-123.41, 48.4454]
			},
			{ name: 'Thrifty Foods — Sidney', municipality: 'sidney', coordinates: [-123.3963, 48.6507] },
			{
				name: 'Thrifty Foods — Central Saanich',
				municipality: 'central-saanich',
				coordinates: [-123.4139, 48.5685]
			},
			{
				name: 'Thrifty Foods — Belmont Market',
				municipality: 'langford',
				coordinates: [-123.5016, 48.449]
			}
		],
		flyerPage: 'https://www.thriftyfoods.com/flyer'
	},
	2062: {
		// Save-On-Foods — 8 CRD locations
		locations: [
			{
				name: 'Save-On-Foods — Pandora',
				municipality: 'victoria',
				coordinates: [-123.3618, 48.4267]
			},
			{
				name: 'Save-On-Foods — Westside Village',
				municipality: 'victoria',
				coordinates: [-123.3847, 48.4384]
			},
			{
				name: 'Save-On-Foods — Fort & Foul Bay',
				municipality: 'victoria',
				coordinates: [-123.3383, 48.4274]
			},
			{
				name: 'Save-On-Foods — Tillicum',
				municipality: 'saanich',
				coordinates: [-123.3832, 48.4521]
			},
			{
				name: 'Save-On-Foods — Uptown',
				municipality: 'saanich',
				coordinates: [-123.3565, 48.4518]
			},
			{
				name: 'Save-On-Foods — Langford',
				municipality: 'langford',
				coordinates: [-123.4957, 48.4494]
			},
			{
				name: 'Save-On-Foods — Colwood',
				municipality: 'colwood',
				coordinates: [-123.4928, 48.4374]
			},
			{ name: 'Save-On-Foods — Quadra', municipality: 'saanich', coordinates: [-123.348, 48.4527] }
		],
		flyerPage: 'https://www.saveonfoods.com/flyer'
	},
	4401: {
		// Fairway Markets — 8 CRD locations
		locations: [
			{
				name: 'Fairway Market — Quadra Village',
				municipality: 'victoria',
				coordinates: [-123.3555, 48.4398]
			},
			{
				name: 'Fairway Market — Gorge',
				municipality: 'victoria',
				coordinates: [-123.3814, 48.448]
			},
			{
				name: 'Fairway Market — McKenzie',
				municipality: 'saanich',
				coordinates: [-123.3691, 48.4584]
			},
			{
				name: 'Fairway Market — Shelbourne',
				municipality: 'saanich',
				coordinates: [-123.3387, 48.4532]
			},
			{
				name: 'Fairway Market — Oak Bay',
				municipality: 'oak-bay',
				coordinates: [-123.3194, 48.4265]
			},
			{ name: 'Fairway Market — Sidney', municipality: 'sidney', coordinates: [-123.399, 48.6493] },
			{
				name: 'Fairway Market — Brentwood Bay',
				municipality: 'central-saanich',
				coordinates: [-123.4573, 48.5715]
			},
			{
				name: 'Fairway Market — Goldstream',
				municipality: 'langford',
				coordinates: [-123.51, 48.4479]
			}
		],
		flyerPage: 'https://www.fairwaymarket.com/flyer'
	},
	3403: {
		// Country Grocer — 2 CRD locations
		locations: [
			{
				name: 'Country Grocer — Esquimalt',
				municipality: 'esquimalt',
				coordinates: [-123.3912, 48.4318]
			},
			{
				name: 'Country Grocer — Royal Oak',
				municipality: 'saanich',
				coordinates: [-123.3966, 48.4633]
			}
		],
		flyerPage: 'https://www.countrygrocer.com/flyer/'
	},
	3500: {
		// Pepper's Foods — 1 location
		locations: [
			{
				name: "Pepper's Foods — Cadboro Bay",
				municipality: 'saanich',
				coordinates: [-123.2987, 48.4558]
			}
		],
		flyerPage: 'https://peppersfoods.com/'
	},
	6472: {
		// The Root Cellar — 1 location
		locations: [
			{
				name: 'The Root Cellar — McKenzie',
				municipality: 'saanich',
				coordinates: [-123.3691, 48.4584]
			}
		],
		flyerPage: 'https://therootcellar.ca/'
	},
	234: {
		// Walmart — 2 CRD locations
		locations: [
			{ name: 'Walmart — Langford', municipality: 'langford', coordinates: [-123.4956, 48.4494] },
			{ name: 'Walmart — Uptown', municipality: 'saanich', coordinates: [-123.3567, 48.453] }
		],
		flyerPage: 'https://www.walmart.ca/flyer'
	},
	2596: {
		// Costco — 1 location
		locations: [
			{ name: 'Costco — Langford', municipality: 'langford', coordinates: [-123.4853, 48.4527] }
		],
		flyerPage: 'https://www.costco.ca/warehouse-savings.html'
	},
	3572: {
		// Quality Foods — 2 CRD locations
		locations: [
			{
				name: 'Quality Foods — Langford',
				municipality: 'langford',
				coordinates: [-123.4944, 48.4504]
			},
			{
				name: 'Quality Foods — Royal Bay',
				municipality: 'colwood',
				coordinates: [-123.4851, 48.4197]
			}
		],
		flyerPage: 'https://qualityfoods.com/flyer/'
	}
};

/** Grocery merchant IDs we care about from the Flipp API */
const GROCERY_MERCHANT_IDS = new Set(Object.keys(STORE_META).map(Number));

/** Multi-category merchants that also sell non-grocery items (e.g. electronics, home).
 *  For these, we still require a grocery category tag to avoid including irrelevant flyers. */
const MULTI_CATEGORY_MERCHANTS = new Set([234, 2596]); // Walmart, Costco

/** Shared headers for Flipp API requests to avoid bot blocking */
const FLIPP_HEADERS: HeadersInit = {
	Accept: 'application/json',
	'User-Agent': 'SVIT/1.0 (South Vancouver Island Tracker; civic dashboard)'
};

interface FlippFlyer {
	id: number;
	merchant: string;
	merchant_id: number;
	name: string;
	valid_from: string;
	valid_to: string;
	thumbnail_url?: string;
	categories?: string[];
}

interface FlippItem {
	id: number;
	name: string;
	price?: string;
	cutout_image_url?: string;
}

async function fetchFlippFlyers(): Promise<GroceryFlyer[]> {
	try {
		const res = await fetch(`${FLIPP_BASE}/flyers?locale=en-ca&postal_code=${FLIPP_POSTAL}`, {
			headers: FLIPP_HEADERS,
			signal: AbortSignal.timeout(8000)
		});
		if (!res.ok) return [];
		const data = await res.json();
		const flyers: FlippFlyer[] = data.flyers || [];

		// Filter to grocery flyers from our known stores.
		// Grocery-only merchants (Thrifty, Save-On, Fairway, etc.) are included directly.
		// Multi-category merchants (Walmart, Costco) also require a grocery category tag
		// to avoid including their electronics, home, or clothing flyers.
		const hasGroceryCategory = (f: FlippFlyer) =>
			f.categories?.some((c: string) => c.toLowerCase().includes('grocer'));
		const groceryFlyers = flyers.filter(
			(f) =>
				GROCERY_MERCHANT_IDS.has(f.merchant_id) &&
				(!MULTI_CATEGORY_MERCHANTS.has(f.merchant_id) || hasGroceryCategory(f))
		);

		// Fetch top highlights for each flyer in parallel (max 9)
		const results = await Promise.allSettled(
			groceryFlyers.slice(0, 9).map(async (flyer): Promise<GroceryFlyer> => {
				const meta = STORE_META[flyer.merchant_id];
				const highlights = await fetchFlyerHighlights(flyer.id);
				const primaryLoc = meta?.locations[0];

				return {
					id: `flipp-${flyer.merchant_id}-${flyer.id}`,
					store: flyer.merchant,
					storeSlug: flyer.merchant.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
					merchantId: flyer.merchant_id,
					title: flyer.name || 'Weekly Flyer',
					validFrom: flyer.valid_from?.split('T')[0] || '',
					validTo: flyer.valid_to?.split('T')[0] || '',
					flyerUrl: meta?.flyerPage || `https://flipp.com/flyer/${flyer.id}`,
					thumbnailUrl: flyer.thumbnail_url,
					itemCount: highlights.itemCount,
					highlights: highlights.items,
					coordinates: primaryLoc?.coordinates,
					locations: meta?.locations,
					municipality: primaryLoc?.municipality,
					source: 'flipp'
				};
			})
		);

		return results
			.filter((r): r is PromiseFulfilledResult<GroceryFlyer> => r.status === 'fulfilled')
			.map((r) => r.value);
	} catch {
		return [];
	}
}

async function fetchFlyerHighlights(
	flyerId: number
): Promise<{ items: FlyerHighlight[]; itemCount: number }> {
	try {
		const res = await fetch(
			`${FLIPP_BASE}/flyers/${flyerId}?locale=en-ca&postal_code=${FLIPP_POSTAL}`,
			{
				headers: FLIPP_HEADERS,
				signal: AbortSignal.timeout(6000)
			}
		);
		if (!res.ok) return { items: [], itemCount: 0 };
		const data = await res.json();
		const items: FlippItem[] = data.items || [];

		// Pick top 4 items that have a price and name
		const highlights: FlyerHighlight[] = items
			.filter((i) => i.name && i.price)
			.slice(0, 4)
			.map((i) => ({
				name: i.name,
				price: i.price,
				imageUrl: i.cutout_image_url
			}));

		return { items: highlights, itemCount: items.length };
	} catch {
		return { items: [], itemCount: 0 };
	}
}

/** Seed data fallback when Flipp API is down */
function getSeedFlyers(): GroceryFlyer[] {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const thursdayOffset = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
	const start = new Date(now);
	start.setDate(now.getDate() - thursdayOffset);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	const from = start.toISOString().split('T')[0];
	const to = end.toISOString().split('T')[0];

	const seeds: Array<{ store: string; slug: string; mid: number }> = [
		{ store: 'Thrifty Foods', slug: 'thrifty-foods', mid: 2328 },
		{ store: 'Save-On-Foods', slug: 'save-on-foods', mid: 2062 },
		{ store: 'Fairway Market', slug: 'fairway-market', mid: 4401 },
		{ store: 'Country Grocer', slug: 'country-grocer', mid: 3403 },
		{ store: "Pepper's Foods", slug: 'peppers-foods', mid: 3500 },
		{ store: 'The Root Cellar', slug: 'root-cellar', mid: 6472 }
	];

	return seeds.map((s) => {
		const meta = STORE_META[s.mid];
		const primaryLoc = meta.locations[0];
		return {
			id: `seed-${s.slug}`,
			store: s.store,
			storeSlug: s.slug,
			merchantId: s.mid,
			title: 'Weekly Flyer',
			validFrom: from,
			validTo: to,
			flyerUrl: meta.flyerPage,
			coordinates: primaryLoc.coordinates,
			locations: meta.locations,
			municipality: primaryLoc.municipality,
			source: 'directory'
		};
	});
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const limit = parseLimit(url.searchParams.get('limit'), 20);

	let flyers = await fetchFlippFlyers();

	// Fall back to seed data if Flipp returns nothing
	if (flyers.length === 0) {
		flyers = getSeedFlyers();
	}

	if (municipality) {
		const storesByMuni = Object.entries(STORE_META)
			.filter(([, meta]) => meta.locations.some((l) => l.municipality === municipality))
			.map(([mid]) => Number(mid));
		flyers = flyers.filter(
			(f) =>
				!f.municipality ||
				f.municipality === municipality ||
				(f.merchantId && storesByMuni.includes(f.merchantId)) ||
				f.locations?.some((l) => l.municipality === municipality)
		);
	}

	flyers = flyers.slice(0, limit);

	return json(
		{
			data: flyers,
			meta: { total: flyers.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=7200`
			}
		}
	);
};
