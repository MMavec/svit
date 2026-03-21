<script lang="ts">
	import Panel from './Panel.svelte';
	import LazyPanel from './LazyPanel.svelte';
	import { panels } from '$lib/config/panels';
	import { layoutStore } from '$lib/stores/layout.svelte';

	// Tier 1 panel components (eagerly loaded — above the fold)
	import CouncilWatch from '$lib/components/panels/CouncilWatch.svelte';
	import BylawTracker from '$lib/components/panels/BylawTracker.svelte';
	import Voices from '$lib/components/panels/Voices.svelte';
	import PublicHearings from '$lib/components/panels/PublicHearings.svelte';
	import DevelopmentWatch from '$lib/components/panels/DevelopmentWatch.svelte';
	import CouncillorProfiles from '$lib/components/panels/CouncillorProfiles.svelte';

	// Tier 2 panel components (eagerly loaded — critical data)
	import LocalWire from '$lib/components/panels/LocalWire.svelte';
	import Pulse from '$lib/components/panels/Pulse.svelte';
	import ConstructionRoads from '$lib/components/panels/ConstructionRoads.svelte';
	import Transit from '$lib/components/panels/Transit.svelte';
	import SafetyEmergency from '$lib/components/panels/SafetyEmergency.svelte';
	import CrimeIncidents from '$lib/components/panels/CrimeIncidents.svelte';

	import PanelError from '$lib/components/ui/PanelError.svelte';
	import type { Component } from 'svelte';
	import { onMount, setContext } from 'svelte';
	import { urlState } from '$lib/stores/url-state.svelte';

	// Collapsed state shared from Panel children via context
	let collapsedMap = $state<Record<string, boolean>>({});
	setContext('grid:setCollapsed', (id: string, collapsed: boolean) => {
		if (collapsedMap[id] !== collapsed) {
			collapsedMap = { ...collapsedMap, [id]: collapsed };
		}
	});

	// Tier 1 + 2: eagerly loaded
	const panelComponents: Record<string, Component> = {
		'council-watch': CouncilWatch,
		'bylaw-tracker': BylawTracker,
		voices: Voices,
		'public-hearings': PublicHearings,
		'development-watch': DevelopmentWatch,
		'councillor-profiles': CouncillorProfiles,
		'local-wire': LocalWire,
		pulse: Pulse,
		'construction-roads': ConstructionRoads,
		transit: Transit,
		'safety-emergency': SafetyEmergency,
		'crime-incidents': CrimeIncidents
	};

	// Tier 3 + 4: lazily loaded (below the fold)
	const lazyPanels: Record<string, () => Promise<{ default: Component }>> = {
		'weather-tides': () => import('$lib/components/panels/WeatherTides.svelte'),
		housing: () => import('$lib/components/panels/Housing.svelte'),
		events: () => import('$lib/components/panels/Events.svelte'),
		'budget-finance': () => import('$lib/components/panels/BudgetFinance.svelte'),
		'wildlife-marine': () => import('$lib/components/panels/WildlifeMarine.svelte'),
		'trees-urban-forest': () => import('$lib/components/panels/TreesUrbanForest.svelte'),
		'nature-environment': () => import('$lib/components/panels/NatureEnvironment.svelte'),
		'my-monitors': () => import('$lib/components/panels/MyMonitors.svelte'),
		connections: () => import('$lib/components/panels/Connections.svelte'),
		threads: () => import('$lib/components/panels/Threads.svelte'),
		demographics: () => import('$lib/components/panels/Demographics.svelte'),
		'grocery-flyers': () => import('$lib/components/panels/GroceryFlyers.svelte'),
		'local-food-drink': () => import('$lib/components/panels/LocalFoodDrink.svelte'),
		'real-estate-market': () => import('$lib/components/panels/RealEstateMarket.svelte'),
		'community-board': () => import('$lib/components/panels/CommunityBoard.svelte'),
		'family-activities': () => import('$lib/components/panels/FamilyActivities.svelte'),
		'parks-recreation': () => import('$lib/components/panels/ParksRecreation.svelte'),
		'schools-libraries': () => import('$lib/components/panels/SchoolsLibraries.svelte')
	};

	const COLS = 12;
	const ROW_HEIGHT = 60;
	const GAP = 12;
	const MOBILE_BREAKPOINT = 768;
	const EXPANDED_ROWS = 10;
	const COLLAPSED_HEIGHT = 48;

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
		// Focused panel expands to full width
		if (urlState.focusedPanel === panelId) {
			const expandedHeight = EXPANDED_ROWS * ROW_HEIGHT + (EXPANDED_ROWS - 1) * GAP;
			return `left:0%;width:100%;top:0px;height:${expandedHeight}px;`;
		}
		const pos = layoutStore.getPosition(panelId);
		const left = (pos.x / COLS) * 100;
		const width = (pos.w / COLS) * 100;
		const top = pos.y * (ROW_HEIGHT + GAP);
		// Collapsed panels shrink to header height
		const height = collapsedMap[panelId]
			? COLLAPSED_HEIGHT
			: pos.h * ROW_HEIGHT + (pos.h - 1) * GAP;
		return `left:${left}%;width:${width}%;top:${top}px;height:${height}px;`;
	}

	function getGridHeight(): number {
		// When a panel is focused, only show the expanded panel
		if (urlState.focusedPanel) {
			return EXPANDED_ROWS * ROW_HEIGHT + (EXPANDED_ROWS - 1) * GAP + GAP;
		}
		let maxBottom = 0;
		for (const panel of panels) {
			const pos = layoutStore.getPosition(panel.id);
			const bottom = pos.y * (ROW_HEIGHT + GAP) + pos.h * ROW_HEIGHT + (pos.h - 1) * GAP;
			if (bottom > maxBottom) maxBottom = bottom;
		}
		return maxBottom + GAP;
	}

	function onPointerDown(e: PointerEvent, panelId: string) {
		// Only start drag from the header, excluding interactive elements
		const target = e.target as HTMLElement;
		if (!target.closest('.panel-header')) return;
		if (target.closest('button, a, input, select, textarea')) return;

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
		{@const lazyLoader = lazyPanels[panel.id]}
		<div
			class="grid-cell"
			class:dragging={dragging === panel.id}
			class:focused={urlState.focusedPanel === panel.id}
			class:dimmed={urlState.focusedPanel !== null && urlState.focusedPanel !== panel.id}
			style={isMobile ? '' : getPanelStyle(panel.id)}
			onpointerdown={isMobile ? undefined : (e) => onPointerDown(e, panel.id)}
			onpointermove={isMobile ? undefined : onPointerMove}
			onpointerup={isMobile ? undefined : onPointerUp}
			role="region"
			aria-label={panel.title}
		>
			<Panel config={panel}>
				<svelte:boundary onerror={(err) => console.error(`Panel ${panel.id} error:`, err)}>
					{#if PanelComponent}
						<PanelComponent />
					{:else if lazyLoader}
						<LazyPanel loader={lazyLoader} />
					{:else}
						<div class="panel-placeholder">Coming soon...</div>
					{/if}
					{#snippet failed(_error, reset)}
						<PanelError message="This panel encountered an error" onRetry={reset} />
					{/snippet}
				</svelte:boundary>
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
			left 0.3s ease,
			width 0.3s ease,
			height 0.3s ease;
		z-index: 1;
	}

	.grid-cell.dragging {
		transition: none;
		z-index: 100;
		opacity: 0.9;
		cursor: grabbing;
	}

	.grid-cell :global(.panel-header) {
		cursor: grab;
	}

	.grid-cell.dragging :global(.panel-header) {
		cursor: grabbing;
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
		min-height: 200px;
	}

	.dashboard-grid.mobile .grid-cell > :global(.panel) {
		height: auto;
		min-height: 180px;
	}

	.grid-cell.focused {
		z-index: 10;
	}

	.grid-cell.dimmed {
		display: none;
	}

	/* Tablet: 2-column grid */
	@media (min-width: 769px) and (max-width: 1024px) {
		.dashboard-grid {
			padding: 0 8px;
		}
	}
</style>
