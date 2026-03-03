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
