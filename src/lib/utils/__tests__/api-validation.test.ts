import { describe, it, expect } from 'vitest';
import { parseLimit, parseMunicipality } from '../api-validation';

describe('parseLimit', () => {
	it('returns default when null', () => {
		expect(parseLimit(null)).toBe(30);
	});

	it('returns default when empty string', () => {
		expect(parseLimit('')).toBe(30);
	});

	it('parses valid number', () => {
		expect(parseLimit('50')).toBe(50);
	});

	it('uses custom default', () => {
		expect(parseLimit(null, 20)).toBe(20);
	});

	it('clamps to max', () => {
		expect(parseLimit('999')).toBe(200);
	});

	it('clamps to custom max', () => {
		expect(parseLimit('50', 30, 40)).toBe(40);
	});

	it('returns default for negative values', () => {
		expect(parseLimit('-5')).toBe(30);
	});

	it('returns default for zero', () => {
		expect(parseLimit('0')).toBe(30);
	});

	it('returns default for non-numeric string', () => {
		expect(parseLimit('abc')).toBe(30);
	});

	it('handles float strings (truncates to integer)', () => {
		expect(parseLimit('10.7')).toBe(10);
	});
});

describe('parseMunicipality', () => {
	it('returns null for null input', () => {
		expect(parseMunicipality(null)).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(parseMunicipality('')).toBeNull();
	});

	it('returns slug for valid municipality', () => {
		expect(parseMunicipality('victoria')).toBe('victoria');
		expect(parseMunicipality('saanich')).toBe('saanich');
		expect(parseMunicipality('oak-bay')).toBe('oak-bay');
	});

	it('returns null for invalid municipality', () => {
		expect(parseMunicipality('vancouver')).toBeNull();
		expect(parseMunicipality('toronto')).toBeNull();
	});

	it('returns null for SQL injection attempt', () => {
		expect(parseMunicipality("'; DROP TABLE--")).toBeNull();
	});

	it('is case-sensitive (slugs are lowercase)', () => {
		expect(parseMunicipality('Victoria')).toBeNull();
		expect(parseMunicipality('SAANICH')).toBeNull();
	});

	it('validates all 13 CRD municipalities', () => {
		const slugs = [
			'victoria',
			'saanich',
			'esquimalt',
			'oak-bay',
			'langford',
			'colwood',
			'sooke',
			'sidney',
			'north-saanich',
			'central-saanich',
			'view-royal',
			'highlands',
			'metchosin'
		];
		for (const slug of slugs) {
			expect(parseMunicipality(slug)).toBe(slug);
		}
	});
});
