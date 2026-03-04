/**
 * IndexedDB cache layer for API responses.
 * All operations are wrapped in try/catch and silently degrade if IndexedDB is unavailable.
 */

export interface CacheEntry<T = unknown> {
	key: string;
	data: T;
	timestamp: number;
	ttl: number;
}

/** TTL configuration per API path prefix (milliseconds) */
const CACHE_TTLS: Record<string, number> = {
	'/safety': 2 * 60 * 1000,
	'/transit': 2 * 60 * 1000,
	'/news': 5 * 60 * 1000,
	'/social': 5 * 60 * 1000,
	'/construction': 5 * 60 * 1000,
	'/council': 30 * 60 * 1000,
	'/development': 15 * 60 * 1000,
	'/weather-tides': 15 * 60 * 1000,
	'/housing': 60 * 60 * 1000,
	'/budget': 60 * 60 * 1000,
	'/events': 30 * 60 * 1000,
	'/wildlife': 30 * 60 * 1000,
	'/trees': 30 * 60 * 1000,
	'/environment': 15 * 60 * 1000
};

const DEFAULT_TTL = 5 * 60 * 1000;
const STALE_THRESHOLD = 24 * 60 * 60 * 1000;

const DB_NAME = 'svit-cache';
const DB_VERSION = 1;
const STORE_NAME = 'responses';

let dbPromise: Promise<IDBDatabase> | null = null;
let cleanupDone = false;

function openDB(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB not available'));
			return;
		}
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
				store.createIndex('timestamp', 'timestamp', { unique: false });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	return dbPromise;
}

/** Build a deterministic cache key from path + sorted params */
export function getCacheKey(
	path: string,
	params?: Record<string, string | number | boolean | null | undefined>
): string {
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
}

/** Get the TTL for a given API path */
export function getTTL(path: string): number {
	for (const [prefix, ttl] of Object.entries(CACHE_TTLS)) {
		if (path.startsWith(prefix)) return ttl;
	}
	return DEFAULT_TTL;
}

/** Check if a cache entry has expired past its TTL */
export function isExpired(entry: CacheEntry): boolean {
	return Date.now() - entry.timestamp > entry.ttl;
}

/** Check if a cache entry is too old to keep (>24h) */
function isTooOld(entry: CacheEntry): boolean {
	return Date.now() - entry.timestamp > STALE_THRESHOLD;
}

/** Get a cached entry by key. Returns null if not found or too old. */
export async function getFromCache<T>(key: string): Promise<CacheEntry<T> | null> {
	try {
		const db = await openDB();
		return new Promise<CacheEntry<T> | null>((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.get(key);
			request.onsuccess = () => {
				const entry = request.result as CacheEntry<T> | undefined;
				if (!entry || !entry.data || isTooOld(entry)) {
					resolve(null);
				} else {
					resolve(entry);
				}
			};
			request.onerror = () => resolve(null);
		});
	} catch {
		return null;
	}
}

/** Store data in cache with the appropriate TTL for the given path. */
export async function putInCache<T>(key: string, data: T, path: string): Promise<void> {
	try {
		const db = await openDB();
		const entry: CacheEntry<T> = {
			key,
			data,
			timestamp: Date.now(),
			ttl: getTTL(path)
		};
		return new Promise<void>((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			store.put(entry);
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	} catch {
		// Silent fail — cache is a pure enhancement
	}
}

/** Delete entries older than 24 hours. Called once on first use. */
export async function clearStaleEntries(): Promise<void> {
	if (cleanupDone) return;
	cleanupDone = true;
	try {
		const db = await openDB();
		const cutoff = Date.now() - STALE_THRESHOLD;
		return new Promise<void>((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const index = store.index('timestamp');
			const range = IDBKeyRange.upperBound(cutoff);
			const request = index.openCursor(range);
			request.onsuccess = () => {
				const cursor = request.result;
				if (cursor) {
					cursor.delete();
					cursor.continue();
				}
			};
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	} catch {
		// Silent fail
	}
}

/** Clear the entire cache store. */
export async function clearAllCache(): Promise<void> {
	try {
		const db = await openDB();
		return new Promise<void>((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			store.clear();
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	} catch {
		// Silent fail
	}
}
