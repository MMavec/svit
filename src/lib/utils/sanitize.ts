const HTML_ESCAPE_MAP: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

/** Escape HTML special characters to prevent XSS in raw HTML contexts */
export function escapeHtml(str: string): string {
	return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Validate that a URL uses http(s) protocol.
 * Prevents javascript:, data:, and other dangerous schemes.
 */
export function isValidHttpUrl(url: string | undefined | null): boolean {
	if (!url) return false;
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}
