import type { PanelLayout, GridPosition } from '$lib/types/index';
import { panels } from '$lib/config/panels';

const STORAGE_KEY = 'svit-layout';

function getDefaultLayout(): PanelLayout {
	const layout: PanelLayout = {};
	for (const panel of panels) {
		layout[panel.id] = { ...panel.defaultPosition };
	}
	return layout;
}

function loadLayout(): PanelLayout {
	if (typeof window === 'undefined') return getDefaultLayout();
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored) as PanelLayout;
	} catch {
		// ignore corrupt data
	}
	return getDefaultLayout();
}

let positions = $state<PanelLayout>(loadLayout());

export const layoutStore = {
	get positions() {
		return positions;
	},
	getPosition(panelId: string): GridPosition {
		return positions[panelId] ?? { x: 0, y: 0, w: 4, h: 6 };
	},
	updatePosition(panelId: string, pos: GridPosition) {
		positions = { ...positions, [panelId]: pos };
		this.save();
	},
	updateAll(newPositions: PanelLayout) {
		positions = newPositions;
		this.save();
	},
	reset() {
		positions = getDefaultLayout();
		this.save();
	},
	save() {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
		}
	}
};
