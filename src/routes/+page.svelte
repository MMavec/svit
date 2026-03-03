<script lang="ts">
	import DashboardGrid from '$lib/components/layout/DashboardGrid.svelte';
</script>

<svelte:head>
	<title>SVIT — South Vancouver Island Tracker</title>
</svelte:head>

<main class="dashboard-page">
	<DashboardGrid />
</main>

<style>
	.dashboard-page {
		padding: 12px 0;
	}
</style>
