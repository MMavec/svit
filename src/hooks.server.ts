import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			// Scripts: self + inline for Svelte hydration + Vercel Analytics
			"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
			// Styles: self + unsafe-inline for Svelte scoped styles, MapLibre, D3
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			// Images: self + https for map tiles, external photos
			"img-src 'self' https: data:",
			// Fonts: Google Fonts
			"font-src 'self' https://fonts.gstatic.com",
			// Connect: API routes + Supabase + MapLibre tiles + Vercel Analytics
			"connect-src 'self' https://*.supabase.co https://basemaps.cartocdn.com https://*.cartocdn.com https://va.vercel-scripts.com",
			// Workers: MapLibre uses web workers for map rendering
			"worker-src 'self' blob:",
			// Child/frame: none
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	);

	return response;
};
