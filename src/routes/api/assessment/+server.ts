import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AssessmentArea } from '$lib/types/index';
import { parseMunicipality } from '$lib/utils/api-validation';
import { municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 21600; // 6 hours (annual assessment roll — changes rarely)

// City of Victoria — "Assessment Values By Neighbourhood" (12 polygons, pre-aggregated 2026 roll:
// min/max/median/average of land + improvement + total gross value, per property class).
const VICTORIA_ASSESSMENT =
	'https://maps.victoria.ca/server/rest/services/OpenData/OpenData_Land/MapServer/6';

const MUNIS_WITH_FEED = new Set(['victoria']);

interface ArcGisFeature {
	attributes: Record<string, unknown>;
}

async function fetchVictoriaAssessment(): Promise<AssessmentArea[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields:
				'Neighbourhood,Residential_TotalGross_Median,Residential_TotalGross_Average,Residential_LandGross_Median,Residential_ImprGross_Median,Business_TotalGross_Median',
			returnGeometry: 'false',
			f: 'json'
		});

		const response = await fetch(`${VICTORIA_ASSESSMENT}/query?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];

		const data = (await response.json()) as { features?: ArcGisFeature[]; error?: unknown };
		if (data.error || !Array.isArray(data.features)) return [];

		return data.features
			.map((f) => mapToAssessment(f.attributes))
			.sort((a, b) => (b.residentialMedian ?? 0) - (a.residentialMedian ?? 0));
	} catch (err) {
		console.error('Failed to fetch Victoria assessment values:', err);
		return [];
	}
}

function mapToAssessment(props: Record<string, unknown>): AssessmentArea {
	const neighbourhood = str(props.Neighbourhood) || 'Unknown';
	return {
		id: `vic-assess-${neighbourhood.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
		neighbourhood,
		municipality: 'victoria',
		residentialMedian: num(props.Residential_TotalGross_Median),
		residentialAverage: num(props.Residential_TotalGross_Average),
		businessMedian: num(props.Business_TotalGross_Median),
		landMedian: num(props.Residential_LandGross_Median),
		improvementMedian: num(props.Residential_ImprGross_Median),
		source: 'victoria-opendata'
	};
}

function getSeedAssessment(): AssessmentArea[] {
	return [
		{
			id: 'vic-assess-rockland',
			neighbourhood: 'Rockland',
			municipality: 'victoria',
			residentialMedian: 1433000,
			residentialAverage: 1700146,
			landMedian: 820000,
			improvementMedian: 540000,
			source: 'seed'
		},
		{
			id: 'vic-assess-fairfield',
			neighbourhood: 'Fairfield',
			municipality: 'victoria',
			residentialMedian: 1180000,
			residentialAverage: 1320000,
			landMedian: 760000,
			improvementMedian: 420000,
			source: 'seed'
		},
		{
			id: 'vic-assess-jubilee',
			neighbourhood: 'Jubilee',
			municipality: 'victoria',
			residentialMedian: 750000,
			residentialAverage: 815000,
			landMedian: 470000,
			improvementMedian: 290000,
			source: 'seed'
		}
	];
}

// --- helpers ---

function str(val: unknown): string {
	if (val === null || val === undefined) return '';
	return String(val).trim();
}

function num(val: unknown): number | undefined {
	if (val === null || val === undefined || val === '') return undefined;
	const n = Number(val);
	return isNaN(n) || n <= 0 ? undefined : Math.round(n);
}

function municipalityName(slug: string): string {
	return municipalities.find((m) => m.slug === slug)?.name ?? slug;
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));

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
					)} does not publish open neighbourhood assessment values. Live data covers the City of Victoria only.`
				}
			},
			{
				headers: {
					'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
				}
			}
		);
	}

	let areas = await fetchVictoriaAssessment();
	const live = areas.length > 0;
	if (!live) areas = getSeedAssessment();

	const medians = areas.map((a) => a.residentialMedian).filter((v): v is number => Boolean(v));
	const cityRange = medians.length
		? { low: Math.min(...medians), high: Math.max(...medians) }
		: undefined;

	return json(
		{
			data: areas,
			meta: {
				total: areas.length,
				municipality,
				live,
				taxYear: 2026,
				cityRange,
				note: live
					? 'BC Assessment 2026 roll, aggregated by City of Victoria neighbourhood. Residential figures are total assessed value (land + improvements).'
					: 'Live Victoria feed unavailable — showing sample records.'
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
			}
		}
	);
};
