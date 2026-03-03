import { apiFetch } from '$lib/api/fetcher';
import type {
	Meeting,
	NewsItem,
	DevelopmentApplication,
	CommunityEvent,
	SafetyAlert
} from '$lib/types/index';

export interface SearchResult {
	id: string;
	title: string;
	description: string;
	category: string;
	municipality?: string;
	url?: string;
	panelId: string;
}

let query = $state('');
let isOpen = $state(false);
let results = $state<SearchResult[]>([]);
let searching = $state(false);

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

async function performSearch(q: string) {
	if (!q.trim() || q.trim().length < 2) {
		results = [];
		searching = false;
		return;
	}

	searching = true;
	const term = q.toLowerCase();

	const [councilRes, newsRes, devRes, eventsRes, safetyRes] = await Promise.allSettled([
		apiFetch<Meeting[]>('/council', { limit: 50 }),
		apiFetch<NewsItem[]>('/news', { limit: 50 }),
		apiFetch<DevelopmentApplication[]>('/development', { limit: 50 }),
		apiFetch<CommunityEvent[]>('/events', { limit: 50 }),
		apiFetch<SafetyAlert[]>('/safety', { limit: 50 })
	]);

	const matched: SearchResult[] = [];

	// Council meetings
	if (councilRes.status === 'fulfilled') {
		for (const m of councilRes.value.data || []) {
			if (m.title.toLowerCase().includes(term) || (m.body && m.body.toLowerCase().includes(term))) {
				matched.push({
					id: m.id,
					title: m.title,
					description: m.body || '',
					category: 'Council',
					municipality: m.municipality,
					url: m.agendaUrl,
					panelId: 'council-watch'
				});
			}
		}
	}

	// News
	if (newsRes.status === 'fulfilled') {
		for (const n of newsRes.value.data || []) {
			if (
				n.title.toLowerCase().includes(term) ||
				(n.description && n.description.toLowerCase().includes(term))
			) {
				matched.push({
					id: n.id,
					title: n.title,
					description: n.description || '',
					category: 'News',
					municipality: n.municipality,
					url: n.url,
					panelId: 'local-wire'
				});
			}
		}
	}

	// Development
	if (devRes.status === 'fulfilled') {
		for (const d of devRes.value.data || []) {
			if (d.address.toLowerCase().includes(term) || d.description.toLowerCase().includes(term)) {
				matched.push({
					id: d.id,
					title: d.address,
					description: d.description,
					category: 'Development',
					municipality: d.municipality,
					panelId: 'development-watch'
				});
			}
		}
	}

	// Events
	if (eventsRes.status === 'fulfilled') {
		for (const e of eventsRes.value.data || []) {
			if (
				e.title.toLowerCase().includes(term) ||
				(e.description && e.description.toLowerCase().includes(term))
			) {
				matched.push({
					id: e.id,
					title: e.title,
					description: e.description || '',
					category: 'Event',
					municipality: e.municipality,
					url: e.url,
					panelId: 'events'
				});
			}
		}
	}

	// Safety
	if (safetyRes.status === 'fulfilled') {
		for (const s of safetyRes.value.data || []) {
			if (
				s.title.toLowerCase().includes(term) ||
				(s.description && s.description.toLowerCase().includes(term))
			) {
				matched.push({
					id: s.id,
					title: s.title,
					description: s.description || '',
					category: 'Safety',
					municipality: s.municipality,
					panelId: 'safety-emergency'
				});
			}
		}
	}

	// Sort: title matches first, then description matches
	matched.sort((a, b) => {
		const aTitle = a.title.toLowerCase().includes(term) ? 0 : 1;
		const bTitle = b.title.toLowerCase().includes(term) ? 0 : 1;
		return aTitle - bTitle;
	});

	results = matched.slice(0, 30);
	searching = false;
}

export const searchStore = {
	get query() {
		return query;
	},
	set query(q: string) {
		query = q;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => performSearch(q), 300);
	},
	get isOpen() {
		return isOpen;
	},
	get results() {
		return results;
	},
	get searching() {
		return searching;
	},
	open() {
		isOpen = true;
		query = '';
		results = [];
	},
	close() {
		if (debounceTimer) clearTimeout(debounceTimer);
		isOpen = false;
		query = '';
		results = [];
	}
};
