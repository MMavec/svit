import type { CrimeIncident } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchCrimeIncidents(params?: {
	municipality?: string | null;
	limit?: number;
	type?: string | null;
}) {
	return apiFetch<CrimeIncident[]>('/crime', {
		municipality: params?.municipality,
		limit: params?.limit || 50,
		type: params?.type
	});
}
