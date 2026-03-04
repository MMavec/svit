import { describe, it, expect } from 'vitest';
import { escapeHtml, isValidHttpUrl } from '../sanitize';

describe('escapeHtml', () => {
	it('escapes HTML special characters', () => {
		expect(escapeHtml('<script>alert("xss")</script>')).toBe(
			'&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
		);
	});

	it('escapes ampersands', () => {
		expect(escapeHtml('a & b')).toBe('a &amp; b');
	});

	it('escapes single quotes', () => {
		expect(escapeHtml("it's")).toBe('it&#39;s');
	});

	it('returns empty string unchanged', () => {
		expect(escapeHtml('')).toBe('');
	});

	it('leaves safe text unchanged', () => {
		expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
	});
});

describe('isValidHttpUrl', () => {
	it('accepts http URLs', () => {
		expect(isValidHttpUrl('http://example.com')).toBe(true);
	});

	it('accepts https URLs', () => {
		expect(isValidHttpUrl('https://example.com/path?q=1')).toBe(true);
	});

	it('rejects javascript: URLs', () => {
		expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
	});

	it('rejects data: URLs', () => {
		expect(isValidHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
	});

	it('rejects empty string', () => {
		expect(isValidHttpUrl('')).toBe(false);
	});

	it('rejects null', () => {
		expect(isValidHttpUrl(null)).toBe(false);
	});

	it('rejects undefined', () => {
		expect(isValidHttpUrl(undefined)).toBe(false);
	});

	it('rejects malformed URLs', () => {
		expect(isValidHttpUrl('not-a-url')).toBe(false);
	});

	it('rejects ftp URLs', () => {
		expect(isValidHttpUrl('ftp://files.example.com')).toBe(false);
	});

	it('rejects file URLs', () => {
		expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
	});
});
