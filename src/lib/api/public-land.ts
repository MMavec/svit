import type { PublicLandParcel } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchPublicLand(params?: {
	municipality?: string | null;
	inventoryClass?: string;
	limit?: number;
}) {
	return apiFetch<PublicLandParcel[]>('/public-land', {
		municipality: params?.municipality,
		class: params?.inventoryClass,
		limit: params?.limit || 100
	});
}
