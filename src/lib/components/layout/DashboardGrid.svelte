<script lang="ts">
	import Panel from './Panel.svelte';
	import { panels } from '$lib/config/panels';
	import { layoutStore } from '$lib/stores/layout.svelte';

	// Tier 1 panel components
	import CouncilWatch from '$lib/components/panels/CouncilWatch.svelte';
	import BylawTracker from '$lib/components/panels/BylawTracker.svelte';
	import Voices from '$lib/components/panels/Voices.svelte';
	import PublicHearings from '$lib/components/panels/PublicHearings.svelte';
	import DevelopmentWatch from '$lib/components/panels/DevelopmentWatch.svelte';
	import CouncillorProfiles from '$lib/components/panels/CouncillorProfiles.svelte';

	// Tier 2 panel components
	import LocalWire from '$lib/components/panels/LocalWire.svelte';
	import CRDMapPanel from '$lib/components/panels/CRDMapPanel.svelte';
	import Pulse from '$lib/components/panels/Pulse.svelte';
	import ConstructionRoads from '$lib/components/panels/ConstructionRoads.svelte';
	import Transit from '$lib/components/panels/Transit.svelte';
	import SafetyEmergency from '$lib/components/panels/SafetyEmergency.svelte';

	// Tier 3 panel components
	import WeatherTides from '$lib/components/panels/WeatherTides.svelte';
	import Housing from '$lib/components/panels/Housing.svelte';
	import Events from '$lib/components/panels/Events.svelte';
	import BudgetFinance from '$lib/components/panels/BudgetFinance.svelte';
	import WildlifeMarine from '$lib/components/panels/WildlifeMarine.svelte';
	import TreesUrbanForest from '$lib/components/panels/TreesUrbanForest.svelte';
	import NatureEnvironment from '$lib/components/panels/NatureEnvironment.svelte';

	// Tier 4 panel components (campaign tools)
	import MyMonitors from '$lib/components/panels/MyMonitors.svelte';
	import Connections from '$lib/components/panels/Connections.svelte';
	import Threads from '$lib/components/panels/Threads.svelte';
	import Demographics from '$lib/components/panels/Demographics.svelte';

	import type { Component } from 'svelte';
	import { onMount } from 'svelte';

	const panelComponents: Record<string, Component> = {
		'council-watch': CouncilWatch,
		'bylaw-tracker': BylawTracker,
		voices: Voices,
		'public-hearings': PublicHearings,
		'development-watch': DevelopmentWatch,
		'councillor-profiles': CouncillorProfiles,
		'local-wire': LocalWire,
		'crd-map': CRDMapPanel,
		pulse: Pulse,
		'construction-roads': ConstructionRoads,
		transit: Transit,
		'safety-emergency': SafetyEmergency,
		'weather-tides': WeatherTides,
		housing: Housing,
		events: Events,
		'budget-finance': BudgetFinance,
		'wildlife-marine': WildlifeMarine,
		'trees-urban-forest': TreesUrbanForest,
		'nature-environment': NatureEnvironment,
		'my-monitors': MyMonitors,
		connections: Connections,
		threads: Threads,
		demographics: Demographics
	};

	const COLS = 12;
	const ROW_HEIGHT = 60;
	const GAP = 12;
	const MOBILE_BREAKPOINT = 768;

	// Responsive state
	let isMobile = $state(false);

	onMount(() => {
		const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	// Drag state
	let dragging = $state<string | null>(null);
	let dragStartPos = $state({ mouseX: 0, mouseY: 0, origX: 0, origY: 0 });
	let gridEl: HTMLDivElement;

	function getPanelStyle(panelId: string): string {
		const pos = layoutStore.getPosition(panelId);
		const left = (pos.x / COLS) * 100;
		const width = (pos.w / COLS) * 100;
		const top = pos.y * (ROW_HEIGHT + GAP);
		const height = pos.h * ROW_HEIGHT + (pos.h - 1) * GAP;
		return `left:${left}%;width:${width}%;top:${top}px;height:${height}px;`;
	}

	function getGridHeight(): number {
		let maxBottom = 0;
		for (const panel of panels) {
			const pos = layoutStore.getPosition(panel.id);
			const bottom = pos.y * (ROW_HEIGHT + GAP) + pos.h * ROW_HEIGHT + (pos.h - 1) * GAP;
			if (bottom > maxBottom) maxBottom = bottom;
		}
		return maxBottom + GAP;
	}

	function onPointerDown(e: PointerEvent, panelId: string) {
		// Only start drag from the header
		const target = e.target as HTMLElement;
		if (!target.closest('.panel-header')) return;

		dragging = panelId;
		const pos = layoutStore.getPosition(panelId);
		dragStartPos = { mouseX: e.clientX, mouseY: e.clientY, origX: pos.x, origY: pos.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging || !gridEl) return;
		const gridRect = gridEl.getBoundingClientRect();
		const colWidth = gridRect.width / COLS;
		const deltaX = e.clientX - dragStartPos.mouseX;
		const deltaY = e.clientY - dragStartPos.mouseY;

		const newX = Math.round(dragStartPos.origX + deltaX / colWidth);
		const newY = Math.round(dragStartPos.origY + deltaY / (ROW_HEIGHT + GAP));

		const pos = layoutStore.getPosition(dragging);
		const clampedX = Math.max(0, Math.min(COLS - pos.w, newX));
		const clampedY = Math.max(0, newY);

		if (clampedX !== pos.x || clampedY !== pos.y) {
			layoutStore.updatePosition(dragging, { ...pos, x: clampedX, y: clampedY });
		}
	}

	function onPointerUp() {
		dragging = null;
	}

	// Sort panels by tier for priority rendering
	const sortedPanels = $derived([...panels].sort((a, b) => a.tier - b.tier));
</script>

<div
	class="dashboard-grid"
	class:mobile={isMobile}
	bind:this={gridEl}
	style={isMobile ? '' : `height:${getGridHeight()}px`}
	role="main"
	aria-label="Dashboard panels"
>
	{#each sortedPanels as panel (panel.id)}
		{@const PanelComponent = panelComponents[panel.id]}
		<div
			class="grid-cell"
			class:dragging={dragging === panel.id}
			style={isMobile ? '' : getPanelStyle(panel.id)}
			onpointerdown={isMobile ? undefined : (e) => onPointerDown(e, panel.id)}
			onpointermove={isMobile ? undefined : onPointerMove}
			onpointerup={isMobile ? undefined : onPointerUp}
			role="region"
			aria-label={panel.title}
		>
			<Panel config={panel}>
				{#if PanelComponent}
					<PanelComponent />
				{:else}
					<div class="panel-placeholder">Coming soon...</div>
				{/if}
			</Panel>
		</div>
	{/each}
</div>

<style>
	.dashboard-grid {
		position: relative;
		width: 100%;
		padding: 0 12px;
	}

	.grid-cell {
		position: absolute;
		padding: 6px;
		transition:
			top 0.3s ease,
			left 0.3s ease;
		z-index: 1;
	}

	.grid-cell.dragging {
		transition: none;
		z-index: 100;
		opacity: 0.9;
	}

	.grid-cell > :global(.panel) {
		height: 100%;
	}

	/* Mobile: stacked layout */
	.dashboard-grid.mobile {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: auto !important;
		padding: 0 8px;
	}

	.dashboard-grid.mobile .grid-cell {
		position: static;
		padding: 0;
		transition: none;
		min-height: 300px;
	}

	.dashboard-grid.mobile .grid-cell > :global(.panel) {
		height: auto;
		min-height: 280px;
	}

	/* Tablet: 2-column grid */
	@media (min-width: 769px) and (max-width: 1024px) {
		.dashboard-grid {
			padding: 0 8px;
		}
	}
</style>
