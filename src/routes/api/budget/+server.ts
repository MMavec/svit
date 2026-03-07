import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BudgetItem } from '$lib/types/index';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';

type BudgetType = 'revenue' | 'expenditure';
const validBudgetTypes = new Set<BudgetType>(['revenue', 'expenditure']);

const CACHE_MAX_AGE = 86400; // 24 hours — budget data changes rarely

function getSeedData(): BudgetItem[] {
	return [
		// Victoria
		{
			id: 'budget-vic-1',
			municipality: 'victoria',
			year: 2026,
			category: 'Protective Services',
			amount: 86200000,
			percentOfTotal: 24.8,
			changeFromPrior: 3.2,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-vic-2',
			municipality: 'victoria',
			year: 2026,
			category: 'Engineering & Public Works',
			amount: 68400000,
			percentOfTotal: 19.7,
			changeFromPrior: 5.1,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-vic-3',
			municipality: 'victoria',
			year: 2026,
			category: 'Parks & Recreation',
			amount: 42100000,
			percentOfTotal: 12.1,
			changeFromPrior: 2.8,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-vic-4',
			municipality: 'victoria',
			year: 2026,
			category: 'General Government',
			amount: 38900000,
			percentOfTotal: 11.2,
			changeFromPrior: 1.5,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-vic-5',
			municipality: 'victoria',
			year: 2026,
			category: 'Debt & Fiscal',
			amount: 31200000,
			percentOfTotal: 9.0,
			changeFromPrior: -2.1,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-vic-6',
			municipality: 'victoria',
			year: 2026,
			category: 'Property Taxes',
			amount: 218000000,
			percentOfTotal: 62.7,
			changeFromPrior: 6.5,
			type: 'revenue',
			source: 'seed'
		},
		{
			id: 'budget-vic-7',
			municipality: 'victoria',
			year: 2026,
			category: 'User Fees & Charges',
			amount: 72500000,
			percentOfTotal: 20.9,
			changeFromPrior: 3.1,
			type: 'revenue',
			source: 'seed'
		},
		// Saanich
		{
			id: 'budget-san-1',
			municipality: 'saanich',
			year: 2026,
			category: 'Protective Services',
			amount: 72100000,
			percentOfTotal: 26.3,
			changeFromPrior: 4.1,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-san-2',
			municipality: 'saanich',
			year: 2026,
			category: 'Engineering & Public Works',
			amount: 54300000,
			percentOfTotal: 19.8,
			changeFromPrior: 3.7,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-san-3',
			municipality: 'saanich',
			year: 2026,
			category: 'Parks & Recreation',
			amount: 38600000,
			percentOfTotal: 14.1,
			changeFromPrior: 2.3,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-san-4',
			municipality: 'saanich',
			year: 2026,
			category: 'Property Taxes',
			amount: 182000000,
			percentOfTotal: 66.4,
			changeFromPrior: 5.8,
			type: 'revenue',
			source: 'seed'
		},
		// Langford
		{
			id: 'budget-lan-1',
			municipality: 'langford',
			year: 2026,
			category: 'Protective Services',
			amount: 22800000,
			percentOfTotal: 23.5,
			changeFromPrior: 7.2,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-lan-2',
			municipality: 'langford',
			year: 2026,
			category: 'Engineering & Public Works',
			amount: 24100000,
			percentOfTotal: 24.8,
			changeFromPrior: 12.3,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-lan-3',
			municipality: 'langford',
			year: 2026,
			category: 'Parks & Recreation',
			amount: 14200000,
			percentOfTotal: 14.6,
			changeFromPrior: 8.5,
			type: 'expenditure',
			source: 'seed'
		},
		{
			id: 'budget-lan-4',
			municipality: 'langford',
			year: 2026,
			category: 'Property Taxes',
			amount: 62500000,
			percentOfTotal: 64.3,
			changeFromPrior: 9.1,
			type: 'revenue',
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const type = parseEnum(url.searchParams.get('type'), validBudgetTypes);
	const limit = parseLimit(url.searchParams.get('limit'));

	// Budget data is static/annual — always use seed data
	// (future: fetch from municipality open data portals)
	let items = getSeedData();

	if (municipality) {
		items = items.filter((b) => b.municipality === municipality);
	}

	if (type) {
		items = items.filter((b) => b.type === type);
	}

	// Sort: expenditures by amount desc, revenues by amount desc
	items.sort((a, b) => b.amount - a.amount);

	items = items.slice(0, limit);

	return json(
		{
			data: items,
			meta: { total: items.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
			}
		}
	);
};
