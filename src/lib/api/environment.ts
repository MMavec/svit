import type { EnvironmentReading } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchEnvironmentReadings(params?: {
	municipality?: string | null;
	type?: string;
	limit?: number;
}) {
	return apiFetch<EnvironmentReading[]>('/environment', {
		municipality: params?.municipality,
		type: params?.type,
		limit: params?.limit || 20
	});
}
