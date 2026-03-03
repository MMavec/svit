import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CommunityEvent } from '$lib/types/index';
import { municipalities } from '$lib/config/municipalities';
import { hashCode } from '$lib/utils/hash';

const CACHE_MAX_AGE = 900; // 15 minutes

/** Fetch events from Victoria EventBrite or community calendars */
async function fetchLiveEvents(): Promise<CommunityEvent[]> {
	try {
		// Try Tourism Victoria events RSS/JSON
		const response = await fetch('https://www.tourismvictoria.com/events/feed/json', {
			headers: { 'User-Agent': 'SVIT/1.0', Accept: 'application/json' },
			signal: AbortSignal.timeout(8000)
		});

		if (!response.ok) return [];

		const data = await response.json();
		if (!Array.isArray(data)) return [];

		return data.slice(0, 20).map((item: Record<string, unknown>, i: number) => ({
			id: `tv-${i}-${hashCode(String(item.title || ''))}`,
			title: String(item.title || ''),
			description: String(item.description || '')
				.replace(/<[^>]+>/g, '')
				.slice(0, 300),
			date: String(item.start_date || item.date || new Date().toISOString()),
			endDate: item.end_date ? String(item.end_date) : undefined,
			time: item.time ? String(item.time) : undefined,
			location: String(item.location || item.venue || 'Victoria, BC'),
			venue: item.venue ? String(item.venue) : undefined,
			category: classifyCategory(String(item.category || item.title || '')),
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

function classifyCategory(text: string): CommunityEvent['category'] {
	const lower = text.toLowerCase();
	if (
		lower.includes('art') ||
		lower.includes('music') ||
		lower.includes('theatre') ||
		lower.includes('gallery')
	)
		return 'arts';
	if (
		lower.includes('sport') ||
		lower.includes('run') ||
		lower.includes('race') ||
		lower.includes('swim')
	)
		return 'sports';
	if (lower.includes('market') || lower.includes('fair') || lower.includes('sale')) return 'market';
	if (lower.includes('festival') || lower.includes('celebration')) return 'festival';
	if (
		lower.includes('workshop') ||
		lower.includes('class') ||
		lower.includes('lecture') ||
		lower.includes('learn')
	)
		return 'education';
	if (lower.includes('council') || lower.includes('town hall') || lower.includes('hearing'))
		return 'government';
	return 'community';
}

function attributeByText(text: string): string | undefined {
	const lower = text.toLowerCase();
	for (const m of municipalities) {
		if (lower.includes(m.name.toLowerCase())) return m.slug;
	}
	if (lower.includes('downtown') || lower.includes('inner harbour')) return 'victoria';
	return undefined;
}

function getSeedData(): CommunityEvent[] {
	return [
		{
			id: 'event-seed-1',
			title: 'Moss Street Market',
			description:
				'Weekly community market featuring local produce, artisan crafts, baked goods, and live music. Over 100 vendors from across the region.',
			date: '2026-03-07T10:00:00-08:00',
			endDate: '2026-03-07T14:00:00-08:00',
			time: '10:00 AM - 2:00 PM',
			location: 'Sir James Douglas School Grounds',
			venue: 'Moss St & Fairfield Rd',
			category: 'market',
			municipality: 'victoria',
			url: 'https://mossstreetmarket.com',
			free: true,
			source: 'seed'
		},
		{
			id: 'event-seed-2',
			title: 'Victoria Symphony: Pacific Sounds',
			description:
				'The Victoria Symphony performs works inspired by the Pacific Northwest featuring guest cellist Amanda Forsyth.',
			date: '2026-03-08T19:30:00-08:00',
			time: '7:30 PM',
			location: 'Royal Theatre',
			venue: '805 Broughton St',
			category: 'arts',
			municipality: 'victoria',
			url: 'https://victoriasymphony.ca',
			free: false,
			source: 'seed'
		},
		{
			id: 'event-seed-3',
			title: 'Esquimalt 5K Fun Run',
			description:
				'Annual family-friendly run along the Gorge Waterway. Registration includes t-shirt and post-race refreshments. All abilities welcome.',
			date: '2026-03-15T09:00:00-07:00',
			time: '9:00 AM',
			location: 'Gorge Park',
			venue: 'Tillicum Rd & Gorge Rd W',
			category: 'sports',
			municipality: 'esquimalt',
			free: false,
			source: 'seed'
		},
		{
			id: 'event-seed-4',
			title: 'Saanich Environmental Film Night',
			description:
				'Free screening of "The New Wilderness" followed by a panel discussion with local conservation experts. Light refreshments provided.',
			date: '2026-03-12T18:30:00-07:00',
			time: '6:30 PM',
			location: 'Cedar Hill Recreation Centre',
			category: 'education',
			municipality: 'saanich',
			free: true,
			source: 'seed'
		},
		{
			id: 'event-seed-5',
			title: 'Langford Spring Festival',
			description:
				'Annual celebration of spring with food trucks, live music, kids activities, artisan vendors, and a plant swap. Free admission.',
			date: '2026-03-22T11:00:00-07:00',
			endDate: '2026-03-22T17:00:00-07:00',
			time: '11:00 AM - 5:00 PM',
			location: 'City Centre Park',
			category: 'festival',
			municipality: 'langford',
			free: true,
			source: 'seed'
		},
		{
			id: 'event-seed-6',
			title: 'Oak Bay Tea Party Planning Meeting',
			description:
				'Community planning session for the annual Oak Bay Tea Party. Volunteers and new committee members welcome.',
			date: '2026-03-10T19:00:00-07:00',
			time: '7:00 PM',
			location: 'Oak Bay Municipal Hall',
			municipality: 'oak-bay',
			category: 'community',
			free: true,
			source: 'seed'
		},
		{
			id: 'event-seed-7',
			title: 'Sidney Pier Watercolour Workshop',
			description:
				'Plein air painting workshop at the Sidney Pier. All skill levels welcome. Materials provided. Limited to 20 participants.',
			date: '2026-03-14T13:00:00-07:00',
			time: '1:00 PM',
			location: 'Sidney Pier',
			municipality: 'sidney',
			category: 'education',
			free: false,
			source: 'seed'
		},
		{
			id: 'event-seed-8',
			title: 'Colwood Crawl Pub Walk',
			description:
				'Guided walking tour of Colwood craft breweries and cideries. Sample local beverages and enjoy good company. Ages 19+.',
			date: '2026-03-21T14:00:00-07:00',
			time: '2:00 PM',
			location: 'Colwood Corners',
			municipality: 'colwood',
			category: 'community',
			free: false,
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const category = url.searchParams.get('category');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	let events = await fetchLiveEvents();

	if (events.length === 0) {
		events = getSeedData();
	}

	if (municipality) {
		events = events.filter((e) => e.municipality === municipality);
	}

	if (category) {
		events = events.filter((e) => e.category === category);
	}

	// Sort by date (soonest first)
	events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	events = events.slice(0, limit);

	return json(
		{
			data: events,
			meta: { total: events.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
