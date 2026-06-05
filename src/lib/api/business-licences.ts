import type { BusinessLicence } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchBusinessLicences(params?: {
	municipality?: string | null;
	category?: BusinessLicence['category'];
	newOnly?: boolean;
	limit?: number;
}) {
	return apiFetch<BusinessLicence[]>('/business-licences', {
		municipality: params?.municipality,
		category: params?.category,
		new: params?.newOnly || undefined,
		limit: params?.limit || 60
	});
}
