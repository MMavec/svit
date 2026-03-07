import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { FamilyActivity } from '$lib/types/index';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { hashCode } from '$lib/utils/hash';

const CACHE_MAX_AGE = 900; // 15 minutes

const validCategories = new Set([
	'outdoor',
	'indoor',
	'sports',
	'arts',
	'education',
	'library',
	'swimming',
	'playground',
	'nature',
	'other'
] as const);

/** Fetch family events from Tourism Victoria */
async function fetchTourismVictoriaFamily(): Promise<FamilyActivity[]> {
	try {
		const response = await fetch('https://www.tourismvictoria.com/events/feed/json', {
			headers: { 'User-Agent': 'SVIT/1.0', Accept: 'application/json' },
			signal: AbortSignal.timeout(8000)
		});

		if (!response.ok) return [];
		const ct = response.headers.get('content-type') || '';
		if (!ct.includes('json')) return [];

		const data = await response.json();
		if (!Array.isArray(data)) return [];

		return data
			.filter((item: Record<string, unknown>) => {
				const cat = String(item.category || '').toLowerCase();
				const title = String(item.title || '').toLowerCase();
				return (
					cat.includes('family') ||
					cat.includes('kids') ||
					cat.includes('children') ||
					title.includes('family') ||
					title.includes('kids') ||
					title.includes('children') ||
					cat.includes('festival') ||
					cat.includes('market')
				);
			})
			.slice(0, 15)
			.map((item: Record<string, unknown>, i: number) => ({
				id: `tv-fam-${i}-${hashCode(String(item.title || ''))}`,
				title: String(item.title || ''),
				description: String(item.description || '')
					.replace(/<[^>]+>/g, '')
					.slice(0, 300),
				category: classifyFamilyCategory(String(item.category || item.title || '')),
				date: String(item.start_date || item.date || new Date().toISOString()),
				time: item.time ? String(item.time) : undefined,
				location: String(item.location || item.venue || 'Greater Victoria'),
				venue: item.venue ? String(item.venue) : undefined,
				municipality: attributeByText(String(item.location || item.venue || '')),
				url: item.url ? String(item.url) : undefined,
				free: String(item.cost || '')
					.toLowerCase()
					.includes('free'),
				source: 'tourismvictoria'
			}));
	} catch {
		return [];
	}
}

/** Fetch from Saanich events RSS */
async function fetchSaanichEvents(): Promise<FamilyActivity[]> {
	try {
		const response = await fetch(
			'https://www.saanich.ca/EN/main/news-events/events-list/data/events.rss',
			{
				headers: { 'User-Agent': 'SVIT/1.0' },
				signal: AbortSignal.timeout(8000)
			}
		);

		if (!response.ok) return [];
		const xml = await response.text();
		const activities: FamilyActivity[] = [];

		const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
		let match;
		while ((match = itemRegex.exec(xml)) !== null && activities.length < 10) {
			const itemXml = match[1];
			const title = extractTag(itemXml, 'title');
			const description = extractTag(itemXml, 'description');
			const link = extractTag(itemXml, 'link');

			// Filter for family-relevant events
			const combined = (title + ' ' + description).toLowerCase();
			if (
				combined.includes('family') ||
				combined.includes('kids') ||
				combined.includes('children') ||
				combined.includes('youth') ||
				combined.includes('swim') ||
				combined.includes('playground') ||
				combined.includes('recreation') ||
				combined.includes('storytime')
			) {
				activities.push({
					id: `saanich-fam-${hashCode(link || title)}`,
					title: stripHtml(title).slice(0, 200),
					description: stripHtml(description).slice(0, 500),
					category: classifyFamilyCategory(title),
					location: 'Saanich, BC',
					municipality: 'saanich',
					url: link || undefined,
					free: combined.includes('free'),
					source: 'saanich-events'
				});
			}
		}

		return activities;
	} catch {
		return [];
	}
}

function extractTag(xml: string, tag: string): string {
	const regex = new RegExp(
		`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
		'i'
	);
	const match = regex.exec(xml);
	return match ? match[1].trim() : '';
}

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
		.trim();
}

function classifyFamilyCategory(text: string): FamilyActivity['category'] {
	const lower = text.toLowerCase();
	if (lower.includes('swim') || lower.includes('pool') || lower.includes('aquatic'))
		return 'swimming';
	if (lower.includes('playground') || lower.includes('play area')) return 'playground';
	if (lower.includes('library') || lower.includes('story') || lower.includes('reading'))
		return 'library';
	if (lower.includes('art') || lower.includes('craft') || lower.includes('music')) return 'arts';
	if (lower.includes('sport') || lower.includes('soccer') || lower.includes('hockey'))
		return 'sports';
	if (lower.includes('nature') || lower.includes('hike') || lower.includes('wildlife'))
		return 'nature';
	if (lower.includes('workshop') || lower.includes('class') || lower.includes('learn'))
		return 'education';
	if (
		lower.includes('park') ||
		lower.includes('outdoor') ||
		lower.includes('beach') ||
		lower.includes('garden')
	)
		return 'outdoor';
	if (lower.includes('indoor') || lower.includes('museum') || lower.includes('centre'))
		return 'indoor';
	return 'other';
}

function attributeByText(text: string): string | undefined {
	const lower = text.toLowerCase();
	const mapping: Record<string, string> = {
		victoria: 'victoria',
		'oak bay': 'oak-bay',
		saanich: 'saanich',
		esquimalt: 'esquimalt',
		langford: 'langford',
		colwood: 'colwood',
		sidney: 'sidney',
		sooke: 'sooke',
		'view royal': 'view-royal'
	};
	for (const [name, slug] of Object.entries(mapping)) {
		if (lower.includes(name)) return slug;
	}
	if (lower.includes('downtown') || lower.includes('inner harbour')) return 'victoria';
	return undefined;
}

function getSeedData(): FamilyActivity[] {
	return [
		{
			id: 'fam-seed-1',
			title: 'Family Swim at Crystal Pool',
			description:
				'Open family swim with water features, lane swimming, and fun pool. Suitable for all ages. Lifeguards on duty.',
			ageRange: 'All ages',
			category: 'swimming',
			time: '1:00 PM - 3:00 PM',
			location: 'Crystal Pool & Fitness Centre',
			venue: '2275 Quadra St',
			municipality: 'victoria',
			url: 'https://www.victoria.ca/parks-recreation/crystal-pool',
			free: false,
			recurring: true,
			source: 'seed'
		},
		{
			id: 'fam-seed-2',
			title: 'Storytime at Greater Victoria Public Library',
			description:
				'Stories, songs, rhymes, and puppets for young children and families. Different themes each week. No registration required.',
			ageRange: '0-5',
			category: 'library',
			time: '10:30 AM',
			location: 'GVPL Central Branch',
			venue: '735 Broughton St',
			municipality: 'victoria',
			url: 'https://gvpl.ca/programs-events',
			free: true,
			recurring: true,
			source: 'seed'
		},
		{
			id: 'fam-seed-3',
			title: 'Beacon Hill Park Playground & Petting Zoo',
			description:
				"Large playground area with adjacent children's petting zoo. Peacocks, goats, and ponies. Beautiful park with walking paths.",
			ageRange: 'All ages',
			category: 'playground',
			location: 'Beacon Hill Park',
			venue: 'Circle Dr & Arbutus Way',
			municipality: 'victoria',
			url: 'https://www.victoria.ca/parks-recreation/parks/beacon-hill-park',
			free: true,
			source: 'seed'
		},
		{
			id: 'fam-seed-4',
			title: 'Victoria Bug Zoo',
			description:
				'Interactive insect zoo with guided tours. Hold tropical insects, tarantulas, and more. Educational and fun for all ages.',
			ageRange: 'All ages',
			category: 'indoor',
			location: 'Victoria Bug Zoo',
			venue: '631 Courtney St',
			municipality: 'victoria',
			url: 'https://victoriabugzoo.ca',
			free: false,
			source: 'seed'
		},
		{
			id: 'fam-seed-5',
			title: 'Saanich Commonwealth Place Family Open Swim',
			description:
				'Wave pool, lazy river, waterslide, and diving boards. Great for families with kids of all ages.',
			ageRange: 'All ages',
			category: 'swimming',
			time: '12:00 PM - 4:00 PM',
			location: 'Saanich Commonwealth Place',
			venue: '4636 Elk Lake Dr',
			municipality: 'saanich',
			url: 'https://www.saanich.ca/EN/main/parks-recreation-community/recreation/facilities/saanich-commonwealth-place.html',
			free: false,
			recurring: true,
			source: 'seed'
		},
		{
			id: 'fam-seed-6',
			title: 'Nature Walk — Swan Lake Christmas Hill Nature Sanctuary',
			description:
				'Family-friendly nature trails through wetlands and upland habitats. Nature house with exhibits. Birdwatching and seasonal programs.',
			ageRange: 'All ages',
			category: 'nature',
			location: 'Swan Lake Nature Sanctuary',
			venue: '3873 Swan Lake Rd',
			municipality: 'saanich',
			url: 'https://swanlake.bc.ca',
			free: true,
			source: 'seed'
		},
		{
			id: 'fam-seed-7',
			title: 'WildPlay Element Parks — Aerial Adventures',
			description:
				'Ziplines, wobbly bridges, rope swings, and bungee jumping. Various difficulty levels for different ages. Book ahead.',
			ageRange: '6+',
			category: 'outdoor',
			location: 'WildPlay Element Parks',
			municipality: 'victoria',
			url: 'https://wildplay.com/victoria',
			free: false,
			source: 'seed'
		},
		{
			id: 'fam-seed-8',
			title: 'Youth Coding Classes — Code Ninjas',
			description:
				'Drop-in coding sessions for kids and teens. Learn game development, app design, and robotics in a fun environment.',
			ageRange: '7-14',
			category: 'education',
			time: '3:30 PM - 5:30 PM',
			location: 'Code Ninjas Westshore',
			municipality: 'langford',
			url: 'https://codeninjas.com',
			free: false,
			recurring: true,
			source: 'seed'
		},
		{
			id: 'fam-seed-9',
			title: 'Esquimalt Recreation Centre — Drop-In Sports',
			description:
				'Drop-in basketball, badminton, and pickle ball for families. Equipment available to borrow.',
			ageRange: 'All ages',
			category: 'sports',
			time: '10:00 AM - 12:00 PM',
			location: 'Esquimalt Recreation Centre',
			venue: '527 Fraser St',
			municipality: 'esquimalt',
			free: false,
			recurring: true,
			source: 'seed'
		},
		{
			id: 'fam-seed-10',
			title: 'Art Gallery of Greater Victoria — Family Sundays',
			description:
				'Free admission for families on Sundays. Hands-on art activities, gallery tours designed for kids, and creative workshops.',
			ageRange: 'All ages',
			category: 'arts',
			time: '12:00 PM - 4:00 PM',
			location: 'Art Gallery of Greater Victoria',
			venue: '1040 Moss St',
			municipality: 'victoria',
			url: 'https://aggv.ca',
			free: true,
			recurring: true,
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const category = parseEnum(url.searchParams.get('category'), validCategories);
	const limit = parseLimit(url.searchParams.get('limit'), 20);

	const [tourismEvents, saanichEvents] = await Promise.all([
		fetchTourismVictoriaFamily(),
		fetchSaanichEvents()
	]);

	let activities = [...tourismEvents, ...saanichEvents];

	// Always include seed data as a baseline
	if (activities.length < 5) {
		const seedData = getSeedData();
		const existingIds = new Set(activities.map((a) => a.id));
		for (const seed of seedData) {
			if (!existingIds.has(seed.id)) {
				activities.push(seed);
			}
		}
	}

	if (municipality) {
		activities = activities.filter((a) => !a.municipality || a.municipality === municipality);
	}

	if (category) {
		activities = activities.filter((a) => a.category === category);
	}

	// Sort: recurring first (always available), then by date
	activities.sort((a, b) => {
		if (a.recurring && !b.recurring) return -1;
		if (!a.recurring && b.recurring) return 1;
		if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
		return 0;
	});

	activities = activities.slice(0, limit);

	return json(
		{
			data: activities,
			meta: { total: activities.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
