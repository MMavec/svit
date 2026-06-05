import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BusinessLicence } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 1800; // 30 minutes

// City of Victoria — "Business Licences - Current Year". NOTE: ~95% of rows are annual renewals
// (Covers_FROM = Jan 1). We compute `newlyCommenced` (coverage NOT starting Jan 1) as an honest
// proxy for "not just a renewal" and never label the raw feed as "new businesses".
const VICTORIA_LICENCES =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_PermitsAndLicences/MapServer/1';

const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
	geometry?: { x: number; y: number };
}

async function fetchVictoriaLicences(): Promise<BusinessLicence[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields:
				'TRADE_NAME,LICENCE_TYPE_NAME,naics_description,ISSUED_DATE,Covers_FROM,CIVIC_ADDRESS,Neighbourhood',
			orderByFields: 'ISSUED_DATE DESC',
			returnGeometry: 'true',
			outSR: '4326',
			resultRecordCount: '600',
			f: 'json'
		});

		const response = await fetch(`${VICTORIA_LICENCES}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];

		const data = (await response.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];
		return data.features.map((f) => mapToLicence(f.attributes, f.geometry));
	} catch (err) {
		console.error('Failed to fetch Victoria business licences:', err);
		return [];
	}
}

function mapToLicence(
	props: Record<string, unknown>,
	geometry: { x: number; y: number } | undefined
): BusinessLicence {
	const tradeName = titleCaseName(str(props.TRADE_NAME)) || 'Unnamed licence';
	const licenceTypeRaw = str(props.LICENCE_TYPE_NAME);
	const licenceType = titleCaseName(licenceTypeRaw);
	const coversFromRaw = str(props.Covers_FROM);
	// A licence whose coverage does NOT start on Jan 1 is not a routine annual renewal.
	const newlyCommenced = /^\d{8}$/.test(coversFromRaw) && !coversFromRaw.endsWith('0101');

	const addrLine = str(props.CIVIC_ADDRESS).split(/\r?\n/)[0].trim();

	return {
		id: `vic-lic-${hashCode(tradeName + licenceType + coversFromRaw)}`,
		tradeName,
		licenceType,
		category: classify(licenceTypeRaw.toUpperCase()),
		naics: str(props.naics_description) || undefined,
		municipality: 'victoria',
		neighbourhood: titleCaseName(str(props.Neighbourhood)) || undefined,
		issuedDate: parseArcGisYmd(str(props.ISSUED_DATE)),
		coversFrom: parseArcGisYmd(coversFromRaw),
		newlyCommenced,
		address: addrLine ? titleCaseName(addrLine) : undefined,
		coordinates:
			geometry && isFinite(geometry.x) && isFinite(geometry.y)
				? [geometry.x, geometry.y]
				: undefined,
		source: 'victoria-opendata'
	};
}

function classify(t: string): BusinessLicence['category'] {
	if (/WASHER|DRYER|VENDING/.test(t)) return 'machines';
	if (/NON-TRANSIENT/.test(t)) return 'rental-housing';
	if (/TRANSIENT ACCOMMODATION|BED & BREAKFAST|\bHOTEL\b|\bMOTEL\b/.test(t)) return 'accommodation';
	if (/RESTAURANT|LIQUOR|\bFOOD\b|CATER|BREWERY|\bPUB\b|CAFE/.test(t)) return 'food-drink';
	if (/RETAIL|WHOLESALE/.test(t)) return 'retail';
	if (/PROFESSIONAL/.test(t)) return 'professional';
	if (/PERSONAL SERVICES/.test(t)) return 'personal-services';
	if (/CONTRACTOR|MANUFACTUR|\bTRADES\b|CONSTRUCTION/.test(t)) return 'contractor';
	return 'other';
}

function getSeedLicences(): BusinessLicence[] {
	return [
		{
			id: 'vic-lic-seed-1',
			tradeName: 'Zoo Hairstylez',
			licenceType: 'PERSONAL SERVICES - HAIRDRESSER / BARBER',
			category: 'personal-services',
			municipality: 'victoria',
			neighbourhood: 'Hillside/Quadra',
			issuedDate: '2026-06-04',
			coversFrom: '2026-01-01',
			newlyCommenced: false,
			address: '101-2560 Quadra St',
			coordinates: [-123.35891, 48.43704],
			source: 'seed'
		},
		{
			id: 'vic-lic-seed-2',
			tradeName: 'SL Soccar',
			licenceType: 'BUSINESS SERVICES - CONSULTANT',
			category: 'other',
			municipality: 'victoria',
			neighbourhood: 'Downtown',
			issuedDate: '2026-06-04',
			coversFrom: '2026-06-01',
			newlyCommenced: true,
			address: '301-1321 Blanshard St',
			coordinates: [-123.3614, 48.42641],
			source: 'seed'
		}
	];
}

// --- helpers ---

function str(val: unknown): string {
	if (val === null || val === undefined) return '';
	return String(val).trim();
}

function titleCaseName(s: string): string {
	if (!s) return s;
	return s
		.toLowerCase()
		.replace(/\b([a-z])/g, (c) => c.toUpperCase())
		.replace(/\bBc\b/g, 'BC');
}

function parseArcGisYmd(val: string): string | undefined {
	if (!/^\d{8}$/.test(val)) return undefined;
	return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

const CATEGORY_VALUES = new Set<BusinessLicence['category']>([
	'retail',
	'food-drink',
	'professional',
	'personal-services',
	'accommodation',
	'rental-housing',
	'contractor',
	'machines',
	'other'
]);

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const category = parseEnum(url.searchParams.get('category'), CATEGORY_VALUES);
	const newOnly = url.searchParams.get('new') === 'true';
	const limit = parseLimit(url.searchParams.get('limit'), 60);

	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					note: `${municipalityName(
						municipality
					)} does not publish an open business-licence feed. Live licence data covers the City of Victoria only.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=3600`
				}
			}
		);
	}

	let licences = await fetchVictoriaLicences();
	const live = licences.length > 0;
	if (!live) licences = getSeedLicences();

	// Aggregate over the full fetched set (before user filters) so the breakdown is stable.
	const byCategory: Record<string, number> = {};
	let newlyCommencedCount = 0;
	for (const l of licences) {
		byCategory[l.category] = (byCategory[l.category] ?? 0) + 1;
		if (l.newlyCommenced) newlyCommencedCount += 1;
	}

	if (newOnly) licences = licences.filter((l) => l.newlyCommenced);
	if (category) licences = licences.filter((l) => l.category === category);

	const fullCount = licences.length;
	licences = licences.slice(0, limit);

	return json(
		{
			data: licences,
			meta: {
				total: fullCount,
				municipality,
				live,
				newlyCommencedCount,
				byCategory,
				note: live
					? 'Most current-year licences are annual renewals (coverage starting Jan 1). "Newly commenced" = coverage starting after Jan 1, an honest proxy for non-renewals (not a guarantee of a brand-new business).'
					: 'Live Victoria feed unavailable — showing sample records.'
			}
		},
		{
			headers: { 'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=3600` }
		}
	);
};
