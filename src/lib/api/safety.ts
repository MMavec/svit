import type { SafetyAlert } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchSafetyAlerts(params?: { municipality?: string | null; limit?: number }) {
	return apiFetch<SafetyAlert[]>('/safety', {
		municipality: params?.municipality,
		limit: params?.limit || 50
	});
}
