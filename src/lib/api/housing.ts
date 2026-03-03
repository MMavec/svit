import type { HousingMetric } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchHousingMetrics(params?: {
	municipality?: string | null;
	limit?: number;
}) {
	return apiFetch<HousingMetric[]>('/housing', {
		municipality: params?.municipality,
		limit: params?.limit || 20
	});
}
