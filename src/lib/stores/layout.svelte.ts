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

function isValidPosition(pos: unknown): pos is GridPosition {
	if (!pos || typeof pos !== 'object') return false;
	const p = pos as Record<string, unknown>;
	return (
		typeof p.x === 'number' &&
		typeof p.y === 'number' &&
		typeof p.w === 'number' &&
		typeof p.h === 'number' &&
		p.x >= 0 &&
		p.y >= 0 &&
		p.w > 0 &&
		p.h > 0
	);
}

function loadLayout(): PanelLayout {
	if (typeof window === 'undefined') return getDefaultLayout();
	const defaults = getDefaultLayout();
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as PanelLayout;
			// Ensure every configured panel has a valid position entry
			for (const panel of panels) {
				if (!isValidPosition(parsed[panel.id])) {
					parsed[panel.id] = { ...defaults[panel.id] };
				}
			}
			return parsed;
		}
	} catch {
		// ignore corrupt data
	}
	return defaults;
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
