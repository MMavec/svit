import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ConstructionEvent } from '$lib/types/index';
import { CRD_BBOX, municipalities } from '$lib/config/municipalities';
import { hashCode } from '$lib/utils/hash';
import { attributeMunicipality } from '$lib/utils/geo-attribution';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 900; // 15 minutes

/** CRD bounding box for filtering Vancouver Island events to CRD area */
const [CRD_WEST, CRD_SOUTH, CRD_EAST, CRD_NORTH] = CRD_BBOX;

/** Fetch active events from DriveBC Open511 API */
async function fetchDriveBCEvents(eventType?: string): Promise<ConstructionEvent[]> {
	try {
		const params = new URLSearchParams({
			area_id: 'drivebc.ca/2', // Vancouver Island District
			status: 'ACTIVE',
			format: 'json',
			limit: '100'
		});
		if (eventType) {
			params.set('event_type', eventType);
		}

		const response = await fetch(`https://api.open511.gov.bc.ca/events?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) return [];

		const data = await response.json();
		if (!data.events || !Array.isArray(data.events)) return [];

		const events: ConstructionEvent[] = [];

		for (const evt of data.events) {
			// Filter to CRD bounding box
			const coords = evt.geography?.coordinates;
			if (coords) {
				const [lng, lat] = coords;
				if (lng < CRD_WEST || lng > CRD_EAST || lat < CRD_SOUTH || lat > CRD_NORTH) {
					continue;
				}
			}

			events.push({
				id: String(evt.id || `drivebc-${hashCode(JSON.stringify(evt))}`),
				headline: String(evt.headline || evt.event_type || 'Road Event'),
				description: String(evt.description || ''),
				eventType: normalizeEventType(evt.event_type),
				eventSubtypes: evt.event_subtypes || [],
				severity: normalizeSeverity(evt.severity),
				status: evt.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
				roads: (evt.roads || []).map(
					(r: { name?: string; from?: string; to?: string; direction?: string }) => ({
						name: String(r.name || ''),
						from: r.from ? String(r.from) : undefined,
						to: r.to ? String(r.to) : undefined,
						direction: r.direction ? String(r.direction) : undefined
					})
				),
				coordinates: coords ? [coords[0], coords[1]] : undefined,
				created: evt.created || new Date().toISOString(),
				updated: evt.updated || new Date().toISOString(),
				municipality: attributeMunicipalityFromEvent(coords, evt.description, evt.roads),
				schedule: evt.schedule?.recurring_schedules?.[0]
					? {
							startDate: evt.schedule.recurring_schedules[0].start_date,
							endDate: evt.schedule.recurring_schedules[0].end_date
						}
					: undefined,
				source: 'drivebc'
			});
		}

		return events;
	} catch {
		return [];
	}
}

/** Attribute a municipality based on coordinates or text matching */
function attributeMunicipalityFromEvent(
	coords?: [number, number],
	description?: string,
	roads?: { name?: string }[]
): string | undefined {
	// Try coordinate-based attribution first
	if (coords) {
		const [lng, lat] = coords;
		const result = attributeMunicipality(lng, lat);
		if (result) return result;
	}

	// Fall back to text matching
	const text = [description, ...(roads || []).map((r) => r.name)]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
	for (const m of municipalities) {
		if (text.includes(m.name.toLowerCase())) return m.slug;
	}

	return undefined;
}

function normalizeEventType(type: string): ConstructionEvent['eventType'] {
	const upper = String(type || '').toUpperCase();
	if (upper.includes('CONSTRUCTION')) return 'CONSTRUCTION';
	if (upper.includes('INCIDENT')) return 'INCIDENT';
	if (upper.includes('SPECIAL')) return 'SPECIAL_EVENT';
	if (upper.includes('WEATHER')) return 'WEATHER_CONDITION';
	return 'CONSTRUCTION';
}

function normalizeSeverity(severity: string): ConstructionEvent['severity'] {
	const upper = String(severity || '').toUpperCase();
	if (upper.includes('MAJOR')) return 'MAJOR';
	if (upper.includes('MODERATE')) return 'MODERATE';
	if (upper.includes('MINOR')) return 'MINOR';
	return 'UNKNOWN';
}

function getSeedEvents(): ConstructionEvent[] {
	return [
		{
			id: 'drivebc-seed-1',
			headline: 'CONSTRUCTION',
			description:
				'Trans-Canada Highway (Hwy 1), westbound. Road maintenance between Helmcken Rd and Tillicum Rd. Until Jun 2026. Work hours: 7:00 AM to 5:00 PM.',
			eventType: 'CONSTRUCTION',
			severity: 'MODERATE',
			status: 'ACTIVE',
			roads: [{ name: 'Highway 1', from: 'Helmcken Rd', to: 'Tillicum Rd', direction: 'W' }],
			coordinates: [-123.412, 48.462],
			created: '2026-01-15T08:00:00-08:00',
			updated: '2026-02-28T10:00:00-08:00',
			municipality: 'saanich',
			schedule: { startDate: '2026-01-15', endDate: '2026-06-30' },
			source: 'seed'
		},
		{
			id: 'drivebc-seed-2',
			headline: 'CONSTRUCTION',
			description:
				'Douglas St, northbound and southbound. Watermain replacement between Hillside Ave and Bay St. Single lane alternating traffic.',
			eventType: 'CONSTRUCTION',
			severity: 'MINOR',
			status: 'ACTIVE',
			roads: [{ name: 'Douglas St', from: 'Hillside Ave', to: 'Bay St' }],
			coordinates: [-123.361, 48.432],
			created: '2026-02-01T08:00:00-08:00',
			updated: '2026-02-27T14:00:00-08:00',
			municipality: 'victoria',
			schedule: { startDate: '2026-02-01', endDate: '2026-04-15' },
			source: 'seed'
		},
		{
			id: 'drivebc-seed-3',
			headline: 'CONSTRUCTION',
			description:
				'Veterans Memorial Pkwy, both directions. Intersection improvements at Goldstream Ave. Expect delays during peak hours.',
			eventType: 'CONSTRUCTION',
			severity: 'MODERATE',
			status: 'ACTIVE',
			roads: [{ name: 'Veterans Memorial Pkwy', from: 'Goldstream Ave' }],
			coordinates: [-123.493, 48.449],
			created: '2026-02-10T08:00:00-08:00',
			updated: '2026-02-25T16:00:00-08:00',
			municipality: 'langford',
			schedule: { startDate: '2026-02-10', endDate: '2026-05-30' },
			source: 'seed'
		},
		{
			id: 'drivebc-seed-4',
			headline: 'INCIDENT',
			description:
				'Pat Bay Highway (Hwy 17), northbound. Vehicle incident near Sayward Rd. Right lane blocked. Expect minor delays.',
			eventType: 'INCIDENT',
			severity: 'MINOR',
			status: 'ACTIVE',
			roads: [{ name: 'Highway 17', direction: 'N' }],
			coordinates: [-123.37, 48.495],
			created: '2026-03-01T15:30:00-08:00',
			updated: '2026-03-01T15:30:00-08:00',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			id: 'drivebc-seed-5',
			headline: 'CONSTRUCTION',
			description:
				'Sooke Rd, both directions. Bridge deck repairs between Jacklin Rd and Kelly Rd. Single lane alternating traffic.',
			eventType: 'CONSTRUCTION',
			severity: 'MAJOR',
			status: 'ACTIVE',
			roads: [{ name: 'Sooke Rd', from: 'Jacklin Rd', to: 'Kelly Rd' }],
			coordinates: [-123.505, 48.443],
			created: '2026-01-20T08:00:00-08:00',
			updated: '2026-02-20T12:00:00-08:00',
			municipality: 'colwood',
			schedule: { startDate: '2026-01-20', endDate: '2026-07-15' },
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const eventType = url.searchParams.get('event_type');
	const limit = parseLimit(url.searchParams.get('limit'), 50);

	let events = await fetchDriveBCEvents(eventType || undefined);

	// Fall back to seed data if API returned nothing
	if (events.length === 0) {
		events = getSeedEvents();
	}

	// Filter by municipality
	if (municipality) {
		events = events.filter((e) => e.municipality === municipality);
	}

	events = events.slice(0, limit);

	return json(
		{
			data: events,
			meta: {
				total: events.length,
				municipality
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
