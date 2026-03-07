import type { CommunityPost } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchCommunityPosts(params?: {
	municipality?: string | null;
	category?: string;
	limit?: number;
}) {
	return apiFetch<CommunityPost[]>('/community-board', {
		municipality: params?.municipality,
		category: params?.category,
		limit: params?.limit || 30
	});
}
