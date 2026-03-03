import type { SocialPost } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchSocialPosts(params?: { municipality?: string | null; limit?: number }) {
	return apiFetch<SocialPost[]>('/social', {
		municipality: params?.municipality,
		limit: params?.limit || 30
	});
}
