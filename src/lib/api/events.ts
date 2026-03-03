import type { CommunityEvent } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchEvents(params?: {
	municipality?: string | null;
	category?: string;
	limit?: number;
}) {
	return apiFetch<CommunityEvent[]>('/events', {
		municipality: params?.municipality,
		category: params?.category,
		limit: params?.limit || 20
	});
}
