import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Meeting } from '$lib/types/index';
import { municipalities } from '$lib/config/municipalities';
import { hashCode } from '$lib/utils/hash';

const CACHE_MAX_AGE = 900; // 15 minutes

/**
 * Council meetings aggregator.
 * Currently fetches from Victoria eSCRIBE (primary) and Langford eSCRIBE.
 * Legistar for CRD/Esquimalt to be added when API access is confirmed.
 */

/** Fetch meetings from eSCRIBE portal (Victoria, Langford) */
async function fetchEscribeMeetings(baseUrl: string, municipalitySlug: string): Promise<Meeting[]> {
	try {
		// eSCRIBE exposes a GetCalendarMeetings WebMethod
		const now = new Date();
		const threeMonthsAgo = new Date(now);
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
		const threeMonthsAhead = new Date(now);
		threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

		const response = await fetch(`${baseUrl}/MeetingsCalendarView.aspx/GetCalendarMeetings`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				start: formatEscribeDate(threeMonthsAgo),
				end: formatEscribeDate(threeMonthsAhead)
			}),
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) {
			// Fallback: try to scrape the meeting list page
			return await fetchEscribeMeetingList(baseUrl, municipalitySlug);
		}

		const data = await response.json();
		if (!data.d) return await fetchEscribeMeetingList(baseUrl, municipalitySlug);

		const events = typeof data.d === 'string' ? JSON.parse(data.d) : data.d;
		if (!Array.isArray(events)) return [];

		return events.map((evt: Record<string, unknown>) => ({
			id: `${municipalitySlug}-esc-${evt.id || evt.Id || hashCode(String(evt.title || evt.Title || ''))}`,
			title: String(evt.title || evt.Title || 'Meeting'),
			body: String(evt.description || evt.Description || evt.committee || ''),
			date: String(evt.start || evt.Start || evt.date || ''),
			location: String(evt.location || evt.Location || ''),
			status: determineMeetingStatus(String(evt.start || evt.Start || '')),
			municipality: municipalitySlug,
			agendaUrl: evt.agendaUrl ? String(evt.agendaUrl) : undefined,
			minutesUrl: evt.minutesUrl ? String(evt.minutesUrl) : undefined,
			source: 'escribemeetings' as const
		}));
	} catch {
		return await fetchEscribeMeetingList(baseUrl, municipalitySlug);
	}
}

/** Fallback: scrape eSCRIBE meeting list HTML */
async function fetchEscribeMeetingList(
	baseUrl: string,
	municipalitySlug: string
): Promise<Meeting[]> {
	try {
		const response = await fetch(`${baseUrl}/Meeting`, {
			headers: { 'User-Agent': 'SVIT/1.0 (civic-dashboard)' },
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];
		const html = await response.text();

		// Parse meeting entries from HTML
		const meetings: Meeting[] = [];
		const meetingRegex =
			/class="[^"]*meeting[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(\d{4}-\d{2}-\d{2}|\w+ \d{1,2}, \d{4})/gi;
		let match;

		while ((match = meetingRegex.exec(html)) !== null) {
			meetings.push({
				id: `${municipalitySlug}-esc-${hashCode(match[1])}`,
				title: stripHtml(match[2]).trim(),
				body: '',
				date: normalizeDate(match[3]),
				status: determineMeetingStatus(match[3]),
				municipality: municipalitySlug,
				agendaUrl: match[1].startsWith('http') ? match[1] : `${baseUrl}${match[1]}`,
				source: 'escribemeetings'
			});
		}

		return meetings;
	} catch {
		return [];
	}
}

/** Fetch meetings from CivicWeb portal (Saanich, Oak Bay, Colwood, etc.) */
async function fetchCivicWebMeetings(
	portalUrl: string,
	municipalitySlug: string
): Promise<Meeting[]> {
	try {
		const response = await fetch(`${portalUrl}/MeetingInformation.aspx`, {
			headers: { 'User-Agent': 'SVIT/1.0 (civic-dashboard)' },
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];
		const html = await response.text();

		const meetings: Meeting[] = [];
		const rowRegex =
			/<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
		let match;
		while ((match = rowRegex.exec(html)) !== null) {
			const dateStr = stripHtml(match[1]).trim();
			const title = stripHtml(match[2]).trim();
			if (!title || !dateStr || title === 'Meeting') continue;
			const agendaLink = match[3].match(/href="([^"]*)"[^>]*>.*?Agenda/i)?.[1];
			meetings.push({
				id: `${municipalitySlug}-cw-${hashCode(dateStr + title)}`,
				title,
				body: title,
				date: normalizeDate(dateStr),
				status: determineMeetingStatus(dateStr),
				municipality: municipalitySlug,
				agendaUrl: agendaLink
					? agendaLink.startsWith('http')
						? agendaLink
						: `${portalUrl}/${agendaLink}`
					: undefined,
				source: 'civicweb' as const
			});
		}
		return meetings;
	} catch {
		return [];
	}
}

/** Generate demo/seed meetings when live data is unavailable */
function getSeedMeetings(): Meeting[] {
	const now = new Date();
	const meetings: Meeting[] = [];

	// Generate upcoming meetings for Victoria
	const bodies = [
		'Council Meeting',
		'Committee of the Whole',
		'Planning & Land Use Committee',
		'Finance & Governance Committee',
		'Community Services Committee'
	];

	for (let i = 0; i < 8; i++) {
		const date = new Date(now);
		date.setDate(date.getDate() + i * 3 + Math.floor(Math.random() * 4));
		const bodyIdx = i % bodies.length;
		const isPast = date < now;

		meetings.push({
			id: `vic-seed-${i}`,
			title: bodies[bodyIdx],
			body: bodies[bodyIdx],
			date: date.toISOString(),
			time: i % 2 === 0 ? '09:00' : '13:30',
			location: 'City Hall, 1 Centennial Square',
			status: isPast ? 'completed' : 'scheduled',
			municipality: 'victoria',
			agendaUrl: 'https://pub-victoria.escribemeetings.com',
			source: 'escribemeetings'
		});
	}

	// Add meetings for other municipalities
	const otherMunis = [
		{ slug: 'saanich', name: 'Saanich Council' },
		{ slug: 'esquimalt', name: 'Esquimalt Council' },
		{ slug: 'langford', name: 'Langford Council' },
		{ slug: 'oak-bay', name: 'Oak Bay Council' }
	];

	for (const muni of otherMunis) {
		for (let i = 0; i < 3; i++) {
			const date = new Date(now);
			date.setDate(date.getDate() + i * 7 + 2);
			meetings.push({
				id: `${muni.slug}-seed-${i}`,
				title: `${muni.name} Regular Meeting`,
				body: muni.name,
				date: date.toISOString(),
				time: '19:00',
				status: 'scheduled',
				municipality: muni.slug,
				source: 'manual'
			});
		}
	}

	return meetings;
}

function formatEscribeDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

function determineMeetingStatus(dateStr: string): Meeting['status'] {
	try {
		const date = new Date(dateStr);
		const now = new Date();
		const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
		if (diffHours < -3) return 'completed';
		if (diffHours < 0) return 'in-progress';
		return 'scheduled';
	} catch {
		return 'scheduled';
	}
}

function normalizeDate(str: string): string {
	try {
		return new Date(str).toISOString();
	} catch {
		return new Date().toISOString();
	}
}

function stripHtml(str: string): string {
	return str.replace(/<[^>]*>/g, '').trim();
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const limit = parseInt(url.searchParams.get('limit') || '30');

	const escribeSources = [
		{ url: 'https://pub-victoria.escribemeetings.com', slug: 'victoria' },
		{ url: 'https://pub-langford.escribemeetings.com', slug: 'langford' }
	];
	const civicwebSources = municipalities
		.filter((m) => m.councilSource === 'civicweb' && m.councilUrl)
		.map((m) => ({ url: m.councilUrl!, slug: m.slug }));

	// Fetch from all sources in parallel — one failure doesn't break others
	const allPromises = [
		...escribeSources.map((s) => fetchEscribeMeetings(s.url, s.slug)),
		...civicwebSources.map((s) => fetchCivicWebMeetings(s.url, s.slug))
	];
	const results = await Promise.allSettled(allPromises);
	let meetings = results
		.filter((r): r is PromiseFulfilledResult<Meeting[]> => r.status === 'fulfilled')
		.flatMap((r) => r.value);

	if (meetings.length === 0) meetings = getSeedMeetings();

	// Filter by municipality
	if (municipality) {
		meetings = meetings.filter((m) => m.municipality === municipality);
	}

	// Sort by date (upcoming first, then past)
	const now = new Date();
	meetings.sort((a, b) => {
		const aDate = new Date(a.date);
		const bDate = new Date(b.date);
		const aFuture = aDate >= now;
		const bFuture = bDate >= now;

		if (aFuture && !bFuture) return -1;
		if (!aFuture && bFuture) return 1;
		if (aFuture) return aDate.getTime() - bDate.getTime();
		return bDate.getTime() - aDate.getTime();
	});

	meetings = meetings.slice(0, limit);

	return json(
		{ data: meetings, meta: { total: meetings.length, municipality } },
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
