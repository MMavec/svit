<script lang="ts">
	import DashboardGrid from '$lib/components/layout/DashboardGrid.svelte';
	import HeroMap from '$lib/components/map/HeroMap.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';

	const pageTitle = $derived(
		municipalityStore.isAllCRD
			? 'SVIT — South Vancouver Island Tracker'
			: `${municipalityStore.label} — SVIT`
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="dashboard-page">
	<div class="hero-section">
		<HeroMap />
	</div>
	<DashboardGrid />
</main>

<style>
	.dashboard-page {
		padding: 12px 0;
	}

	.hero-section {
		padding: 0 12px 12px;
	}
</style>
