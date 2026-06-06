import type { PowerOutage } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchPowerOutages(params?: { limit?: number }) {
	return apiFetch<PowerOutage[]>('/power-outages', { limit: params?.limit || 40 });
}
