import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RealEstateMetric } from '$lib/types/index';
import { parseLimit, parseEnum } from '$lib/utils/api-validation';

type RealEstateCategory = 'sales' | 'prices' | 'inventory' | 'days-on-market';
const validRealEstateCategories = new Set<RealEstateCategory>([
	'sales',
	'prices',
	'inventory',
	'days-on-market'
]);

const CACHE_MAX_AGE = 3600; // 1 hour — stats update monthly

/** Latest VREB stats (Feb 2026) — sourced from vreb.org/current-statistics */
function getLatestStats(): RealEstateMetric[] {
	return [
		{
			id: 're-total-sales',
			label: 'Total Sales',
			value: 465,
			unit: 'count',
			change: -11.9,
			period: 'Feb 2026',
			category: 'sales',
			source: 'vreb'
		},
		{
			id: 're-sf-sales',
			label: 'Single Family Sales',
			value: 206,
			unit: 'count',
			change: -12.0,
			period: 'Feb 2026',
			category: 'sales',
			propertyType: 'single-family',
			source: 'vreb'
		},
		{
			id: 're-condo-sales',
			label: 'Condo Sales',
			value: 154,
			unit: 'count',
			change: -19.8,
			period: 'Feb 2026',
			category: 'sales',
			propertyType: 'condo',
			source: 'vreb'
		},
		{
			id: 're-active-listings',
			label: 'Active Listings',
			value: 2903,
			unit: 'count',
			change: 10.4,
			period: 'Feb 2026',
			category: 'inventory',
			source: 'vreb'
		},
		{
			id: 're-sf-benchmark',
			label: 'Single Family Benchmark',
			value: 1307400,
			unit: 'dollars',
			change: -1.2,
			period: 'Feb 2026',
			category: 'prices',
			propertyType: 'single-family',
			municipality: 'victoria',
			source: 'vreb'
		},
		{
			id: 're-condo-benchmark',
			label: 'Condo Benchmark',
			value: 545600,
			unit: 'dollars',
			change: -2.8,
			period: 'Feb 2026',
			category: 'prices',
			propertyType: 'condo',
			municipality: 'victoria',
			source: 'vreb'
		},
		{
			id: 're-new-listings',
			label: 'New Listings',
			value: 896,
			unit: 'count',
			change: 5.2,
			period: 'Feb 2026',
			category: 'inventory',
			source: 'vreb'
		},
		{
			id: 're-sales-to-listings',
			label: 'Sales-to-Listings Ratio',
			value: 16.0,
			unit: 'percent',
			period: 'Feb 2026',
			category: 'inventory',
			source: 'vreb'
		},
		{
			id: 're-median-dom',
			label: 'Median Days on Market',
			value: 28,
			unit: 'count',
			change: 12.0,
			period: 'Feb 2026',
			category: 'days-on-market',
			source: 'vreb'
		},
		{
			id: 're-townhouse-benchmark',
			label: 'Townhouse Benchmark',
			value: 785000,
			unit: 'dollars',
			change: -0.5,
			period: 'Feb 2026',
			category: 'prices',
			propertyType: 'townhouse',
			municipality: 'victoria',
			source: 'vreb'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const limit = parseLimit(url.searchParams.get('limit'), 20);
	const category = parseEnum(url.searchParams.get('category'), validRealEstateCategories);

	let metrics = getLatestStats();

	if (category) {
		metrics = metrics.filter((m) => m.category === category);
	}

	metrics = metrics.slice(0, limit);

	return json(
		{
			data: metrics,
			meta: { total: metrics.length }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=7200`
			}
		}
	);
};
