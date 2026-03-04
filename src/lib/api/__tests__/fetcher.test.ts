import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../fetcher';

// Mock the cache module — by default, cache returns null (no cached data)
vi.mock('$lib/cache/idb-cache', () => ({
	getCacheKey: vi.fn((path: string, params?: Record<string, unknown>) => {
		const parts = [path];
		if (params) {
			const sorted = Object.entries(params)
				.filter(([, v]) => v !== null && v !== undefined)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([k, v]) => `${k}=${String(v)}`)
				.join('&');
			if (sorted) parts.push(sorted);
		}
		return parts.join('?');
	}),
	getFromCache: vi.fn().mockResolvedValue(null),
	putInCache: vi.fn().mockResolvedValue(undefined),
	isExpired: vi.fn().mockReturnValue(true),
	clearStaleEntries: vi.fn().mockResolvedValue(undefined)
}));

// Import mocked modules for test control
import { getFromCache, isExpired, putInCache } from '$lib/cache/idb-cache';
const mockGetFromCache = vi.mocked(getFromCache);
const mockIsExpired = vi.mocked(isExpired);
const mockPutInCache = vi.mocked(putInCache);

describe('apiFetch', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockClear();
		mockGetFromCache.mockResolvedValue(null);
		mockIsExpired.mockReturnValue(true);
		mockPutInCache.mockResolvedValue(undefined);
		vi.stubGlobal('fetch', mockFetch);
		vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('constructs the correct URL for a simple path', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: [] })
		});

		await apiFetch('/council');
		const calledUrl = mockFetch.mock.calls[0][0];
		expect(calledUrl).toBe('http://localhost:5173/api/council');
	});

	it('appends query params, skipping null/undefined', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: [] })
		});

		await apiFetch('/news', { limit: 10, municipality: 'saanich', empty: null, undef: undefined });
		const calledUrl = mockFetch.mock.calls[0][0];
		const url = new URL(calledUrl);
		expect(url.searchParams.get('limit')).toBe('10');
		expect(url.searchParams.get('municipality')).toBe('saanich');
		expect(url.searchParams.has('empty')).toBe(false);
		expect(url.searchParams.has('undef')).toBe(false);
	});

	it('returns data on successful response', async () => {
		const payload = { data: [{ id: '1', title: 'Test' }], meta: { total: 1 } };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => payload
		});

		const result = await apiFetch('/council');
		expect(result.data).toEqual([{ id: '1', title: 'Test' }]);
		expect(result.meta?.total).toBe(1);
	});

	it('returns error on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error'
		});

		const result = await apiFetch('/council');
		expect(result.error).toBe('API error: 500 Internal Server Error');
		expect(result.data).toEqual([]);
	});

	it('converts boolean params to strings', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: [] })
		});

		await apiFetch('/development', { flagged: true });
		const calledUrl = mockFetch.mock.calls[0][0];
		const url = new URL(calledUrl);
		expect(url.searchParams.get('flagged')).toBe('true');
	});

	// Cache-aware tests

	it('returns cached data when cache is fresh (no network call)', async () => {
		const cachedPayload = { data: [{ id: 'cached' }], meta: { total: 1 } };
		mockGetFromCache.mockResolvedValueOnce({
			key: '/council',
			data: cachedPayload,
			timestamp: Date.now() - 1000,
			ttl: 30 * 60 * 1000
		});
		mockIsExpired.mockReturnValueOnce(false);

		const result = await apiFetch('/council');
		expect(result.data).toEqual([{ id: 'cached' }]);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('makes network call when cache is stale', async () => {
		const cachedPayload = { data: [{ id: 'stale' }] };
		mockGetFromCache.mockResolvedValueOnce({
			key: '/council',
			data: cachedPayload,
			timestamp: Date.now() - 60 * 60 * 1000,
			ttl: 30 * 60 * 1000
		});
		mockIsExpired.mockReturnValueOnce(true);

		const freshPayload = { data: [{ id: 'fresh' }] };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => freshPayload
		});

		const result = await apiFetch('/council');
		expect(result.data).toEqual([{ id: 'fresh' }]);
		expect(mockFetch).toHaveBeenCalled();
	});

	it('returns stale cache on network error with _cached flag', async () => {
		const cachedPayload = { data: [{ id: 'stale' }], meta: { total: 1 } };
		const cacheTimestamp = Date.now() - 60 * 60 * 1000;
		mockGetFromCache.mockResolvedValueOnce({
			key: '/council',
			data: cachedPayload,
			timestamp: cacheTimestamp,
			ttl: 30 * 60 * 1000
		});
		mockIsExpired.mockReturnValueOnce(true);

		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 503,
			statusText: 'Service Unavailable'
		});

		const result = await apiFetch('/council');
		expect(result.data).toEqual([{ id: 'stale' }]);
		expect(result.meta?._cached).toBe(true);
		expect(result.meta?._cachedAt).toBeDefined();
	});

	it('stores fresh response in cache after successful fetch', async () => {
		const freshPayload = { data: [{ id: 'new' }] };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => freshPayload
		});

		await apiFetch('/council');
		expect(mockPutInCache).toHaveBeenCalledWith('/council', freshPayload, '/council');
	});

	it('returns stale cache on network throw (offline)', async () => {
		const cachedPayload = { data: [{ id: 'offline' }] };
		mockGetFromCache.mockResolvedValueOnce({
			key: '/safety',
			data: cachedPayload,
			timestamp: Date.now() - 10 * 60 * 1000,
			ttl: 2 * 60 * 1000
		});
		mockIsExpired.mockReturnValueOnce(true);

		mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

		const result = await apiFetch('/safety');
		expect(result.data).toEqual([{ id: 'offline' }]);
		expect(result.meta?._cached).toBe(true);
	});

	it('returns error when no cache and network fails', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Server Error'
		});

		const result = await apiFetch('/council');
		expect(result.error).toContain('API error');
		expect(result.data).toEqual([]);
	});
});
