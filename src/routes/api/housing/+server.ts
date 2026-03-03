import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { HousingMetric } from '$lib/types/index';

const CACHE_MAX_AGE = 900; // 15 minutes

/** Fetch CMHC housing starts data for Victoria CMA */
async function fetchCMHCStarts(): Promise<HousingMetric[]> {
	try {
		// CMHC Housing Information Portal — Victoria CMA housing starts
		const response = await fetch(
			'https://www03.cmhc-schl.gc.ca/hmip-pimh/api/v1/housing-market-indicators?geography=935&category=1',
			{
				headers: { 'User-Agent': 'SVIT/1.0', Accept: 'application/json' },
				signal: AbortSignal.timeout(8000)
			}
		);

		if (!response.ok) return [];

		const data = await response.json();
		if (!data || !Array.isArray(data)) return [];

		const metrics: HousingMetric[] = [];
		for (const item of data.slice(0, 5)) {
			if (item.value != null) {
				metrics.push({
					id: `cmhc-${item.indicator || 'starts'}-${item.period}`,
					label: String(item.indicatorName || item.indicator || 'Housing Starts'),
					value: Number(item.value),
					unit: 'count',
					period: String(item.period || ''),
					source: 'cmhc'
				});
			}
		}

		return metrics;
	} catch {
		return [];
	}
}

function getSeedData(municipality?: string | null): HousingMetric[] {
	const metrics: HousingMetric[] = [
		{
			id: 'housing-1',
			label: 'Median Home Price',
			value: 875000,
			unit: 'dollars',
			change: 4.2,
			period: '2026 Q1',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'housing-2',
			label: 'Active Listings',
			value: 1243,
			unit: 'count',
			change: 12.5,
			period: 'Mar 2026',
			source: 'seed'
		},
		{
			id: 'housing-3',
			label: 'Average Rent (1BR)',
			value: 1850,
			unit: 'dollars',
			change: 3.8,
			period: 'Mar 2026',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'housing-4',
			label: 'Housing Starts',
			value: 287,
			unit: 'count',
			change: -8.3,
			period: '2026 YTD',
			source: 'seed'
		},
		{
			id: 'housing-5',
			label: 'Vacancy Rate',
			value: 1.8,
			unit: 'percent',
			change: 0.3,
			period: '2025 Q4',
			source: 'seed'
		},
		{
			id: 'housing-6',
			label: 'Median Home Price',
			value: 1125000,
			unit: 'dollars',
			change: 2.1,
			period: '2026 Q1',
			municipality: 'oak-bay',
			source: 'seed'
		},
		{
			id: 'housing-7',
			label: 'Median Home Price',
			value: 950000,
			unit: 'dollars',
			change: 5.7,
			period: '2026 Q1',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			id: 'housing-8',
			label: 'Median Home Price',
			value: 720000,
			unit: 'dollars',
			change: 6.3,
			period: '2026 Q1',
			municipality: 'langford',
			source: 'seed'
		},
		{
			id: 'housing-9',
			label: 'Average Rent (1BR)',
			value: 1650,
			unit: 'dollars',
			change: 5.1,
			period: 'Mar 2026',
			municipality: 'langford',
			source: 'seed'
		},
		{
			id: 'housing-10',
			label: 'New Listings (30d)',
			value: 342,
			unit: 'count',
			change: 18.2,
			period: 'Mar 2026',
			source: 'seed'
		}
	];

	if (municipality) {
		return metrics.filter((m) => !m.municipality || m.municipality === municipality);
	}
	return metrics;
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	// Try live data first
	let metrics = await fetchCMHCStarts();

	// Fall back to seed data
	if (metrics.length === 0) {
		metrics = getSeedData(municipality);
	} else if (municipality) {
		metrics = metrics.filter((m) => !m.municipality || m.municipality === municipality);
	}

	metrics = metrics.slice(0, limit);

	return json(
		{
			data: metrics,
			meta: { total: metrics.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
