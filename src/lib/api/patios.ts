import type { PatioArea } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchPatios(params?: { municipality?: string | null; limit?: number }) {
	return apiFetch<PatioArea[]>('/patios', {
		municipality: params?.municipality,
		limit: params?.limit || 80
	});
}
