import type { DashboardMode } from '$lib/config/dashboard-modes';
import { getModeConfig } from '$lib/config/dashboard-modes';
import { panels } from '$lib/config/panels';
import { layoutStore } from '$lib/stores/layout.svelte';
import { urlState } from '$lib/stores/url-state.svelte';
import type { PanelLayout } from '$lib/types/index';

const STORAGE_KEY = 'svit-mode';

function loadMode(): DashboardMode {
	if (typeof window === 'undefined') return 'generalist';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (
		stored === 'political' ||
		stored === 'nature' ||
		stored === 'social' ||
		stored === 'boomer' ||
		stored === 'family'
	)
		return stored;
	return 'generalist';
}

function computePositions(panelOrder: string[]): PanelLayout {
	const layout: PanelLayout = {};
	for (let i = 0; i < panelOrder.length; i++) {
		const id = panelOrder[i];
		const panel = panels.find((p) => p.id === id);
		if (!panel) continue;
		layout[id] = {
			x: (i % 3) * 4,
			y: Math.floor(i / 3) * 6,
			w: 4,
			h: 6
		};
	}
	return layout;
}

let currentMode = $state<DashboardMode>(loadMode());

export const dashboardModeStore = {
	get mode() {
		return currentMode;
	},

	setMode(mode: DashboardMode) {
		currentMode = mode;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, mode);
		}

		if (mode === 'generalist') {
			layoutStore.reset();
		} else {
			const config = getModeConfig(mode);
			const positions = computePositions(config.panelOrder);
			layoutStore.updateAll(positions);
		}

		urlState.setMode(mode === 'generalist' ? null : mode);
	}
};
