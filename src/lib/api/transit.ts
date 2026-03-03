import type { TransitAlert } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchTransitAlerts(params?: { limit?: number }) {
	return apiFetch<TransitAlert[]>('/transit', {
		limit: params?.limit || 50
	});
}
