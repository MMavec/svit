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
			if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 1.0) {
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
			<div class="map-controls">
				<div class="control-strip">
					<label class="opacity-control">
						<span class="opacity-label">Opacity</span>
						<input
							type="range"
							min="0.2"
							max="1"
							step="0.05"
							bind:value={mapOpacity}
							class="opacity-slider"
							aria-label="Map opacity"
						/>
						<span class="opacity-value">{Math.round(mapOpacity * 100)}%</span>
					</label>
					<button class="map-toggle-btn" onclick={toggleMap} aria-label="Hide map">
						<span class="chevron">&#9650;</span>
						Hide Map
					</button>
				</div>
			</div>
			<div class="map-wrapper" style="opacity: {mapOpacity}">
				<HeroMap />
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

	.map-controls {
		margin-bottom: 6px;
	}

	.control-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 12px;
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		gap: 12px;
	}

	.opacity-control {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.75rem;
		color: var(--text-secondary);
		cursor: default;
	}

	.opacity-label {
		font-weight: 500;
		user-select: none;
	}

	.opacity-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100px;
		height: 4px;
		border-radius: 2px;
		background: var(--border-primary);
		outline: none;
		cursor: pointer;
	}

	.opacity-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent-primary);
		border: 2px solid var(--bg-surface);
		cursor: pointer;
	}

	.opacity-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent-primary);
		border: 2px solid var(--bg-surface);
		cursor: pointer;
	}

	.opacity-value {
		font-family: 'Geist Mono', monospace;
		font-size: 0.6875rem;
		min-width: 32px;
		text-align: right;
		color: var(--text-tertiary);
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

	@media (max-width: 768px) {
		.opacity-slider {
			width: 60px;
		}

		.opacity-label {
			display: none;
		}
	}
</style>
