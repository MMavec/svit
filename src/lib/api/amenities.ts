import type { PublicAmenity } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchAmenities(params?: {
	municipality?: string | null;
	kind?: PublicAmenity['kind'];
	limit?: number;
}) {
	return apiFetch<PublicAmenity[]>('/amenities', {
		municipality: params?.municipality,
		kind: params?.kind,
		limit: params?.limit || 60
	});
}
