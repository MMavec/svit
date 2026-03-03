import type { WildlifeSighting } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchWildlifeSightings(params?: {
	municipality?: string | null;
	category?: string;
	limit?: number;
}) {
	return apiFetch<WildlifeSighting[]>('/wildlife', {
		municipality: params?.municipality,
		category: params?.category,
		limit: params?.limit || 20
	});
}
