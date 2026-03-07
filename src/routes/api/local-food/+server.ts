import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LocalFoodItem } from '$lib/types/index';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 3600; // 1 hour

const validCategories = new Set([
	'farm',
	'winery',
	'brewery',
	'cidery',
	'distillery',
	'market',
	'restaurant'
] as const);

function getSeedData(): LocalFoodItem[] {
	return [
		// Wineries & Cideries
		{
			id: 'lf-church-state',
			name: 'Church & State Wines',
			category: 'winery',
			description:
				'Award-winning winery on the Saanich Peninsula with tasting room, bistro, and stunning vineyard views. Known for Pinot Noir and Syrah.',
			address: '1445 Benvenuto Ave, Central Saanich',
			municipality: 'central-saanich',
			url: 'https://churchandstatewines.com',
			phone: '250-652-2671',
			hours: 'Daily 11am-5pm',
			source: 'directory'
		},
		{
			id: 'lf-sea-cider',
			name: 'Sea Cider Farm & Ciderhouse',
			category: 'cidery',
			description:
				'Celebrated cidery on the Saanich Peninsula producing artisanal ciders from heritage apple varieties. Picnic area with ocean views.',
			address: '2487 Mt St Michael Rd, Saanichton',
			municipality: 'central-saanich',
			url: 'https://seacider.ca',
			phone: '250-544-4824',
			hours: 'Thu-Sun 11am-5pm',
			source: 'directory'
		},
		{
			id: 'lf-deep-cove',
			name: 'Deep Cove Winery',
			category: 'winery',
			description:
				'Boutique winery producing small-lot wines from Vancouver Island grapes. Intimate tasting room by appointment.',
			address: '11190 Chalet Rd, North Saanich',
			municipality: 'north-saanich',
			url: 'https://deepcovewinery.ca',
			source: 'directory'
		},
		{
			id: 'lf-merridale',
			name: 'Merridale Cidery & Distillery',
			category: 'cidery',
			description:
				'Farm-based cidery and distillery in the Cobble Hill area. Restaurant, wood-fired pizza, and extensive grounds.',
			address: '1230 Merridale Rd, Cobble Hill',
			url: 'https://merridalecider.com',
			phone: '250-743-4293',
			hours: 'Daily 10:30am-5:30pm',
			source: 'directory'
		},
		// Breweries
		{
			id: 'lf-spinnakers',
			name: 'Spinnakers Gastro Brewpub',
			category: 'brewery',
			description:
				"Canada's first brewpub, est. 1984. Waterfront dining with house-brewed ales, local food, and harbour views.",
			address: '308 Catherine St, Victoria',
			municipality: 'victoria',
			url: 'https://spinnakers.com',
			phone: '250-386-2739',
			hours: 'Daily 8am-11pm',
			source: 'directory'
		},
		{
			id: 'lf-driftwood',
			name: 'Driftwood Brewery',
			category: 'brewery',
			description:
				'Award-winning craft brewery known for Fat Tug IPA and seasonal releases. Tasting room in Esquimalt.',
			address: '836 Viewfield Rd, Esquimalt',
			municipality: 'esquimalt',
			url: 'https://driftwoodbeer.com',
			phone: '250-381-2739',
			hours: 'Mon-Sat 11am-6pm',
			source: 'directory'
		},
		{
			id: 'lf-hoyne',
			name: 'Hoyne Brewing',
			category: 'brewery',
			description:
				'Popular craft brewery in Rock Bay producing Dark Matter, Helios Dortmunder, and seasonal brews. Spacious tasting room.',
			address: '2740 Bridge St, Victoria',
			municipality: 'victoria',
			url: 'https://hoynebrewing.com',
			phone: '250-590-8767',
			source: 'directory'
		},
		{
			id: 'lf-phillips',
			name: 'Phillips Brewing & Malting Co.',
			category: 'brewery',
			description:
				'Iconic Victoria brewery known for Blue Buck Ale and creative seasonal beers. Tasting room and retail store.',
			address: '2010 Government St, Victoria',
			municipality: 'victoria',
			url: 'https://phillipsbeer.com',
			phone: '250-380-1912',
			source: 'directory'
		},
		{
			id: 'lf-category12',
			name: 'Category 12 Brewing',
			category: 'brewery',
			description:
				'Saanich Peninsula craft brewery with taproom. Known for Disruption IPA and barrel-aged specialties.',
			address: '2200 Keating Cross Rd, Central Saanich',
			municipality: 'central-saanich',
			url: 'https://category12beer.com',
			source: 'directory'
		},
		// Distillery
		{
			id: 'lf-victoria-distillers',
			name: 'Victoria Distillers',
			category: 'distillery',
			description:
				'Waterfront distillery in Sidney producing Empress 1908 Gin and other craft spirits. Tours and tastings available.',
			address: '9891 Seaport Pl, Sidney',
			municipality: 'sidney',
			url: 'https://victoriadistillers.com',
			phone: '250-544-8218',
			source: 'directory'
		},
		// Farm Markets
		{
			id: 'lf-moss-st-market',
			name: 'Moss Street Market',
			category: 'market',
			description:
				'Saturday farmers market running May-October with 100+ vendors. Local produce, artisan goods, baked goods, and live music.',
			address: 'Sir James Douglas School, Fairfield',
			municipality: 'victoria',
			url: 'https://mossstreetmarket.com',
			seasonal: true,
			source: 'directory'
		},
		{
			id: 'lf-victoria-public-market',
			name: 'Victoria Public Market at the Hudson',
			category: 'market',
			description:
				"Year-round indoor market in the historic Hudson's Bay building. Local vendors, artisan food, and specialty shops.",
			address: '1701 Douglas St, Victoria',
			municipality: 'victoria',
			url: 'https://victoriapublicmarket.com',
			hours: 'Wed-Sun 10am-5pm',
			source: 'directory'
		},
		{
			id: 'lf-root-cellar',
			name: 'The Root Cellar Village Green Grocer',
			category: 'farm',
			description:
				'Massive local produce store with island-grown fruits, vegetables, and specialty items. Known for unbeatable prices on local produce.',
			address: '1286 McKenzie Ave, Saanich',
			municipality: 'saanich',
			url: 'https://therootcellar.ca',
			hours: 'Daily 8am-8pm',
			source: 'directory'
		},
		{
			id: 'lf-island-farm-fresh',
			name: 'Island Farm Fresh',
			category: 'farm',
			description:
				'Directory of direct-from-farm vendors across Southern Vancouver Island. Find local farms, u-picks, and farm stands.',
			address: 'Saanichton, BC',
			municipality: 'central-saanich',
			url: 'https://islandfarmfresh.com',
			source: 'directory'
		},
		{
			id: 'lf-red-barn',
			name: 'Red Barn Market',
			category: 'market',
			description:
				'Local grocery market specializing in island-grown produce, artisan products, and prepared foods. Two locations.',
			address: '5550 West Saanich Rd, Saanich',
			municipality: 'saanich',
			url: 'https://redbarnmarket.ca',
			hours: 'Daily 8am-8pm',
			source: 'directory'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const category = parseEnum(url.searchParams.get('category'), validCategories);
	const limit = parseLimit(url.searchParams.get('limit'), 30);

	let items = getSeedData();

	if (municipality) {
		items = items.filter((item) => !item.municipality || item.municipality === municipality);
	}

	if (category) {
		items = items.filter((item) => item.category === category);
	}

	// Sort: wineries/breweries first (the 50+ demographic's preference), then farms/markets
	const categoryOrder: Record<string, number> = {
		winery: 0,
		cidery: 1,
		brewery: 2,
		distillery: 3,
		market: 4,
		farm: 5,
		restaurant: 6
	};
	items.sort((a, b) => (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99));

	items = items.slice(0, limit);

	return json(
		{
			data: items,
			meta: { total: items.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=7200`
			}
		}
	);
};
