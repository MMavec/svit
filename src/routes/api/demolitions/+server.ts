import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DemolitionPermit } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 900; // 15 minutes (permit data updates daily at most)

// City of Victoria self-hosted ArcGIS — "Building Permits Issued in the Last Year (365 days)".
// Demolitions are the `type = 'BP-DEMOLITION'` subset. This is the same dataset behind the Hub
// item b4db2c27a1d14d59a7d7901ba77f16ce_3. The server returns geometry projected to UTM 10N, but
// the layer also carries WGS84 lon/lat in the X_LONG/Y_LAT string columns, which we use directly.
const VICTORIA_PERMITS_LAYER =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_PermitsAndLicences/MapServer/3';

// Municipalities that publish a machine-readable demolition/permit feed. As of the 2026 research
// pass, Victoria is the only CRD municipality with one — Saanich's data is HTML-only (Tempest
// tracker), Oak Bay and the rest publish nothing queryable. We never fabricate records for the
// others; they get an honest empty state with a coverage note.
const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
}

/** Fetch live Victoria demolition permits. Returns [] on any failure (caller falls back to seed). */
async function fetchVictoriaDemolitions(): Promise<DemolitionPermit[]> {
	try {
		const params = new URLSearchParams({
			where: "type='BP-DEMOLITION'",
			outFields:
				'PermitNo,type,SUBJECT,Purpose,IssuedDate,BldgValue,House,Street,Unit,Neighbourhood,X_LONG,Y_LAT',
			orderByFields: 'IssuedDate DESC',
			returnGeometry: 'false',
			resultRecordCount: '200',
			f: 'json'
		});

		const response = await fetch(`${VICTORIA_PERMITS_LAYER}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});

		// NOTE: do NOT gate on content-type here — Victoria's ArcGIS server returns `text/plain`
		// for some f=json query shapes. Parse the body directly and let JSON.parse fail loudly.
		if (!response.ok) return [];

		const data = (await response.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];

		return data.features.map((f) => mapToDemolition(f.attributes));
	} catch (err) {
		console.error('Failed to fetch Victoria demolition permits:', err);
		return [];
	}
}

function mapToDemolition(props: Record<string, unknown>): DemolitionPermit {
	const permitNo = str(props.PermitNo);
	const house = str(props.House);
	const street = str(props.Street);
	const unit = str(props.Unit);
	const neighbourhood = str(props.Neighbourhood);

	const addressParts = [unit ? `${house}-${unit}` : house, titleCase(street)].filter(Boolean);
	const address = addressParts.join(' ') || 'Address withheld';

	// Purpose carries the real scope on its first line, then regulatory boilerplate
	// ("SUBJECT TO DEMOLITION WASTE AND DECONSTRUCTION BYLAW", "BCBC 2024"). Keep the first line.
	const purposeRaw = str(props.Purpose);
	const firstLine = purposeRaw.split(/\r?\n/)[0].trim();
	const subject = str(props.SUBJECT);
	const structure = titleCase(firstLine || subject || 'Demolition');

	const classifyText = `${purposeRaw} ${subject}`.toUpperCase();
	const category = classifyDemolition(classifyText);
	const heritage = /HERITAGE/.test(classifyText);

	const issuedDate = parseArcGisYmd(str(props.IssuedDate));
	const value = parseMoney(props.BldgValue);
	const coordinates = parseCoords(props.X_LONG, props.Y_LAT);

	const idSeed = permitNo || `${address}-${issuedDate ?? ''}`;

	return {
		id: `vic-demo-${permitNo || hashCode(idSeed)}`,
		permitNo: permitNo || undefined,
		address: `${address}, Victoria`,
		structure,
		category,
		municipality: 'victoria',
		neighbourhood: neighbourhood || undefined,
		issuedDate,
		value,
		purpose: firstLine || undefined,
		coordinates,
		heritage: heritage || undefined,
		source: 'victoria-opendata'
	};
}

/** Classify what is being demolished. Order matters — accessory/commercial win over the generic SFD. */
function classifyDemolition(text: string): DemolitionPermit['category'] {
	if (/ACCESSORY|GARAGE|CARPORT|\bSHED\b|OUTBUILDING|GAZEBO|DECK\b/.test(text)) return 'accessory';
	if (/COMMERCIAL|OFFICE|RETAIL|INDUSTRIAL|WAREHOUSE|\bSTORE\b|RESTAURANT|HOTEL|MOTEL/.test(text))
		return 'commercial';
	if (/SCHOOL|CHURCH|HOSPITAL|INSTITUT|TEMPLE|\bHALL\b|CIVIC/.test(text)) return 'institutional';
	if (
		/DUPLEX|TRIPLEX|FOURPLEX|MULTI|APARTMENT|TOWNHOUSE|TOWNHOME|CONDO|STRATA|\bUNITS\b/.test(text)
	)
		return 'multi-unit';
	if (/SINGLE FAMILY|DWELLING|\bSFD\b|\bHOUSE\b|RESIDEN|\bHOME\b/.test(text))
		return 'single-family';
	return 'other';
}

/** Sample fallback — only shown if the live Victoria feed is unreachable. Clearly flagged source:'seed'. */
function getSeedDemolitions(): DemolitionPermit[] {
	return [
		{
			id: 'vic-demo-seed-1',
			permitNo: 'BP-SAMPLE-1',
			address: '1431 Thurlow Rd, Victoria',
			structure: 'Demolish Single Family Dwelling',
			category: 'single-family',
			municipality: 'victoria',
			neighbourhood: 'Fairfield',
			issuedDate: '2026-05-20',
			value: 28000,
			purpose: 'Demolish single family dwelling',
			coordinates: [-123.34371, 48.41333],
			source: 'seed'
		},
		{
			id: 'vic-demo-seed-2',
			permitNo: 'BP-SAMPLE-2',
			address: '935 Hereward Rd, Victoria',
			structure: 'Demolish Accessory Building',
			category: 'accessory',
			municipality: 'victoria',
			neighbourhood: 'Victoria West',
			issuedDate: '2026-04-24',
			value: 6600,
			purpose: 'Demolish accessory building',
			coordinates: [-123.39339, 48.43505],
			source: 'seed'
		},
		{
			id: 'vic-demo-seed-3',
			permitNo: 'BP-SAMPLE-3',
			address: '2002 Richmond Rd, Victoria',
			structure: 'Demolish 2-Story Commercial Building',
			category: 'commercial',
			municipality: 'victoria',
			neighbourhood: 'Jubilee',
			issuedDate: '2026-04-21',
			value: 120000,
			purpose: 'Demolish 2-story commercial building',
			coordinates: [-123.32989, 48.43039],
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

/** ArcGIS IssuedDate is a `YYYYMMDD` string (NOT a real date). `new Date('20260520')` is invalid. */
function parseArcGisYmd(val: string): string | undefined {
	if (!/^\d{8}$/.test(val)) return undefined;
	return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
}

function parseMoney(val: unknown): number | undefined {
	if (val === null || val === undefined || val === '') return undefined;
	const n = Number(String(val).replace(/[^0-9.]/g, ''));
	return isNaN(n) || n <= 0 ? undefined : n;
}

function parseCoords(lngRaw: unknown, latRaw: unknown): [number, number] | undefined {
	const lng = Number(lngRaw);
	const lat = Number(latRaw);
	if (!isFinite(lng) || !isFinite(lat)) return undefined;
	// Sanity-check the record sits in the CRD, not a 0,0 placeholder
	if (lng > -124.2 && lng < -123.0 && lat > 48.2 && lat < 48.8) return [lng, lat];
	return undefined;
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

const CATEGORY_VALUES = new Set<DemolitionPermit['category']>([
	'single-family',
	'multi-unit',
	'commercial',
	'accessory',
	'institutional',
	'other'
]);

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const category = parseEnum(url.searchParams.get('category'), CATEGORY_VALUES);
	const limit = parseLimit(url.searchParams.get('limit'), 50);

	// A specific municipality with no published feed: return an honest empty state, never fake rows.
	if (municipality && !MUNIS_WITH_FEED.has(municipality)) {
		return json(
			{
				data: [],
				meta: {
					total: 0,
					municipality,
					live: false,
					coverage: 'none',
					note: `${municipalityName(
						municipality
					)} does not publish an open demolition-permit feed. Victoria is currently the only CRD municipality with machine-readable demolition data.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
				}
			}
		);
	}

	// Victoria (or All-CRD, which Victoria is the sole feed for).
	let permits = await fetchVictoriaDemolitions();
	const live = permits.length > 0;
	if (!live) permits = getSeedDemolitions();

	if (category) permits = permits.filter((p) => p.category === category);

	// Aggregate over the full filtered set before truncating.
	const totalValue = permits.reduce((sum, p) => sum + (p.value ?? 0), 0);
	const byCategory: Record<string, number> = {};
	for (const p of permits) byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
	const dated = permits.map((p) => p.issuedDate).filter((d): d is string => Boolean(d));
	const dateRange = dated.length
		? { from: dated.reduce((a, b) => (a < b ? a : b)), to: dated.reduce((a, b) => (a > b ? a : b)) }
		: undefined;
	const fullCount = permits.length;

	permits = permits.slice(0, limit);

	return json(
		{
			data: permits,
			meta: {
				total: fullCount,
				municipality,
				live,
				coverage: 'victoria-only',
				totalValue,
				byCategory,
				dateRange,
				note: live
					? municipality
						? undefined
						: 'Live demolition data covers the City of Victoria only — other CRD municipalities do not publish an open permit feed.'
					: 'Live Victoria feed unavailable — showing sample records.'
			}
		},
		{
			headers: { 'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800` }
		}
	);
};
