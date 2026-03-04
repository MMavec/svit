<script lang="ts">
	import DashboardGrid from '$lib/components/layout/DashboardGrid.svelte';
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
	<DashboardGrid />
</main>

<style>
	.dashboard-page {
		padding: 12px 0;
	}
</style>
