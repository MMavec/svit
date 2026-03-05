import { panels } from './panels';

export type DashboardMode = 'generalist' | 'political' | 'nature' | 'social';

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
	}
];

export function getModeConfig(id: DashboardMode): ModeConfig {
	return dashboardModes.find((m) => m.id === id) ?? dashboardModes[0];
}
