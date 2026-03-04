import { municipalities } from '$lib/config/municipalities';

const validSlugs = new Set(municipalities.map((m) => m.slug));

/** Parse and clamp a limit parameter to [1, max] */
export function parseLimit(raw: string | null, defaultVal = 30, max = 200): number {
	const n = parseInt(raw || String(defaultVal));
	if (isNaN(n) || n < 1) return defaultVal;
	return Math.min(n, max);
}

/** Validate a municipality slug. Returns the slug if valid, null otherwise. */
export function parseMunicipality(raw: string | null): string | null {
	if (!raw) return null;
	return validSlugs.has(raw) ? raw : null;
}

/** Validate a parameter against an allowed set of values. Returns the value if valid, null otherwise. */
export function parseEnum<T extends string>(raw: string | null, allowed: Set<T>): T | null {
	if (!raw) return null;
	return allowed.has(raw as T) ? (raw as T) : null;
}

/** Check that a fetch response has a JSON-compatible content-type */
export function isJsonResponse(response: Response): boolean {
	const ct = response.headers.get('content-type') || '';
	return ct.includes('application/json') || ct.includes('text/json');
}
