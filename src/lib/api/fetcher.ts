import type { ApiResponse } from '$lib/types/index';
import {
	getCacheKey,
	getFromCache,
	putInCache,
	isExpired,
	clearStaleEntries
} from '$lib/cache/idb-cache';

const BASE = '/api';

// Run stale entry cleanup once on first import
let cleanupStarted = false;
function ensureCleanup() {
	if (!cleanupStarted) {
		cleanupStarted = true;
		clearStaleEntries().catch(() => {});
	}
}

/** Generic fetcher for internal API routes with IndexedDB caching */
export async function apiFetch<T>(
	path: string,
	params?: Record<string, string | number | boolean | null | undefined>,
	signal?: AbortSignal
): Promise<ApiResponse<T>> {
	ensureCleanup();

	const cacheKey = getCacheKey(path, params);

	// Step 1: Check cache
	let cached: Awaited<ReturnType<typeof getFromCache<ApiResponse<T>>>> = null;
	try {
		cached = await getFromCache<ApiResponse<T>>(cacheKey);
	} catch {
		// IndexedDB unavailable — proceed without cache
	}

	// Fresh cache hit — return immediately, skip network
	if (cached && !isExpired(cached)) {
		return cached.data;
	}

	// Step 2: Network fetch
	const url = new URL(`${BASE}${path}`, window.location.origin);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== null && value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	// Use provided signal or default 30s timeout to prevent indefinite hangs
	const effectiveSignal = signal ?? AbortSignal.timeout(30_000);

	try {
		const response = await fetch(url.toString(), { signal: effectiveSignal });

		if (!response.ok) {
			// Network error: fall back to stale cache if available
			if (cached) {
				return {
					...cached.data,
					meta: {
						...cached.data.meta,
						_cached: true,
						_cachedAt: new Date(cached.timestamp).toISOString()
					}
				};
			}
			return {
				data: [] as unknown as T,
				error: `API error: ${response.status} ${response.statusText}`
			};
		}

		const result: ApiResponse<T> = await response.json();

		// Step 3: Store in cache (fire-and-forget)
		putInCache(cacheKey, result, path).catch(() => {});

		return result;
	} catch (err) {
		// Re-throw AbortErrors from caller-provided signals so panels can handle cancellation
		if (signal?.aborted) {
			throw err;
		}
		// Don't re-throw default timeout aborts — fall through to stale cache

		// Network failure (offline, timeout): fall back to stale cache
		if (cached) {
			return {
				...cached.data,
				meta: {
					...cached.data.meta,
					_cached: true,
					_cachedAt: new Date(cached.timestamp).toISOString()
				}
			};
		}

		return {
			data: [] as unknown as T,
			error: 'Network error'
		};
	}
}
