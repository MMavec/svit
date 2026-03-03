import type { NewsItem } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchNews(params?: {
	municipality?: string | null;
	source?: string;
	limit?: number;
}) {
	return apiFetch<NewsItem[]>('/news', {
		municipality: params?.municipality,
		source: params?.source,
		limit: params?.limit || 50
	});
}
