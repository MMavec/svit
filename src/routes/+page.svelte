<script lang="ts">
	import { onMount } from 'svelte';
	import DashboardGrid from '$lib/components/layout/DashboardGrid.svelte';
	import HeroMap from '$lib/components/map/HeroMap.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';

	const pageTitle = $derived(
		municipalityStore.isAllCRD
			? 'SVIT — South Vancouver Island Tracker'
			: `${municipalityStore.label} — SVIT`
	);

	let mapCollapsed = $state(false);
	let mapOpacity = $state(1.0);
	let mounted = $state(false);

	onMount(() => {
		const savedCollapsed = localStorage.getItem('svit-map-collapsed');
		if (savedCollapsed !== null) {
			mapCollapsed = savedCollapsed === 'true';
		}

		const savedOpacity = localStorage.getItem('svit-map-opacity');
		if (savedOpacity !== null) {
			const parsed = parseFloat(savedOpacity);
			if (!isNaN(parsed) && parsed >= 0 && parsed <= 1.0) {
				mapOpacity = parsed;
			}
		}

		mounted = true;
	});

	$effect(() => {
		if (!mounted) return;
		localStorage.setItem('svit-map-collapsed', String(mapCollapsed));
	});

	$effect(() => {
		if (!mounted) return;
		localStorage.setItem('svit-map-opacity', String(mapOpacity));
	});

	function toggleMap() {
		mapCollapsed = !mapCollapsed;
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="dashboard-page">
	<div class="hero-section" class:collapsed={mapCollapsed}>
		{#if mapCollapsed}
			<div class="collapsed-bar">
				<button class="map-toggle-btn" onclick={toggleMap} aria-label="Show map">
					<span class="chevron">&#9660;</span>
					Show Map
				</button>
			</div>
		{:else}
			<div class="map-wrapper" style="opacity: {mapOpacity}">
				<HeroMap
					{mapOpacity}
					onOpacityChange={(v) => {
						mapOpacity = v;
					}}
					onHide={toggleMap}
				/>
			</div>
		{/if}
	</div>
	<DashboardGrid />
</main>

<style>
	.dashboard-page {
		padding: 12px 0;
	}

	.hero-section {
		padding: 0 12px 12px;
		transition: all 0.3s ease;
	}

	.hero-section.collapsed {
		padding-bottom: 4px;
	}

	.collapsed-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 40px;
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
	}

	.map-toggle-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.map-toggle-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-hover);
	}

	.chevron {
		font-size: 0.625rem;
		line-height: 1;
	}

	.map-wrapper {
		transition: opacity 0.2s ease;
	}
</style>
