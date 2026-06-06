import type { HeritageSite } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchHeritage(params?: {
	municipality?: string | null;
	protectedOnly?: boolean;
	limit?: number;
}) {
	return apiFetch<HeritageSite[]>('/heritage', {
		municipality: params?.municipality,
		protected: params?.protectedOnly || undefined,
		limit: params?.limit || 60
	});
}
