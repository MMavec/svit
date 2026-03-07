import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SchoolLibraryItem } from '$lib/types/index';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 3600; // 1 hour

const validTypes = new Set(['school', 'library', 'program', 'event'] as const);

function getSeedData(): SchoolLibraryItem[] {
	return [
		// Libraries
		{
			id: 'sl-gvpl-central',
			name: 'GVPL Central Branch',
			type: 'library',
			description:
				"Main branch of the Greater Victoria Public Library. Children's section, teen zone, programs, computer access, and community spaces.",
			address: '735 Broughton St, Victoria',
			municipality: 'victoria',
			url: 'https://gvpl.ca',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-gvpl-saanich',
			name: 'GVPL Saanich Centennial Branch',
			type: 'library',
			description:
				"Community library with children's programs, book clubs, and digital resources. Located near Tillicum Centre.",
			address: '3110 Tillicum Rd, Saanich',
			municipality: 'saanich',
			url: 'https://gvpl.ca',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-gvpl-oak-bay',
			name: 'GVPL Oak Bay Branch',
			type: 'library',
			description:
				"Cozy neighbourhood library with regular children's storytime, book clubs, and community events.",
			address: '1442 Monterey Ave, Oak Bay',
			municipality: 'oak-bay',
			url: 'https://gvpl.ca',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-gvpl-esquimalt',
			name: 'GVPL Esquimalt Branch',
			type: 'library',
			description:
				"Community library with children's programs, computer access, and community gathering spaces.",
			address: '1231 Esquimalt Rd, Esquimalt',
			municipality: 'esquimalt',
			url: 'https://gvpl.ca',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-sidney-library',
			name: 'Sidney/North Saanich Branch — Vancouver Island Regional Library',
			type: 'library',
			description:
				"VIRL branch serving Sidney and North Saanich. Children's programs, digital resources, and community events.",
			address: '10091 Resthaven Dr, Sidney',
			municipality: 'sidney',
			url: 'https://virl.bc.ca',
			free: true,
			source: 'directory'
		},
		// Programs
		{
			id: 'sl-storytime',
			name: 'GVPL Storytime — All Branches',
			type: 'program',
			description:
				'Weekly storytime sessions with stories, songs, rhymes, and puppets for young children and families. Drop-in, no registration.',
			municipality: 'victoria',
			url: 'https://gvpl.ca/programs-events',
			ageRange: '0-5',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-summer-reading',
			name: 'TD Summer Reading Club',
			type: 'program',
			description:
				'Annual summer reading program for kids and teens at all GVPL branches. Stickers, prizes, and reading challenges.',
			municipality: 'victoria',
			url: 'https://gvpl.ca/programs-events',
			ageRange: '0-17',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-lego-club',
			name: 'LEGO Club at GVPL',
			type: 'program',
			description:
				'Monthly LEGO building sessions for kids. All LEGO provided. No registration needed, just drop in and build!',
			municipality: 'victoria',
			url: 'https://gvpl.ca/programs-events',
			ageRange: '5-12',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-teen-zone',
			name: 'GVPL Teen Zone Programs',
			type: 'program',
			description:
				'After-school programs for teens including gaming nights, book clubs, volunteer opportunities, and homework help.',
			municipality: 'victoria',
			url: 'https://gvpl.ca/programs-events',
			ageRange: '13-18',
			free: true,
			source: 'directory'
		},
		// School Districts
		{
			id: 'sl-sd61',
			name: 'Greater Victoria School District (SD61)',
			type: 'school',
			description:
				'Public school district serving Victoria, Oak Bay, Esquimalt, View Royal, and Songhees/Esquimalt Nations. 47 schools, 20,000+ students.',
			municipality: 'victoria',
			url: 'https://www.sd61.bc.ca',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-sd63',
			name: 'Saanich School District (SD63)',
			type: 'school',
			description:
				'Public school district serving Central Saanich, North Saanich, and Sidney. Strong community schools with outdoor programs.',
			municipality: 'central-saanich',
			url: 'https://www.sd63.bc.ca',
			free: true,
			source: 'directory'
		},
		{
			id: 'sl-sd62',
			name: 'Sooke School District (SD62)',
			type: 'school',
			description:
				'Fastest-growing school district in BC. Serving Langford, Colwood, Metchosin, Sooke, and Highlands.',
			municipality: 'langford',
			url: 'https://www.sd62.bc.ca',
			free: true,
			source: 'directory'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const type = parseEnum(url.searchParams.get('type'), validTypes);
	const limit = parseLimit(url.searchParams.get('limit'), 20);

	let items = getSeedData();

	if (municipality) {
		items = items.filter((item) => !item.municipality || item.municipality === municipality);
	}

	if (type) {
		items = items.filter((item) => item.type === type);
	}

	// Sort: programs first (most actionable), then libraries, schools
	const typeOrder: Record<string, number> = {
		program: 0,
		event: 1,
		library: 2,
		school: 3
	};
	items.sort((a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99));

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
