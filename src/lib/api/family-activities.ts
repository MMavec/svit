import type { FamilyActivity } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchFamilyActivities(params?: {
	municipality?: string | null;
	category?: string;
	limit?: number;
}) {
	return apiFetch<FamilyActivity[]>('/family-activities', {
		municipality: params?.municipality,
		category: params?.category,
		limit: params?.limit || 20
	});
}
