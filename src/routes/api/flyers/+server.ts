import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GroceryFlyer } from '$lib/types/index';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';
import { hashCode } from '$lib/utils/hash';

const CACHE_MAX_AGE = 3600; // 1 hour — flyers change weekly

interface FlyerSource {
	store: string;
	storeSlug: string;
	flyerPageUrl: string;
	municipalities: string[];
}

const FLYER_SOURCES: FlyerSource[] = [
	{
		store: 'Thrifty Foods',
		storeSlug: 'thrifty-foods',
		flyerPageUrl: 'https://www.thriftyfoods.com/flyer',
		municipalities: ['victoria', 'saanich', 'oak-bay', 'esquimalt', 'sidney', 'langford']
	},
	{
		store: 'Save-On-Foods',
		storeSlug: 'save-on-foods',
		flyerPageUrl: 'https://www.saveonfoods.com/flyer',
		municipalities: ['victoria', 'saanich', 'langford', 'colwood', 'sooke']
	},
	{
		store: 'Fairway Market',
		storeSlug: 'fairway-market',
		flyerPageUrl: 'https://www.fairwaymarket.com/flyer',
		municipalities: ['victoria', 'sidney']
	},
	{
		store: 'Country Grocer',
		storeSlug: 'country-grocer',
		flyerPageUrl: 'https://www.countrygrocer.com/flyer/',
		municipalities: ['saanich', 'sidney', 'sooke']
	},
	{
		store: 'Red Barn Market',
		storeSlug: 'red-barn-market',
		flyerPageUrl: 'https://redbarnmarket.ca/',
		municipalities: ['victoria', 'oak-bay']
	},
	{
		store: "Pepper's Foods",
		storeSlug: 'peppers-foods',
		flyerPageUrl: 'https://peppersfoods.com/',
		municipalities: ['victoria']
	}
];

function getCurrentWeekRange(): { from: string; to: string } {
	const now = new Date();
	const dayOfWeek = now.getDay();
	// Flyers typically run Thursday to Wednesday
	const thursdayOffset = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
	const start = new Date(now);
	start.setDate(now.getDate() - thursdayOffset);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	return {
		from: start.toISOString().split('T')[0],
		to: end.toISOString().split('T')[0]
	};
}

function getSeedFlyers(): GroceryFlyer[] {
	const { from, to } = getCurrentWeekRange();
	return FLYER_SOURCES.map((source) => ({
		id: `flyer-${source.storeSlug}-${hashCode(from)}`,
		store: source.store,
		storeSlug: source.storeSlug,
		title: `Weekly Flyer`,
		validFrom: from,
		validTo: to,
		flyerUrl: source.flyerPageUrl,
		municipality: source.municipalities[0],
		source: 'directory'
	}));
}

async function fetchRedFlagDealsFlyers(): Promise<GroceryFlyer[]> {
	try {
		const response = await fetch(
			'https://www.redflagdeals.com/in/victoria-bc/flyers/categories/groceries/',
			{
				headers: { 'User-Agent': 'SVIT/1.0 (civic-dashboard)', Accept: 'text/html' },
				signal: AbortSignal.timeout(8000)
			}
		);

		if (!response.ok) return [];

		const html = await response.text();
		const flyers: GroceryFlyer[] = [];
		const { from, to } = getCurrentWeekRange();

		// Extract store flyers from the page
		const storeRegex =
			/<a[^>]*href="([^"]*\/flyers\/[^"]*)"[^>]*>[\s\S]*?<span[^>]*class="[^"]*store-name[^"]*"[^>]*>([^<]+)<\/span>/gi;
		let match;
		while ((match = storeRegex.exec(html)) !== null) {
			const url = match[1];
			const storeName = match[2].trim();
			if (storeName && url) {
				const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
				flyers.push({
					id: `rfd-${slug}-${hashCode(url)}`,
					store: storeName,
					storeSlug: slug,
					title: 'Weekly Flyer',
					validFrom: from,
					validTo: to,
					flyerUrl: url.startsWith('http') ? url : `https://www.redflagdeals.com${url}`,
					source: 'redflagdeals'
				});
			}
		}

		return flyers;
	} catch {
		return [];
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const limit = parseLimit(url.searchParams.get('limit'), 20);

	let flyers = await fetchRedFlagDealsFlyers();

	// Merge with seed data (always include local stores)
	const seedFlyers = getSeedFlyers();
	const existingSlugs = new Set(flyers.map((f) => f.storeSlug));
	for (const seed of seedFlyers) {
		if (!existingSlugs.has(seed.storeSlug)) {
			flyers.push(seed);
		}
	}

	if (municipality) {
		const seedByMuni = FLYER_SOURCES.filter((s) => s.municipalities.includes(municipality)).map(
			(s) => s.storeSlug
		);
		flyers = flyers.filter(
			(f) => !f.municipality || f.municipality === municipality || seedByMuni.includes(f.storeSlug)
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
