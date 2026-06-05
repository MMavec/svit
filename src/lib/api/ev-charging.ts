import type { EvCharger } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchEvChargers(params?: { municipality?: string | null }) {
	return apiFetch<EvCharger[]>('/ev-charging', {
		municipality: params?.municipality
	});
}
