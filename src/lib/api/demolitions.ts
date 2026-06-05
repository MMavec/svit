import type { DemolitionPermit } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchDemolitions(params?: {
	municipality?: string | null;
	category?: DemolitionPermit['category'];
	limit?: number;
}) {
	return apiFetch<DemolitionPermit[]>('/demolitions', {
		municipality: params?.municipality,
		category: params?.category,
		limit: params?.limit || 50
	});
}
