import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GroceryFlyer, FlyerHighlight } from '$lib/types/index';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 3600; // 1 hour
const FLIPP_POSTAL = 'V8T1A1'; // Victoria, BC
const FLIPP_BASE = 'https://backflipp.wishabi.com/flipp';

/** Store metadata with coordinates and municipality coverage */
const STORE_META: Record<
	number,
	{ municipalities: string[]; coordinates: [number, number]; flyerPage: string }
> = {
	2328: {
		// Thrifty Foods
		municipalities: ['victoria', 'saanich', 'oak-bay', 'esquimalt', 'sidney', 'langford'],
		coordinates: [-123.3656, 48.4284],
		flyerPage: 'https://www.thriftyfoods.com/flyer'
	},
	2062: {
		// Save-On-Foods
		municipalities: ['victoria', 'saanich', 'langford', 'colwood', 'sooke'],
		coordinates: [-123.3708, 48.4518],
		flyerPage: 'https://www.saveonfoods.com/flyer'
	},
	4401: {
		// Fairway Markets
		municipalities: ['victoria', 'sidney'],
		coordinates: [-123.3814, 48.4393],
		flyerPage: 'https://www.fairwaymarket.com/flyer'
	},
	3403: {
		// Country Grocer
		municipalities: ['saanich', 'sidney', 'sooke'],
		coordinates: [-123.3966, 48.6523],
		flyerPage: 'https://www.countrygrocer.com/flyer/'
	},
	3500: {
		// Pepper's Foods
		municipalities: ['victoria'],
		coordinates: [-123.3448, 48.4192],
		flyerPage: 'https://peppersfoods.com/'
	},
	6472: {
		// The Root Cellar
		municipalities: ['saanich'],
		coordinates: [-123.3691, 48.4584],
		flyerPage: 'https://therootcellar.ca/'
	},
	234: {
		// Walmart
		municipalities: ['langford', 'saanich'],
		coordinates: [-123.4956, 48.4494],
		flyerPage: 'https://www.walmart.ca/flyer'
	},
	2596: {
		// Costco
		municipalities: ['langford'],
		coordinates: [-123.4853, 48.4527],
		flyerPage: 'https://www.costco.ca/warehouse-savings.html'
	},
	3572: {
		// Quality Foods
		municipalities: ['colwood', 'langford'],
		coordinates: [-123.4944, 48.4504],
		flyerPage: 'https://qualityfoods.com/flyer/'
	}
};

/** Grocery merchant IDs we care about from the Flipp API */
const GROCERY_MERCHANT_IDS = new Set(Object.keys(STORE_META).map(Number));

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
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(8000)
		});
		if (!res.ok) return [];
		const data = await res.json();
		const flyers: FlippFlyer[] = data.flyers || [];

		// Filter to grocery flyers from our known stores
		const groceryFlyers = flyers.filter(
			(f) =>
				GROCERY_MERCHANT_IDS.has(f.merchant_id) &&
				f.categories?.some((c: string) => c.toLowerCase().includes('grocer'))
		);

		// Fetch top highlights for each flyer in parallel (max 9)
		const results = await Promise.allSettled(
			groceryFlyers.slice(0, 9).map(async (flyer): Promise<GroceryFlyer> => {
				const meta = STORE_META[flyer.merchant_id];
				const highlights = await fetchFlyerHighlights(flyer.id);

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
					coordinates: meta?.coordinates,
					municipality: meta?.municipalities[0],
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
				headers: { Accept: 'application/json' },
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

	return seeds.map((s) => ({
		id: `seed-${s.slug}`,
		store: s.store,
		storeSlug: s.slug,
		merchantId: s.mid,
		title: 'Weekly Flyer',
		validFrom: from,
		validTo: to,
		flyerUrl: STORE_META[s.mid].flyerPage,
		coordinates: STORE_META[s.mid].coordinates,
		municipality: STORE_META[s.mid].municipalities[0],
		source: 'directory'
	}));
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
			.filter(([, meta]) => meta.municipalities.includes(municipality))
			.map(([mid]) => Number(mid));
		flyers = flyers.filter(
			(f) =>
				!f.municipality ||
				f.municipality === municipality ||
				(f.merchantId && storesByMuni.includes(f.merchantId))
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
