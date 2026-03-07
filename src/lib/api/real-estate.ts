import type { RealEstateMetric } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchRealEstateMetrics(params?: { category?: string; limit?: number }) {
	return apiFetch<RealEstateMetric[]>('/real-estate', {
		category: params?.category,
		limit: params?.limit || 20
	});
}
