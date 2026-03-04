import { describe, it, expect } from 'vitest';
import { getCacheKey, getTTL, isExpired, type CacheEntry } from '../idb-cache';

describe('getCacheKey', () => {
	it('handles path with no params', () => {
		expect(getCacheKey('/council')).toBe('/council');
	});

	it('sorts params alphabetically', () => {
		expect(getCacheKey('/council', { municipality: 'victoria', limit: 30 })).toBe(
			'/council?limit=30&municipality=victoria'
		);
	});

	it('excludes null and undefined params', () => {
		expect(getCacheKey('/safety', { municipality: null, limit: 10 })).toBe('/safety?limit=10');
		expect(getCacheKey('/safety', { municipality: undefined })).toBe('/safety');
	});

	it('converts boolean and number params to strings', () => {
		expect(getCacheKey('/events', { active: true, limit: 5 })).toBe('/events?active=true&limit=5');
	});

	it('produces same key regardless of param order', () => {
		const key1 = getCacheKey('/news', { limit: 10, municipality: 'saanich' });
		const key2 = getCacheKey('/news', { municipality: 'saanich', limit: 10 });
		expect(key1).toBe(key2);
	});

	it('handles empty params object', () => {
		expect(getCacheKey('/council', {})).toBe('/council');
	});
});

describe('getTTL', () => {
	it('returns safety TTL for /safety path', () => {
		expect(getTTL('/safety')).toBe(2 * 60 * 1000);
	});

	it('returns transit TTL for /transit path', () => {
		expect(getTTL('/transit')).toBe(2 * 60 * 1000);
	});

	it('returns council TTL for /council path', () => {
		expect(getTTL('/council')).toBe(30 * 60 * 1000);
	});

	it('returns housing TTL for /housing path', () => {
		expect(getTTL('/housing')).toBe(60 * 60 * 1000);
	});

	it('returns default TTL for unknown paths', () => {
		expect(getTTL('/unknown-endpoint')).toBe(5 * 60 * 1000);
	});
});

describe('isExpired', () => {
	it('returns false for a fresh entry', () => {
		const entry: CacheEntry = {
			key: '/test',
			data: {},
			timestamp: Date.now() - 1000, // 1 second ago
			ttl: 5 * 60 * 1000 // 5 min TTL
		};
		expect(isExpired(entry)).toBe(false);
	});

	it('returns true for an entry past its TTL', () => {
		const entry: CacheEntry = {
			key: '/test',
			data: {},
			timestamp: Date.now() - 10 * 60 * 1000, // 10 min ago
			ttl: 5 * 60 * 1000 // 5 min TTL
		};
		expect(isExpired(entry)).toBe(true);
	});

	it('returns true at exactly the TTL boundary', () => {
		const ttl = 5 * 60 * 1000;
		const entry: CacheEntry = {
			key: '/test',
			data: {},
			timestamp: Date.now() - ttl - 1,
			ttl
		};
		expect(isExpired(entry)).toBe(true);
	});

	it('returns false just before TTL boundary', () => {
		const ttl = 5 * 60 * 1000;
		const entry: CacheEntry = {
			key: '/test',
			data: {},
			timestamp: Date.now() - ttl + 1000,
			ttl
		};
		expect(isExpired(entry)).toBe(false);
	});
});
