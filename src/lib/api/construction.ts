import type { ConstructionEvent } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchConstruction(params?: {
	municipality?: string | null;
	eventType?: string;
	limit?: number;
}) {
	return apiFetch<ConstructionEvent[]>('/construction', {
		municipality: params?.municipality,
		event_type: params?.eventType,
		limit: params?.limit || 50
	});
}
