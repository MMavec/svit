import { municipalities } from '$lib/config/municipalities';
import { panels } from '$lib/config/panels';
import { municipalityStore } from '$lib/stores/municipality.svelte';
import type { DashboardMode } from '$lib/config/dashboard-modes';

const validModes = new Set<string>([
	'generalist',
	'political',
	'nature',
	'social',
	'boomer',
	'family'
]);

interface UrlState {
	municipality: string | null;
	panel: string | null;
	query: string | null;
	mode: DashboardMode | null;
}

const validMunicipalities = new Set(municipalities.map((m) => m.slug));
const validPanels = new Set(panels.map((p) => p.id));

function parseUrlState(): UrlState {
	if (typeof window === 'undefined')
		return { municipality: null, panel: null, query: null, mode: null };
	const params = new URLSearchParams(window.location.search);

	const m = params.get('m');
	const panel = params.get('panel');
	const q = params.get('q');
	const mode = params.get('mode');

	return {
		municipality: m && validMunicipalities.has(m) ? m : null,
		panel: panel && validPanels.has(panel) ? panel : null,
		query: q && q.trim().length > 0 ? q.trim() : null,
		mode: mode && validModes.has(mode) ? (mode as DashboardMode) : null
	};
}

function updateUrl(state: Partial<UrlState>, usePushState = false) {
	if (typeof window === 'undefined') return;
	const url = new URL(window.location.href);

	if (state.municipality !== undefined) {
		if (state.municipality) url.searchParams.set('m', state.municipality);
		else url.searchParams.delete('m');
	}
	if (state.panel !== undefined) {
		if (state.panel) url.searchParams.set('panel', state.panel);
		else url.searchParams.delete('panel');
	}
	if (state.query !== undefined) {
		if (state.query) url.searchParams.set('q', state.query);
		else url.searchParams.delete('q');
	}
	if (state.mode !== undefined) {
		if (state.mode && state.mode !== 'generalist') url.searchParams.set('mode', state.mode);
		else url.searchParams.delete('mode');
	}

	const newUrl = url.pathname + url.search;
	if (newUrl === window.location.pathname + window.location.search) return;

	if (usePushState) {
		history.pushState({}, '', newUrl);
	} else {
		history.replaceState({}, '', newUrl);
	}
}

let focusedPanelId = $state<string | null>(null);
let initialized = false;

export const urlState = {
	get focusedPanel() {
		return focusedPanelId;
	},

	initialize() {
		if (initialized) return;
		initialized = true;

		const parsed = parseUrlState();

		// URL params override localStorage defaults
		if (parsed.municipality && validMunicipalities.has(parsed.municipality)) {
			municipalityStore.select(parsed.municipality);
		}
		if (parsed.panel) {
			focusedPanelId = parsed.panel;
		}
		if (parsed.mode) {
			import('$lib/stores/dashboard-mode.svelte').then(({ dashboardModeStore }) => {
				dashboardModeStore.setMode(parsed.mode!);
			});
		}

		// Listen for browser back/forward
		window.addEventListener('popstate', () => {
			const state = parseUrlState();
			if (state.municipality && validMunicipalities.has(state.municipality)) {
				municipalityStore.select(state.municipality);
			} else if (!window.location.search.includes('m=')) {
				municipalityStore.select(null);
			}
			focusedPanelId = state.panel;
			if (state.mode) {
				import('$lib/stores/dashboard-mode.svelte').then(({ dashboardModeStore }) => {
					dashboardModeStore.setMode(state.mode!);
				});
			}
		});
	},

	setMunicipality(slug: string | null) {
		updateUrl({ municipality: slug });
	},

	focusPanel(panelId: string | null) {
		const previous = focusedPanelId;
		focusedPanelId = panelId;
		updateUrl({ panel: panelId }, panelId !== null && previous !== panelId);
	},

	setSearchQuery(query: string | null) {
		updateUrl({ query });
	},

	setMode(mode: DashboardMode | null) {
		updateUrl({ mode });
	},

	getShareUrl(panelId?: string): string {
		if (typeof window === 'undefined') return '';
		let shareUrl = `${window.location.origin}/share`;
		const params: string[] = [];
		const slug = municipalityStore.slug;
		if (slug) params.push(`m=${encodeURIComponent(slug)}`);
		const panel = panelId ?? focusedPanelId;
		if (panel) params.push(`panel=${encodeURIComponent(panel)}`);
		if (params.length > 0) shareUrl += `?${params.join('&')}`;
		return shareUrl;
	}
};
