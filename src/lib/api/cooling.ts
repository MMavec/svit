import type { CoolingResource } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchCooling(params?: {
	municipality?: string | null;
	category?: CoolingResource['category'];
	limit?: number;
}) {
	return apiFetch<CoolingResource[]>('/cooling', {
		municipality: params?.municipality,
		category: params?.category,
		limit: params?.limit || 60
	});
}
