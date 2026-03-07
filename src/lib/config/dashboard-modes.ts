import { panels } from './panels';

export type DashboardMode = 'generalist' | 'political' | 'nature' | 'social' | 'boomer' | 'family';

export interface ModeConfig {
	id: DashboardMode;
	label: string;
	icon: string;
	panelOrder: string[];
}

const allPanelIds = panels.map((p) => p.id);

function buildOrder(prioritized: string[]): string[] {
	const remaining = allPanelIds.filter((id) => !prioritized.includes(id));
	return [...prioritized, ...remaining];
}

export const dashboardModes: ModeConfig[] = [
	{
		id: 'generalist',
		label: 'Generalist',
		icon: '👤',
		panelOrder: allPanelIds
	},
	{
		id: 'political',
		label: 'Political',
		icon: '🏛',
		panelOrder: buildOrder([
			'council-watch',
			'bylaw-tracker',
			'councillor-profiles',
			'public-hearings',
			'development-watch',
			'voices',
			'local-wire',
			'budget-finance',
			'pulse'
		])
	},
	{
		id: 'nature',
		label: 'Nature',
		icon: '🌿',
		panelOrder: buildOrder([
			'wildlife-marine',
			'trees-urban-forest',
			'nature-environment',
			'weather-tides',
			'safety-emergency',
			'pulse'
		])
	},
	{
		id: 'social',
		label: 'Social',
		icon: '🎉',
		panelOrder: buildOrder([
			'events',
			'voices',
			'local-wire',
			'councillor-profiles',
			'housing',
			'pulse'
		])
	},
	{
		id: 'boomer',
		label: 'Boomer',
		icon: '📰',
		panelOrder: buildOrder([
			// Lead with practical daily-life tiles
			'grocery-flyers',
			'local-food-drink',
			'real-estate-market',
			// Community classifieds — the Craigslist/UsedVictoria digest
			'community-board',
			// Local news and events (Facebook-page-style digest feel)
			'local-wire',
			'voices',
			'events',
			// Civic engagement — boomers vote and attend hearings
			'council-watch',
			'councillor-profiles',
			'public-hearings',
			// Weather matters for daily planning
			'weather-tides',
			'safety-emergency'
		])
	},
	{
		id: 'family',
		label: 'Family',
		icon: '👨‍👩‍👧‍👦',
		panelOrder: buildOrder([
			// Family-first tiles
			'family-activities',
			'parks-recreation',
			'schools-libraries',
			// Events and community
			'events',
			'safety-emergency',
			'weather-tides',
			// Nature & outdoor (family outings)
			'wildlife-marine',
			'nature-environment',
			'trees-urban-forest',
			// Local news and practical
			'local-wire',
			'construction-roads',
			'transit'
		])
	}
];

export function getModeConfig(id: DashboardMode): ModeConfig {
	return dashboardModes.find((m) => m.id === id) ?? dashboardModes[0];
}
