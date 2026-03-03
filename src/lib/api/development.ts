import type { DevelopmentApplication } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchDevelopments(params?: {
	municipality?: string | null;
	flagged?: boolean;
	limit?: number;
}) {
	return apiFetch<DevelopmentApplication[]>('/development', {
		municipality: params?.municipality,
		flagged: params?.flagged || undefined,
		limit: params?.limit || 50
	});
}
