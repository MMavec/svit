import type { ParkFacility } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchParks(params?: {
	municipality?: string | null;
	type?: string;
	limit?: number;
}) {
	return apiFetch<ParkFacility[]>('/parks', {
		municipality: params?.municipality,
		type: params?.type,
		limit: params?.limit || 30
	});
}
