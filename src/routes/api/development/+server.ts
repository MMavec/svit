import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DevelopmentApplication } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 900; // 15 minutes

// City of Victoria self-hosted ArcGIS — "Development Applications" (active/in-progress planning files:
// rezonings, development/variance/heritage/temporary-use/tax-incentive permits). One point per
// "purpose"; dedupe on FOLDER_NUMBER for one row per application. This REPLACES two dead endpoints
// the route previously used (an opendata.victoria.ca HTML page and a non-existent AGOL service).
const VICTORIA_DEV_LAYER =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_PlanningAndDevelopment/MapServer/3';

// Public Development Tracker deep-link (guest access, no login needed).
const TRACKER_BASE =
	'https://tender.victoria.ca/webapps/ourcity/Prospero/Details.aspx?folderNumber=';

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { x: number; y: number };
}

/** Fetch live Victoria development applications. Returns [] on any failure (caller falls back to seed). */
async function fetchVictoriaDevApplications(): Promise<DevelopmentApplication[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields:
				'FOLDER_NUMBER,AppType,STATUS,SUBJECT,HOUSE,STREET,Neighbourhood,PURPOSE,DevAppTracker,CREATED_DATE',
			orderByFields: 'CREATED_DATE DESC',
			returnGeometry: 'true',
			outSR: '4326',
			resultRecordCount: '500',
			f: 'json'
		});

		const response = await fetch(`${VICTORIA_DEV_LAYER}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		// Do not gate on content-type — Victoria's ArcGIS returns text/plain for some queries.
		if (!response.ok) return [];

		const data = (await response.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];

		// One point per purpose row -> dedupe to one application per FOLDER_NUMBER (keep first/newest).
		const seen = new Set<string>();
		const out: DevelopmentApplication[] = [];
		for (const f of data.features) {
			const folder = String(f.attributes.FOLDER_NUMBER || '').trim();
			const key = folder || `obj-${out.length}`;
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(mapToDevApplication(f.attributes, f.geometry, folder));
		}
		return out;
	} catch (err) {
		console.error('Failed to fetch Victoria development applications:', err);
		return [];
	}
}

function mapToDevApplication(
	props: Record<string, unknown>,
	geometry: { x: number; y: number } | undefined,
	folder: string
): DevelopmentApplication {
	const house = str(props.HOUSE);
	const street = str(props.STREET);
	const subject = str(props.SUBJECT);
	const addr = [house, titleCase(street)].filter(Boolean).join(' ');
	const address = `${addr || subject || 'Address withheld'}, Victoria`;

	const appType = str(props.AppType);
	const description = stripHtml(str(props.PURPOSE)) || subject || appType;
	const rawStatus = str(props.STATUS).toUpperCase();
	const onHold = rawStatus.includes('HOLD');

	const type = guessType(`${appType} ${description} ${subject}`);

	// Flag significant / Council-level applications (no storeys/units fields exist on this layer).
	const text = `${description} ${subject}`.toUpperCase();
	const modifiers: string[] = [];
	if (/\b(OCP|OFFICIAL COMMUNITY PLAN)\b/.test(text)) modifiers.push('OCP amendment');
	if (/TOWER|HIGH[- ]?RISE|MIXED[- ]?USE/.test(text) || /\d{2,}\s*(STOR|UNIT|DWELLING)/.test(text))
		modifiers.push('Large project');
	if (onHold) modifiers.push('On hold');
	const significantType = /REZONING|HERITAGE DESIGNATION|TEMPORARY USE|TAX INCENTIVE/i.test(
		appType
	);
	const significant = significantType || modifiers.length > 0;
	const flagReasons = [...(significantType && appType ? [appType] : []), ...modifiers];

	const coords: [number, number] | undefined =
		geometry && isFinite(geometry.x) && isFinite(geometry.y) ? [geometry.x, geometry.y] : undefined;

	return {
		id: `vic-dev-${folder || hashCode(address + description)}`,
		address,
		description,
		type,
		status: 'under-review',
		municipality: 'victoria',
		appType: appType || undefined,
		folderNumber: folder || undefined,
		submittedDate: parseEpoch(props.CREATED_DATE),
		coordinates: coords,
		flagged: significant,
		flagReasons: flagReasons.length > 0 ? flagReasons : undefined,
		documentUrl: folder ? `${TRACKER_BASE}${encodeURIComponent(folder)}` : undefined,
		source: 'victoria-opendata'
	};
}

function guessType(text: string): DevelopmentApplication['type'] {
	const t = text.toUpperCase();
	if (/MIXED[- ]?USE/.test(t)) return 'mixed-use';
	if (/COMMERCIAL|RETAIL|OFFICE|RESTAURANT|HOTEL|SIGN|BUSINESS/.test(t)) return 'commercial';
	if (/SCHOOL|CHURCH|HOSPITAL|INSTITUT|CIVIC|PLACE OF WORSHIP/.test(t)) return 'institutional';
	if (/INDUSTRIAL|WAREHOUSE|MANUFACTUR/.test(t)) return 'industrial';
	if (/RESIDENT|DWELLING|HOUSE|APARTMENT|TOWNHOUSE|DUPLEX|SUITE|UNIT|HOUSING/.test(t))
		return 'residential';
	return 'other';
}

/** Generate seed development data (only used if the live Victoria feed is unreachable). */
function getSeedDevelopments(): DevelopmentApplication[] {
	return [
		{
			id: 'vic-dev-seed-1',
			address: '1200 Douglas St, Victoria',
			description: 'Mixed-use tower with ground floor retail and residential units above',
			type: 'mixed-use',
			status: 'under-review',
			municipality: 'victoria',
			appType: 'Rezoning',
			flagged: true,
			flagReasons: ['Rezoning', 'Large project'],
			coordinates: [-123.3615, 48.4284],
			source: 'seed'
		},
		{
			id: 'vic-dev-seed-2',
			address: '900 Pandora Ave, Victoria',
			description: 'Heritage alteration permit for facade restoration',
			type: 'commercial',
			status: 'under-review',
			municipality: 'victoria',
			appType: 'Heritage Alteration Permit',
			flagged: false,
			coordinates: [-123.358, 48.4265],
			source: 'seed'
		},
		{
			id: 'san-dev-seed-1',
			address: '3800 Shelbourne St, Saanich',
			description: 'Development variance permit for a six-unit infill project',
			type: 'residential',
			status: 'under-review',
			municipality: 'saanich',
			appType: 'Development Variance Permit',
			flagged: false,
			coordinates: [-123.34, 48.454],
			source: 'seed'
		}
	];
}

// --- helpers ---

function str(val: unknown): string {
	if (val === null || val === undefined) return '';
	return String(val).trim();
}

function titleCase(s: string): string {
	if (!s) return s;
	return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function stripHtml(s: string): string {
	return s
		.replace(/<br\s*\/?>(\s*)/gi, ' ')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** CREATED_DATE is an esriFieldTypeDate (epoch milliseconds). */
function parseEpoch(val: unknown): string | undefined {
	const n = Number(val);
	if (!isFinite(n) || n <= 0) return undefined;
	const d = new Date(n);
	if (isNaN(d.getTime())) return undefined;
	return d.toISOString().slice(0, 10);
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const flaggedOnly = url.searchParams.get('flagged') === 'true';
	const limit = parseLimit(url.searchParams.get('limit'), 50);

	let applications = await fetchVictoriaDevApplications();
	if (applications.length === 0) applications = getSeedDevelopments();

	if (municipality) applications = applications.filter((a) => a.municipality === municipality);
	if (flaggedOnly) applications = applications.filter((a) => a.flagged);

	const flaggedCount = applications.filter((a) => a.flagged).length;
	applications = applications.slice(0, limit);

	return json(
		{
			data: applications,
			meta: { total: applications.length, municipality, flaggedCount }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
