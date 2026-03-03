import type { Meeting } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchMeetings(params?: { municipality?: string | null; limit?: number }) {
	return apiFetch<Meeting[]>('/council', {
		municipality: params?.municipality,
		limit: params?.limit || 30
	});
}
