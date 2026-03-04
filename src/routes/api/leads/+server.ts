import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function sanitizeString(str: string | undefined | null, maxLength = 200): string | null {
	if (!str || typeof str !== 'string') return null;
	return str.trim().slice(0, maxLength) || null;
}

export const POST: RequestHandler = async ({ request }) => {
	if (!supabase) {
		return json({ error: 'Service not configured' }, { status: 503 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	// Validate email (required)
	if (!body.email || typeof body.email !== 'string' || !isValidEmail(body.email)) {
		return json({ error: 'Valid email is required' }, { status: 400 });
	}

	// Validate consent
	if (!body.consent_privacy) {
		return json({ error: 'Privacy consent is required' }, { status: 400 });
	}

	const leadData = {
		email: (body.email as string).toLowerCase().trim().slice(0, 254),
		phone: sanitizeString(body.phone as string, 30),
		display_name: sanitizeString(body.name as string, 100),
		municipality_interest: sanitizeString(body.municipality as string, 50),
		interests: Array.isArray(body.interests)
			? (body.interests as string[]).filter((i) => typeof i === 'string').slice(0, 20)
			: [],
		consent_marketing: !!body.consent_marketing,
		consent_privacy: true,
		source: sanitizeString(body.source as string, 50) || 'website',
		user_agent: request.headers.get('user-agent')?.substring(0, 500) || null,
		referrer: request.headers.get('referer')?.substring(0, 500) || null
	};

	const { data, error } = await supabase
		.from('leads')
		.upsert(leadData, { onConflict: 'email' })
		.select('id')
		.single();

	if (error) {
		console.error('Lead insert error:', error);
		return json({ error: 'Failed to save' }, { status: 500 });
	}

	// Insert social accounts if provided
	if (body.social_accounts && Array.isArray(body.social_accounts) && data?.id) {
		const validPlatforms = new Set([
			'bluesky',
			'twitter',
			'facebook',
			'instagram',
			'linkedin',
			'tiktok'
		]);
		const socialRows = (body.social_accounts as { platform?: string; handle?: string }[])
			.filter(
				(s) =>
					s &&
					typeof s.platform === 'string' &&
					typeof s.handle === 'string' &&
					validPlatforms.has(s.platform.toLowerCase()) &&
					s.handle.trim().length > 0
			)
			.slice(0, 10)
			.map((s) => ({
				lead_id: data.id,
				platform: s.platform!.toLowerCase().trim(),
				handle: s.handle!.trim().slice(0, 200)
			}));

		if (socialRows.length > 0) {
			await supabase
				.from('lead_social_accounts')
				.upsert(socialRows, { onConflict: 'lead_id,platform' });
		}
	}

	return json({ success: true });
};
