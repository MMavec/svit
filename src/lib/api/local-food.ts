import type { LocalFoodItem } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchLocalFood(params?: {
	municipality?: string | null;
	category?: string;
	limit?: number;
}) {
	return apiFetch<LocalFoodItem[]>('/local-food', {
		municipality: params?.municipality,
		category: params?.category,
		limit: params?.limit || 30
	});
}
