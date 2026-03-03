import type { ApiResponse } from '$lib/types/index';

const BASE = '/api';

/** Generic fetcher for internal API routes with caching support */
export async function apiFetch<T>(
	path: string,
	params?: Record<string, string | number | boolean | null | undefined>
): Promise<ApiResponse<T>> {
	const url = new URL(`${BASE}${path}`, window.location.origin);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== null && value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	const response = await fetch(url.toString());

	if (!response.ok) {
		return {
			data: [] as unknown as T,
			error: `API error: ${response.status} ${response.statusText}`
		};
	}

	return response.json();
}
