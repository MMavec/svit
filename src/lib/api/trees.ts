import type { TreeObservation } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchTreeObservations(params?: {
	municipality?: string | null;
	heritage?: boolean;
	limit?: number;
}) {
	return apiFetch<TreeObservation[]>('/trees', {
		municipality: params?.municipality,
		heritage: params?.heritage,
		limit: params?.limit || 20
	});
}
