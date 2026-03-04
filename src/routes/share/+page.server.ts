import type { PageServerLoad } from './$types';
import { municipalities } from '$lib/config/municipalities';
import { panels } from '$lib/config/panels';

export const load: PageServerLoad = ({ url }) => {
	const m = url.searchParams.get('m');
	const panel = url.searchParams.get('panel');

	const municipality = m ? municipalities.find((mun) => mun.slug === m) : null;
	const panelConfig = panel ? panels.find((p) => p.id === panel) : null;

	const title = municipality
		? `${municipality.name} — SVIT`
		: 'SVIT — South Vancouver Island Tracker';

	const description = panelConfig
		? `${panelConfig.title} for ${municipality?.name ?? 'the Capital Regional District'} — SVIT`
		: `Real-time civic monitoring dashboard for ${municipality?.name ?? 'the Capital Regional District'}, BC.`;

	// Build redirect URL to main SPA
	const redirectUrl = new URL('/', url.origin);
	if (m) redirectUrl.searchParams.set('m', m);
	if (panel) redirectUrl.searchParams.set('panel', panel);

	return {
		title,
		description,
		ogImage: `${url.origin}/og-image.svg`,
		redirectUrl: redirectUrl.toString(),
		municipality: m,
		panel
	};
};
