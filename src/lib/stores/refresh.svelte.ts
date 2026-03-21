const STORAGE_KEY = 'svit-auto-refresh';

/** Refresh intervals in milliseconds */
export const REFRESH_INTERVALS: Record<string, number> = {
	// Tier 1 — political intelligence: 15 min
	'council-watch': 15 * 60 * 1000,
	'bylaw-tracker': 15 * 60 * 1000,
	voices: 5 * 60 * 1000,
	'public-hearings': 15 * 60 * 1000,
	'development-watch': 15 * 60 * 1000,
	'councillor-profiles': 60 * 60 * 1000,

	// Tier 2 — community intelligence: 5 min
	'local-wire': 5 * 60 * 1000,
	pulse: 5 * 60 * 1000,
	'construction-roads': 5 * 60 * 1000,
	transit: 3 * 60 * 1000,
	'safety-emergency': 3 * 60 * 1000,
	'crime-incidents': 5 * 60 * 1000,

	// Tier 3 — quality of life: 15 min
	'weather-tides': 15 * 60 * 1000,
	housing: 60 * 60 * 1000,
	events: 30 * 60 * 1000,
	'budget-finance': 60 * 60 * 1000,
	'wildlife-marine': 30 * 60 * 1000,
	'trees-urban-forest': 30 * 60 * 1000,
	'nature-environment': 15 * 60 * 1000
};

function getInitialEnabled(): boolean {
	if (typeof window === 'undefined') return true;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored !== '0';
}

let enabled = $state(getInitialEnabled());

export const refreshStore = {
	get enabled() {
		return enabled;
	},
	toggle() {
		enabled = !enabled;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
		}
	},
	getInterval(panelId: string): number {
		return REFRESH_INTERVALS[panelId] ?? 15 * 60 * 1000;
	}
};
