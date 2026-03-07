import type { GroceryFlyer } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchFlyers(params?: { municipality?: string | null; limit?: number }) {
	return apiFetch<GroceryFlyer[]>('/flyers', {
		municipality: params?.municipality,
		limit: params?.limit || 20
	});
}
