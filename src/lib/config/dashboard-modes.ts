import { panels } from './panels';

export type DashboardMode =
	| 'generalist'
	| 'civic'
	| 'nature'
	| 'social'
	| 'active-senior'
	| 'family'
	| 'be-ready';

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
		panelOrder: buildOrder([
			'council-watch',
			'bylaw-tracker',
			'voices',
			'public-hearings',
			'development-watch',
			'demolition-permits',
			'permit-pulse',
			'business-licences',
			'assessment-values',
			'councillor-profiles',
			'local-wire',
			'pulse',
			'construction-roads',
			'transit',
			'safety-emergency',
			'crime-incidents',
			'weather-tides',
			'mobility',
			'cooling-centres',
			'heritage',
			'public-amenities',
			'patios',
			'power-outages',
			'emergency-alerts',
			'public-land'
		])
	},
	{
		id: 'civic',
		label: 'Civic',
		icon: '🏛',
		panelOrder: buildOrder([
			'council-watch',
			'bylaw-tracker',
			'councillor-profiles',
			'crime-incidents',
			'public-hearings',
			'development-watch',
			'demolition-permits',
			'permit-pulse',
			'business-licences',
			'assessment-values',
			'heritage',
			'public-land',
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
			'ev-charging',
			'cooling-centres',
			'safety-emergency',
			'crime-incidents',
			'parks-recreation',
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
			'crime-incidents',
			'councillor-profiles',
			'community-board',
			'patios',
			'housing',
			'pulse'
		])
	},
	{
		id: 'active-senior',
		label: 'Active Senior',
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
			// Getting around town
			'mobility',
			// Civic engagement — active seniors vote and attend hearings
			'council-watch',
			'councillor-profiles',
			'public-hearings',
			// Weather matters for daily planning
			'weather-tides',
			'safety-emergency',
			'crime-incidents'
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
			'public-amenities',
			// Events and community
			'events',
			'safety-emergency',
			'crime-incidents',
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
	},
	{
		id: 'be-ready',
		label: 'Be Ready',
		icon: '🆘',
		panelOrder: buildOrder([
			// Live emergency signals first
			'power-outages',
			'emergency-alerts',
			'safety-emergency',
			'crime-incidents',
			// Conditions
			'weather-tides',
			'construction-roads',
			'transit',
			// Preparedness resources
			'cooling-centres'
		])
	}
];

export function getModeConfig(id: DashboardMode): ModeConfig {
	return dashboardModes.find((m) => m.id === id) ?? dashboardModes[0];
}
