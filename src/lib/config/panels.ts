import type { PanelConfig } from '$lib/types/index';

export const panels: PanelConfig[] = [
	// Tier 1 — Political Intelligence
	{
		id: 'council-watch',
		title: 'Council Watch',
		tier: 1,
		icon: '🏛',
		defaultPosition: { x: 0, y: 0, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'bylaw-tracker',
		title: 'Bylaw Tracker',
		tier: 1,
		icon: '📋',
		defaultPosition: { x: 4, y: 0, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'voices',
		title: 'Voices',
		tier: 1,
		icon: '💬',
		defaultPosition: { x: 8, y: 0, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'public-hearings',
		title: 'Public Hearings',
		tier: 1,
		icon: '📢',
		defaultPosition: { x: 0, y: 6, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'development-watch',
		title: 'Development Watch',
		tier: 1,
		icon: '🏗',
		defaultPosition: { x: 4, y: 6, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'councillor-profiles',
		title: 'Councillors & Mayors',
		tier: 1,
		icon: '👤',
		defaultPosition: { x: 8, y: 6, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 2 — Community Intelligence
	{
		id: 'local-wire',
		title: 'Local Wire',
		tier: 2,
		icon: '📰',
		defaultPosition: { x: 0, y: 12, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'pulse',
		title: 'Pulse',
		tier: 2,
		icon: '📊',
		defaultPosition: { x: 4, y: 12, w: 4, h: 6 },
		minWidth: 2,
		minHeight: 3
	},
	{
		id: 'construction-roads',
		title: 'Construction & Roads',
		tier: 2,
		icon: '🚧',
		defaultPosition: { x: 8, y: 12, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'transit',
		title: 'Transit',
		tier: 2,
		icon: '🚌',
		defaultPosition: { x: 0, y: 18, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'safety-emergency',
		title: 'Safety & Emergency',
		tier: 2,
		icon: '🚨',
		defaultPosition: { x: 4, y: 18, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'weather-tides',
		title: 'Weather & Tides',
		tier: 2,
		icon: '🌊',
		defaultPosition: { x: 8, y: 18, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 3 — Quality of Life
	{
		id: 'housing',
		title: 'Housing & Development',
		tier: 3,
		icon: '🏠',
		defaultPosition: { x: 0, y: 24, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'events',
		title: 'Community Events',
		tier: 3,
		icon: '🎉',
		defaultPosition: { x: 4, y: 24, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'budget-finance',
		title: 'Budget & Finance',
		tier: 3,
		icon: '💰',
		defaultPosition: { x: 8, y: 24, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'wildlife-marine',
		title: 'Wildlife & Marine',
		tier: 3,
		icon: '🐋',
		defaultPosition: { x: 0, y: 30, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'trees-urban-forest',
		title: 'Trees & Urban Forest',
		tier: 3,
		icon: '🌳',
		defaultPosition: { x: 4, y: 30, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'nature-environment',
		title: 'Nature & Environment',
		tier: 3,
		icon: '🌿',
		defaultPosition: { x: 8, y: 30, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'demographics',
		title: 'Demographics',
		tier: 3,
		icon: '📈',
		defaultPosition: { x: 0, y: 36, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 4 — Campaign Tools (requires account)
	{
		id: 'my-monitors',
		title: 'My Monitors',
		tier: 4,
		icon: '🔔',
		defaultPosition: { x: 4, y: 36, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'connections',
		title: 'Connections',
		tier: 4,
		icon: '🔗',
		defaultPosition: { x: 8, y: 36, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'threads',
		title: 'Threads',
		tier: 4,
		icon: '🧵',
		defaultPosition: { x: 0, y: 42, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 3 — Boomer Mode panels
	{
		id: 'grocery-flyers',
		title: 'Grocery Flyers',
		tier: 3,
		icon: '🛒',
		defaultPosition: { x: 4, y: 42, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'local-food-drink',
		title: 'Local Food & Drink',
		tier: 3,
		icon: '🍷',
		defaultPosition: { x: 8, y: 42, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'real-estate-market',
		title: 'Real Estate Market',
		tier: 3,
		icon: '🏡',
		defaultPosition: { x: 0, y: 48, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'community-board',
		title: 'Community Board',
		tier: 3,
		icon: '📌',
		defaultPosition: { x: 4, y: 48, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 3 — Family Mode panels
	{
		id: 'family-activities',
		title: 'Family Activities',
		tier: 3,
		icon: '👨‍👩‍👧‍👦',
		defaultPosition: { x: 8, y: 48, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'parks-recreation',
		title: 'Parks & Recreation',
		tier: 3,
		icon: '🏊',
		defaultPosition: { x: 0, y: 54, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'schools-libraries',
		title: 'Schools & Libraries',
		tier: 3,
		icon: '📚',
		defaultPosition: { x: 4, y: 54, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	}
];

export function getPanelsByTier(tier: 1 | 2 | 3 | 4): PanelConfig[] {
	return panels.filter((p) => p.tier === tier);
}

export function getPanel(id: string): PanelConfig | undefined {
	return panels.find((p) => p.id === id);
}
