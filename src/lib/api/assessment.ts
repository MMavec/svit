import type { AssessmentArea } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchAssessment(params?: { municipality?: string | null }) {
	return apiFetch<AssessmentArea[]>('/assessment', {
		municipality: params?.municipality
	});
}
