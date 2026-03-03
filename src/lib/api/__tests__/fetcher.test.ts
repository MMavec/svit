import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../fetcher';

describe('apiFetch', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockClear();
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
});
