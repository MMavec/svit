import type { BudgetItem } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchBudgetItems(params?: {
	municipality?: string | null;
	type?: 'revenue' | 'expenditure';
	limit?: number;
}) {
	return apiFetch<BudgetItem[]>('/budget', {
		municipality: params?.municipality,
		type: params?.type,
		limit: params?.limit || 30
	});
}
