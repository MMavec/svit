import { describe, it, expect } from 'vitest';
import { hashCode } from '../hash';

describe('hashCode', () => {
	it('returns a string', () => {
		expect(typeof hashCode('test')).toBe('string');
	});

	it('returns consistent output for the same input', () => {
		expect(hashCode('hello')).toBe(hashCode('hello'));
	});

	it('returns different output for different inputs', () => {
		expect(hashCode('hello')).not.toBe(hashCode('world'));
	});

	it('handles empty string', () => {
		expect(hashCode('')).toBe('0');
	});

	it('handles long strings', () => {
		const long = 'a'.repeat(10000);
		const result = hashCode(long);
		expect(result.length).toBeGreaterThan(0);
		expect(result.length).toBeLessThan(20);
	});

	it('returns base-36 encoded string', () => {
		const result = hashCode('test-string');
		expect(result).toMatch(/^[0-9a-z]+$/);
	});

	it('handles special characters', () => {
		const result = hashCode('<div>Hello & "World"</div>');
		expect(result).toBeTruthy();
	});
});
