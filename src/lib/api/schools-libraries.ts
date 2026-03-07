import type { SchoolLibraryItem } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchSchoolsLibraries(params?: {
	municipality?: string | null;
	type?: string;
	limit?: number;
}) {
	return apiFetch<SchoolLibraryItem[]>('/schools-libraries', {
		municipality: params?.municipality,
		type: params?.type,
		limit: params?.limit || 20
	});
}
