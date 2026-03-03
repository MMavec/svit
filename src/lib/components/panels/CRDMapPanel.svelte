<script lang="ts">
	import { onMount } from 'svelte';
	import CRDMap from '$lib/components/map/CRDMap.svelte';
	import { fetchDevelopments } from '$lib/api/development';
	import { fetchConstruction } from '$lib/api/construction';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { MapFeature, DevelopmentApplication, ConstructionEvent } from '$lib/types/index';

	let features = $state<MapFeature[]>([]);

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
			color: app.flagged ? '#fc8181' : '#63b3ed',
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
					? '#e53e3e'
					: evt.severity === 'MODERATE'
						? '#f6ad55'
						: '#68d391',
			icon: evt.eventType === 'INCIDENT' ? 'alert' : 'construction'
		};
	}

	async function loadFeatures() {
		const slug = municipalityStore.slug;
		const [devResult, conResult] = await Promise.all([
			fetchDevelopments({ municipality: slug }),
			fetchConstruction({ municipality: slug })
		]);

		const devFeatures = (devResult.data || [])
			.map(devToFeature)
			.filter((f): f is MapFeature => f !== null);

		const conFeatures = (conResult.data || [])
			.map(constructionToFeature)
			.filter((f): f is MapFeature => f !== null);

		features = [...devFeatures, ...conFeatures];
	}

	onMount(() => {
		loadFeatures();
	});

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadFeatures();
	});
</script>

<CRDMap {features} />
