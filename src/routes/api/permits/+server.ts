import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BuildingPermit } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 900; // 15 minutes

// City of Victoria — "Building Permits Issued in the Last 60 Days" (the rolling "pulse" feed).
// Demolitions have their own dedicated tile; this tile shows the full building-activity picture
// across all disciplines (building / electrical / plumbing / sign) with $ value + counts.
const VICTORIA_PERMITS_60D =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_PermitsAndLicences/MapServer/4';

const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
}

async function fetchVictoriaPermits(): Promise<BuildingPermit[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields:
				'PermitNo,type,PermitType,Purpose,Status,IssuedDate,BldgValue,House,Street,Unit,Neighbourhood,AUC_Group,X_LONG,Y_LAT',
			orderByFields: 'IssuedDate DESC',
			returnGeometry: 'false',
			resultRecordCount: '2000',
			f: 'json'
		});

		const response = await fetch(`${VICTORIA_PERMITS_60D}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];

		const data = (await response.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];

		// A single permit can span multiple unit rows (same PermitNo). Dedupe to one per permit so
		// keys stay unique AND construction value isn't double-counted in the aggregation.
		const seen = new Set<string>();
		const out: BuildingPermit[] = [];
		for (const f of data.features) {
			const p = mapToPermit(f.attributes);
			if (seen.has(p.id)) continue;
			seen.add(p.id);
			out.push(p);
		}
		return out;
	} catch (err) {
		console.error('Failed to fetch Victoria building permits:', err);
		return [];
	}
}

function mapToPermit(props: Record<string, unknown>): BuildingPermit {
	const permitNo = str(props.PermitNo);
	const typeCode = str(props.type).toUpperCase();
	const house = str(props.House);
	const street = str(props.Street);
	const unit = str(props.Unit);
	const addr = [unit ? `${house}-${unit}` : house, titleCase(street)].filter(Boolean).join(' ');

	const discipline = disciplineOf(typeCode);
	const activity = activityOf(typeCode);
	const purposeRaw = str(props.Purpose);
	const purpose = titleCase(purposeRaw.split(/\r?\n/)[0].trim());

	return {
		id: `vic-permit-${permitNo || hashCode(addr + purposeRaw)}`,
		permitNo: permitNo || undefined,
		address: `${addr || 'Address withheld'}, Victoria`,
		discipline,
		activity,
		purpose: purpose || titleCase(typeCode),
		status: str(props.Status) || 'Unknown',
		useGroup: str(props.AUC_Group) || undefined,
		municipality: 'victoria',
		neighbourhood: str(props.Neighbourhood) || undefined,
		issuedDate: parseArcGisYmd(str(props.IssuedDate)),
		value: parseMoney(props.BldgValue),
		coordinates: parseCoords(props.X_LONG, props.Y_LAT),
		source: 'victoria-opendata'
	};
}

function disciplineOf(typeCode: string): BuildingPermit['discipline'] {
	if (typeCode.startsWith('EP-')) return 'electrical';
	if (typeCode.startsWith('PP-')) return 'plumbing';
	if (typeCode.startsWith('SP-')) return 'sign';
	return 'building';
}

function activityOf(typeCode: string): BuildingPermit['activity'] {
	if (typeCode.startsWith('EP-')) return 'electrical';
	if (typeCode.startsWith('PP-')) return 'plumbing';
	if (typeCode.startsWith('SP-')) return 'sign';
	if (typeCode === 'BP-DEMOLITION') return 'demolition';
	if (typeCode === 'BP-COMPLEX' || typeCode === 'BP-RES-SFD/DUP') return 'new-construction';
	if (typeCode === 'BP-INTERIOR ONLY' || typeCode === 'BP-STRIP OUT') return 'renovation';
	return 'other';
}

function getSeedPermits(): BuildingPermit[] {
	return [
		{
			id: 'vic-permit-seed-1',
			permitNo: 'BP-SAMPLE-1',
			address: '229 Howe St, Victoria',
			discipline: 'building',
			activity: 'renovation',
			purpose: 'Remove Exterior Basement Window With Interior Alterations',
			status: 'ACTIVE',
			useGroup: 'Residential',
			municipality: 'victoria',
			neighbourhood: 'Fairfield',
			issuedDate: '2026-06-04',
			value: 5000,
			coordinates: [-123.35035, 48.41231],
			source: 'seed'
		},
		{
			id: 'vic-permit-seed-2',
			permitNo: 'BP-SAMPLE-2',
			address: '707-314 Esquimalt Rd, Victoria',
			discipline: 'electrical',
			activity: 'electrical',
			purpose: 'Kitchen Renovation',
			status: 'ACTIVE',
			useGroup: 'Residential',
			municipality: 'victoria',
			neighbourhood: 'Victoria West',
			issuedDate: '2026-06-04',
			value: 1975,
			coordinates: [-123.39224, 48.43065],
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
	if (lng > -124.2 && lng < -123.0 && lat > 48.2 && lat < 48.8) return [lng, lat];
	return undefined;
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

const ACTIVITY_VALUES = new Set<BuildingPermit['activity']>([
	'new-construction',
	'renovation',
	'demolition',
	'electrical',
	'plumbing',
	'sign',
	'other'
]);

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const activity = parseEnum(url.searchParams.get('activity'), ACTIVITY_VALUES);
	const limit = parseLimit(url.searchParams.get('limit'), 50);

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
					)} does not publish an open building-permit feed. Live permit data covers the City of Victoria only.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
				}
			}
		);
	}

	let permits = await fetchVictoriaPermits();
	const live = permits.length > 0;
	if (!live) permits = getSeedPermits();

	if (activity) permits = permits.filter((p) => p.activity === activity);

	// Aggregate over the full filtered set before truncating.
	const byActivity: Record<string, { count: number; value: number }> = {};
	const byNeighbourhood: Record<string, number> = {};
	let totalValue = 0;
	for (const p of permits) {
		totalValue += p.value ?? 0;
		const a = (byActivity[p.activity] ??= { count: 0, value: 0 });
		a.count += 1;
		a.value += p.value ?? 0;
		if (p.neighbourhood)
			byNeighbourhood[p.neighbourhood] = (byNeighbourhood[p.neighbourhood] ?? 0) + 1;
	}
	const fullCount = permits.length;
	const dated = permits.map((p) => p.issuedDate).filter((d): d is string => Boolean(d));
	const dateRange = dated.length
		? { from: dated.reduce((a, b) => (a < b ? a : b)), to: dated.reduce((a, b) => (a > b ? a : b)) }
		: undefined;

	permits = permits.slice(0, limit);

	return json(
		{
			data: permits,
			meta: {
				total: fullCount,
				municipality,
				live,
				windowDays: 60,
				totalValue,
				byActivity,
				byNeighbourhood,
				dateRange,
				note: live
					? municipality
						? undefined
						: 'Building-permit activity covers the City of Victoria (last 60 days). Other CRD municipalities do not publish an open permit feed.'
					: 'Live Victoria feed unavailable — showing sample records.'
			}
		},
		{
			headers: { 'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800` }
		}
	);
};
