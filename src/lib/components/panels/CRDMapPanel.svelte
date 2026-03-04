<script lang="ts">
	import CRDMap from '$lib/components/map/CRDMap.svelte';
	import { fetchDevelopments } from '$lib/api/development';
	import { fetchConstruction } from '$lib/api/construction';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { MapFeature, DevelopmentApplication, ConstructionEvent } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { constructionSeverityColor } from '$lib/utils/color-maps';

	let features = $state<MapFeature[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showDevelopment = $state(true);
	let showConstruction = $state(true);
	let showFlaggedOnly = $state(false);

	const filteredFeatures = $derived(
		features.filter((f) => {
			if (!showDevelopment && f.type === 'development') return false;
			if (!showConstruction && f.type === 'construction') return false;
			if (showFlaggedOnly && f.severity !== 'high') return false;
			return true;
		})
	);

	function devToFeature(app: DevelopmentApplication): MapFeature | null {
		if (!app.coordinates) return null;
		return {
			id: `dev-${app.id}`,
			type: 'development',
			coordinates: app.coordinates,
			title: app.address,
			description: `${app.type} — ${app.status}${app.storeys ? ` (${app.storeys} storeys)` : ''}`,
			severity: app.flagged ? 'high' : 'normal',
			municipality: app.municipality,
			color: app.flagged ? 'var(--accent-danger)' : 'var(--accent-primary)',
			icon: 'building'
		};
	}

	function constructionToFeature(evt: ConstructionEvent): MapFeature | null {
		if (!evt.coordinates) return null;
		return {
			id: `con-${evt.id}`,
			type: 'construction',
			coordinates: evt.coordinates,
			title: evt.roads[0]?.name || evt.headline,
			description: evt.description.slice(0, 120),
			severity: evt.severity,
			municipality: evt.municipality,
			color: constructionSeverityColor(evt.severity),
			icon: evt.eventType === 'INCIDENT' ? 'alert' : 'construction'
		};
	}

	async function loadFeatures() {
		loading = true;
		error = null;
		const slug = municipalityStore.slug;
		const [devResult, conResult] = await Promise.all([
			fetchDevelopments({ municipality: slug }),
			fetchConstruction({ municipality: slug })
		]);

		if (devResult.error && conResult.error) {
			error = devResult.error;
			return;
		}

		const devFeatures = (devResult.data || [])
			.map(devToFeature)
			.filter((f): f is MapFeature => f !== null);

		const conFeatures = (conResult.data || [])
			.map(constructionToFeature)
			.filter((f): f is MapFeature => f !== null);

		features = [...devFeatures, ...conFeatures];
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadFeatures();
	});
</script>

{#if loading}
	<PanelSkeleton variant="card" />
{:else if error}
	<PanelError message={error} onRetry={loadFeatures} />
{:else}
	<div class="map-panel">
		<div class="map-filters">
			<label class="filter-check">
				<input type="checkbox" bind:checked={showDevelopment} />
				<span class="filter-dot" style="background: var(--accent-primary)"></span>
				Development
			</label>
			<label class="filter-check">
				<input type="checkbox" bind:checked={showConstruction} />
				<span class="filter-dot" style="background: var(--accent-warning)"></span>
				Construction
			</label>
			<label class="filter-check flagged-check">
				<input type="checkbox" bind:checked={showFlaggedOnly} />
				Flagged only
			</label>
		</div>
		<CRDMap features={filteredFeatures} />
	</div>
{/if}

<style>
	.map-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.map-filters {
		display: flex;
		gap: 10px;
		padding: 4px 6px 6px;
		flex-wrap: wrap;
	}

	.filter-check {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.6875rem;
		color: var(--text-secondary);
		cursor: pointer;
		user-select: none;
	}

	.filter-check input {
		width: 12px;
		height: 12px;
		margin: 0;
		accent-color: var(--accent-primary);
	}

	.filter-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.flagged-check {
		margin-left: auto;
		color: var(--accent-danger);
		font-weight: 600;
	}
</style>
