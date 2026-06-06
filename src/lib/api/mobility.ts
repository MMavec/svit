import type { MobilityFeature } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchMobility(params?: {
	municipality?: string | null;
	kind?: MobilityFeature['kind'];
	limit?: number;
}) {
	return apiFetch<MobilityFeature[]>('/mobility', {
		municipality: params?.municipality,
		kind: params?.kind,
		limit: params?.limit || 80
	});
}
