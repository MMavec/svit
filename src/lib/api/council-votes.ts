import type { CouncilVote } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchCouncilVotes(params?: {
	councillor?: string;
	splitOnly?: boolean;
	limit?: number;
}) {
	return apiFetch<CouncilVote[]>('/council-votes', {
		councillor: params?.councillor,
		split: params?.splitOnly || undefined,
		limit: params?.limit || 80
	});
}
