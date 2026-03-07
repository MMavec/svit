import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ParkFacility } from '$lib/types/index';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 3600; // 1 hour — parks data is mostly static

const validTypes = new Set([
	'park',
	'playground',
	'splash-pad',
	'pool',
	'rec-centre',
	'sports-field',
	'trail',
	'beach'
] as const);

function getSeedData(): ParkFacility[] {
	return [
		// Parks
		{
			id: 'park-beacon-hill',
			name: 'Beacon Hill Park',
			type: 'park',
			description:
				"200-acre urban park with gardens, petting zoo, playgrounds, cricket pitch, and oceanfront walks. Victoria's signature green space.",
			address: 'Circle Dr, Victoria',
			municipality: 'victoria',
			amenities: [
				'playground',
				'petting zoo',
				'walking paths',
				'gardens',
				'sports fields',
				'washrooms'
			],
			url: 'https://www.victoria.ca/parks-recreation/parks/beacon-hill-park',
			coordinates: [-123.3615, 48.4118],
			source: 'directory'
		},
		{
			id: 'park-mount-doug',
			name: 'Mount Douglas Park',
			type: 'park',
			description:
				'188-hectare park with hiking trails to summit viewpoint. Beach access, old-growth forest, and wildlife viewing.',
			address: 'Churchill Dr, Saanich',
			municipality: 'saanich',
			amenities: ['hiking trails', 'beach', 'viewpoint', 'parking', 'dog-friendly'],
			url: 'https://www.saanich.ca/EN/main/parks-recreation-community/parks/mount-douglas-park.html',
			coordinates: [-123.3425, 48.493],
			source: 'directory'
		},
		{
			id: 'park-elk-lake',
			name: 'Elk/Beaver Lake Regional Park',
			type: 'park',
			description:
				'Popular CRD regional park with swimming, rowing, fishing, and 10km of trails. Sandy beach with picnic areas.',
			address: 'Elk Lake Dr, Saanich',
			municipality: 'saanich',
			amenities: ['swimming', 'trails', 'picnic areas', 'boat launch', 'beach', 'parking'],
			coordinates: [-123.3944, 48.52],
			source: 'directory'
		},
		{
			id: 'park-thetis',
			name: 'Thetis Lake Regional Park',
			type: 'park',
			description:
				'Freshwater lake swimming with sandy beaches, hiking trails through second-growth forest. Popular summer destination.',
			address: 'Six Mile Rd, View Royal',
			municipality: 'view-royal',
			amenities: ['swimming', 'trails', 'beach', 'picnic areas', 'parking'],
			coordinates: [-123.4575, 48.4575],
			source: 'directory'
		},
		{
			id: 'park-goldstream',
			name: 'Goldstream Provincial Park',
			type: 'park',
			description:
				'Old-growth rainforest park famous for salmon runs (Oct-Dec). Waterfalls, camping, nature programs. Spectacular fall viewing.',
			address: 'Trans-Canada Hwy, Langford',
			municipality: 'langford',
			amenities: ['camping', 'trails', 'nature centre', 'viewpoints', 'parking', 'washrooms'],
			url: 'https://bcparks.ca/goldstream-park/',
			coordinates: [-123.5475, 48.4775],
			source: 'directory'
		},
		// Playgrounds
		{
			id: 'park-topaz-playground',
			name: 'Topaz Park Playground',
			type: 'playground',
			description:
				'Large modern playground with climbing structures, swings, zipline, and splash pad (summer). All-abilities accessible.',
			address: 'Topaz Ave & Glasgow St, Victoria',
			municipality: 'victoria',
			amenities: ['climbing structures', 'swings', 'splash pad', 'accessible', 'washrooms'],
			coordinates: [-123.353, 48.4415],
			source: 'directory'
		},
		{
			id: 'park-playland',
			name: 'Langford Playland',
			type: 'playground',
			description:
				'Large destination playground with water features, climbing walls, and themed play areas. Adjacent to recreation center.',
			address: 'City Centre Park, Langford',
			municipality: 'langford',
			amenities: ['water features', 'climbing walls', 'swings', 'accessible', 'parking'],
			source: 'directory'
		},
		// Pools & Rec Centres
		{
			id: 'park-crystal-pool',
			name: 'Crystal Pool & Fitness Centre',
			type: 'pool',
			description:
				'Indoor 50m pool, diving boards, hot tub, sauna, and fitness centre. Swimming lessons, family swim, and lane swim.',
			address: '2275 Quadra St, Victoria',
			municipality: 'victoria',
			amenities: ['50m pool', 'diving', 'hot tub', 'fitness', 'swimming lessons'],
			url: 'https://www.victoria.ca/parks-recreation/crystal-pool',
			coordinates: [-123.3575, 48.433],
			source: 'directory'
		},
		{
			id: 'park-commonwealth',
			name: 'Saanich Commonwealth Place',
			type: 'pool',
			description:
				'Olympic-standard pool complex with wave pool, waterslide, lazy river, and diving boards. Fitness centre and ice rink.',
			address: '4636 Elk Lake Dr, Saanich',
			municipality: 'saanich',
			amenities: ['wave pool', 'waterslide', 'lazy river', 'diving', 'fitness', 'ice rink'],
			url: 'https://www.saanich.ca/EN/main/parks-recreation-community/recreation/facilities/saanich-commonwealth-place.html',
			coordinates: [-123.397, 48.501],
			source: 'directory'
		},
		{
			id: 'park-panorama',
			name: 'Panorama Recreation Centre',
			type: 'rec-centre',
			description:
				'CRD recreation centre with pool, fitness, ice rink, gymnasium, and programs. Serving the Peninsula communities.',
			address: '1885 Forest Park Dr, North Saanich',
			municipality: 'north-saanich',
			amenities: ['pool', 'fitness', 'ice rink', 'gymnasium', 'programs'],
			url: 'https://www.crd.bc.ca/panorama',
			coordinates: [-123.419, 48.621],
			source: 'directory'
		},
		// Trails
		{
			id: 'park-galloping-goose',
			name: 'Galloping Goose Regional Trail',
			type: 'trail',
			description:
				'55km multi-use trail from Victoria to Sooke. Paved sections for cycling and walking, gravel sections for mountain biking.',
			municipality: 'victoria',
			amenities: ['cycling', 'walking', 'running', 'multi-use', 'scenic views'],
			url: 'https://www.crd.bc.ca/parks-recreation-culture/parks-trails/find-park-trail/galloping-goose',
			source: 'directory'
		},
		{
			id: 'park-lochside',
			name: 'Lochside Regional Trail',
			type: 'trail',
			description:
				'29km trail from Victoria to Sidney along former rail corridor. Connects to Galloping Goose. Family-friendly, mostly paved.',
			municipality: 'saanich',
			amenities: ['cycling', 'walking', 'family-friendly', 'paved', 'scenic views'],
			url: 'https://www.crd.bc.ca/parks-recreation-culture/parks-trails/find-park-trail/lochside',
			source: 'directory'
		},
		// Beaches
		{
			id: 'park-willows-beach',
			name: 'Willows Beach',
			type: 'beach',
			description:
				'Popular family beach in Oak Bay with shallow waters, sandy shore, and views of Mt Baker. Teahouse and playground adjacent.',
			address: 'Beach Dr, Oak Bay',
			municipality: 'oak-bay',
			amenities: ['sandy beach', 'shallow water', 'playground', 'teahouse', 'washrooms', 'parking'],
			coordinates: [-123.3175, 48.453],
			source: 'directory'
		},
		{
			id: 'park-cadboro-bay',
			name: 'Cadboro-Gyro Park & Beach',
			type: 'beach',
			description:
				'Sheltered sandy beach popular with families. Large playground, picnic areas, and the famous Cadborosaurus statue.',
			address: 'Cadboro Bay Rd, Saanich',
			municipality: 'saanich',
			amenities: ['sandy beach', 'playground', 'picnic areas', 'washrooms', 'parking'],
			coordinates: [-123.2825, 48.4575],
			source: 'directory'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const type = parseEnum(url.searchParams.get('type'), validTypes);
	const limit = parseLimit(url.searchParams.get('limit'), 30);

	let facilities = getSeedData();

	if (municipality) {
		facilities = facilities.filter((f) => !f.municipality || f.municipality === municipality);
	}

	if (type) {
		facilities = facilities.filter((f) => f.type === type);
	}

	// Sort by type: pools/rec-centres first (most useful), then parks, playgrounds, trails, beaches
	const typeOrder: Record<string, number> = {
		pool: 0,
		'rec-centre': 1,
		playground: 2,
		park: 3,
		'splash-pad': 4,
		beach: 5,
		trail: 6,
		'sports-field': 7
	};
	facilities.sort((a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99));

	facilities = facilities.slice(0, limit);

	return json(
		{
			data: facilities,
			meta: { total: facilities.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=7200`
			}
		}
	);
};
