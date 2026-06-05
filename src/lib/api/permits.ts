import type { BuildingPermit } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchPermits(params?: {
	municipality?: string | null;
	activity?: BuildingPermit['activity'];
	limit?: number;
}) {
	return apiFetch<BuildingPermit[]>('/permits', {
		municipality: params?.municipality,
		activity: params?.activity,
		limit: params?.limit || 50
	});
}
