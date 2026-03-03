<script lang="ts">
	import CRDMap from '$lib/components/map/CRDMap.svelte';
	import { fetchDevelopments } from '$lib/api/development';
	import { fetchConstruction } from '$lib/api/construction';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { MapFeature, DevelopmentApplication, ConstructionEvent } from '$lib/types/index';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let features = $state<MapFeature[]>([]);
	let error = $state<string | null>(null);

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
			color:
				evt.severity === 'MAJOR'
					? 'var(--status-critical)'
					: evt.severity === 'MODERATE'
						? 'var(--accent-warning)'
						: 'var(--accent-secondary)',
			icon: evt.eventType === 'INCIDENT' ? 'alert' : 'construction'
		};
	}

	async function loadFeatures() {
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
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadFeatures();
	});
</script>

{#if error}
	<PanelError message={error} onRetry={loadFeatures} />
{:else}
	<CRDMap {features} />
{/if}
