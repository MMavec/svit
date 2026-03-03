import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DevelopmentApplication } from '$lib/types/index';

const CACHE_MAX_AGE = 900; // 15 minutes

/** Victoria Open Data ArcGIS Hub — development permit applications */
async function fetchVictoriaDevPermits(): Promise<DevelopmentApplication[]> {
	try {
		// Victoria Open Data ArcGIS REST service for development permits
		const params = new URLSearchParams({
			where: '1=1',
			outFields: '*',
			orderByFields: 'APPLICATION_DATE DESC',
			resultRecordCount: '100',
			f: 'json'
		});

		const response = await fetch(
			`https://opendata.victoria.ca/datasets/development-permit-applications/api?${params}`,
			{
				headers: { 'User-Agent': 'SVIT/1.0' },
				signal: AbortSignal.timeout(10000)
			}
		);

		if (!response.ok) {
			// Try the ArcGIS Feature Server directly
			return await fetchVictoriaArcGIS();
		}

		const data = await response.json();
		if (!data.features) return await fetchVictoriaArcGIS();

		return data.features.map((f: { properties?: Record<string, unknown>; attributes?: Record<string, unknown>; geometry?: { coordinates?: [number, number] } }) => {
			const props: Record<string, unknown> = f.properties || f.attributes || {};
			const geometry = f.geometry;

			return mapToDevApplication(props, geometry, 'victoria');
		});
	} catch {
		return await fetchVictoriaArcGIS();
	}
}

/** Fallback: try Victoria's ArcGIS Feature Server */
async function fetchVictoriaArcGIS(): Promise<DevelopmentApplication[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields: '*',
			orderByFields: 'EditDate DESC',
			resultRecordCount: '50',
			f: 'json',
			returnGeometry: 'true'
		});

		const response = await fetch(
			`https://services1.arcgis.com/gqkHRGtUEhylIBOE/arcgis/rest/services/Development_Permit_Applications/FeatureServer/0/query?${params}`,
			{
				signal: AbortSignal.timeout(10000)
			}
		);

		if (!response.ok) return [];
		const data = await response.json();
		if (!data.features) return [];

		return data.features.map((f: { attributes: Record<string, unknown>; geometry?: { x: number; y: number } }) => {
			const coords: [number, number] | undefined = f.geometry
				? [f.geometry.x, f.geometry.y]
				: undefined;
			return mapToDevApplication(f.attributes, coords ? { coordinates: coords } : undefined, 'victoria');
		});
	} catch {
		return [];
	}
}

function mapToDevApplication(
	props: Record<string, unknown>,
	geometry: { coordinates?: [number, number] } | undefined,
	municipality: string
): DevelopmentApplication {
	const address = String(props.ADDRESS || props.address || props.CIVIC_ADDRESS || 'Unknown');
	const desc = String(props.DESCRIPTION || props.description || props.PROJECT_DESCRIPTION || '');
	const storeys = parseNumber(props.STOREYS || props.storeys || props.NUMBER_OF_STOREYS);
	const units = parseNumber(props.UNITS || props.units || props.NUMBER_OF_UNITS);
	const status = normalizeStatus(String(props.STATUS || props.status || ''));
	const type = normalizeType(String(props.TYPE || props.type || props.USE_TYPE || ''));

	// Flag logic: 4+ storeys, 100+ units, or major rezoning
	const flagReasons: string[] = [];
	if (storeys && storeys >= 4) flagReasons.push(`${storeys} storeys`);
	if (units && units >= 100) flagReasons.push(`${units} units`);

	const zoningCurrent = String(props.ZONING_CURRENT || props.EXISTING_ZONING || '');
	const zoningProposed = String(props.ZONING_PROPOSED || props.PROPOSED_ZONING || '');
	if (zoningCurrent && zoningProposed && zoningCurrent !== zoningProposed) {
		flagReasons.push(`Rezoning: ${zoningCurrent} → ${zoningProposed}`);
	}

	return {
		id: `vic-dev-${hashCode(address + desc)}`,
		address,
		description: desc,
		applicant: props.APPLICANT ? String(props.APPLICANT) : undefined,
		type,
		status,
		municipality,
		storeys: storeys || undefined,
		units: units || undefined,
		zoningCurrent: zoningCurrent || undefined,
		zoningProposed: zoningProposed || undefined,
		submittedDate: props.APPLICATION_DATE
			? normalizeDate(props.APPLICATION_DATE)
			: undefined,
		coordinates: geometry?.coordinates,
		flagged: flagReasons.length > 0,
		flagReasons: flagReasons.length > 0 ? flagReasons : undefined,
		source: 'victoria-opendata'
	};
}

/** Generate seed development data */
function getSeedDevelopments(): DevelopmentApplication[] {
	return [
		{
			id: 'vic-dev-seed-1',
			address: '1200 Douglas St, Victoria',
			description: 'Mixed-use tower with ground floor retail and residential units above',
			type: 'mixed-use',
			status: 'under-review',
			municipality: 'victoria',
			storeys: 18,
			units: 156,
			zoningCurrent: 'C-1',
			zoningProposed: 'CD-1',
			flagged: true,
			flagReasons: ['18 storeys', '156 units', 'Rezoning: C-1 → CD-1'],
			coordinates: [-123.3615, 48.4284],
			source: 'seed'
		},
		{
			id: 'vic-dev-seed-2',
			address: '900 Pandora Ave, Victoria',
			description: 'Supportive housing with community amenity space',
			type: 'residential',
			status: 'approved',
			municipality: 'victoria',
			storeys: 6,
			units: 45,
			flagged: true,
			flagReasons: ['6 storeys'],
			coordinates: [-123.3580, 48.4265],
			source: 'seed'
		},
		{
			id: 'vic-dev-seed-3',
			address: '3300 Douglas St, Victoria',
			description: 'Townhouse complex replacing single-family lots',
			type: 'residential',
			status: 'proposed',
			municipality: 'victoria',
			storeys: 3,
			units: 24,
			flagged: false,
			coordinates: [-123.3560, 48.4380],
			source: 'seed'
		},
		{
			id: 'lan-dev-seed-1',
			address: '2800 Goldstream Ave, Langford',
			description: 'Large mixed-use development with commercial podium and two residential towers',
			type: 'mixed-use',
			status: 'under-review',
			municipality: 'langford',
			storeys: 12,
			units: 180,
			flagged: true,
			flagReasons: ['12 storeys', '180 units'],
			coordinates: [-123.4956, 48.4491],
			source: 'seed'
		},
		{
			id: 'san-dev-seed-1',
			address: '3800 Shelbourne St, Saanich',
			description: 'Six-storey residential building with underground parking',
			type: 'residential',
			status: 'proposed',
			municipality: 'saanich',
			storeys: 6,
			units: 72,
			flagged: true,
			flagReasons: ['6 storeys'],
			coordinates: [-123.3400, 48.4540],
			source: 'seed'
		},
		{
			id: 'esq-dev-seed-1',
			address: '850 Esquimalt Rd, Esquimalt',
			description: 'Infill residential with retail at grade',
			type: 'mixed-use',
			status: 'approved',
			municipality: 'esquimalt',
			storeys: 4,
			units: 32,
			flagged: true,
			flagReasons: ['4 storeys'],
			coordinates: [-123.4140, 48.4320],
			source: 'seed'
		}
	];
}

function parseNumber(val: unknown): number | undefined {
	if (val === null || val === undefined || val === '') return undefined;
	const n = Number(val);
	return isNaN(n) ? undefined : n;
}

function normalizeStatus(str: string): DevelopmentApplication['status'] {
	const lower = str.toLowerCase();
	if (lower.includes('propos') || lower.includes('submit')) return 'proposed';
	if (lower.includes('review') || lower.includes('pending')) return 'under-review';
	if (lower.includes('approv')) return 'approved';
	if (lower.includes('construct') || lower.includes('building')) return 'under-construction';
	if (lower.includes('complet') || lower.includes('final')) return 'complete';
	if (lower.includes('denied') || lower.includes('refused')) return 'denied';
	if (lower.includes('withdraw')) return 'withdrawn';
	return 'under-review';
}

function normalizeType(str: string): DevelopmentApplication['type'] {
	const lower = str.toLowerCase();
	if (lower.includes('mixed')) return 'mixed-use';
	if (lower.includes('commerc') || lower.includes('retail') || lower.includes('office')) return 'commercial';
	if (lower.includes('resid') || lower.includes('housing') || lower.includes('apartment') || lower.includes('townhouse')) return 'residential';
	if (lower.includes('instit') || lower.includes('school') || lower.includes('hospital')) return 'institutional';
	if (lower.includes('indust')) return 'industrial';
	return 'other';
}

function normalizeDate(val: unknown): string {
	try {
		if (typeof val === 'number') return new Date(val).toISOString();
		return new Date(String(val)).toISOString();
	} catch {
		return new Date().toISOString();
	}
}

function hashCode(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}
	return Math.abs(hash).toString(36);
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const flaggedOnly = url.searchParams.get('flagged') === 'true';
	const limit = parseInt(url.searchParams.get('limit') || '50');

	// Fetch from Victoria Open Data
	let applications = await fetchVictoriaDevPermits();

	// If no live data, use seed data
	if (applications.length === 0) {
		applications = getSeedDevelopments();
	}

	// Filter
	if (municipality) {
		applications = applications.filter((a) => a.municipality === municipality);
	}
	if (flaggedOnly) {
		applications = applications.filter((a) => a.flagged);
	}

	applications = applications.slice(0, limit);

	return json(
		{
			data: applications,
			meta: {
				total: applications.length,
				municipality,
				flaggedCount: applications.filter((a) => a.flagged).length
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
