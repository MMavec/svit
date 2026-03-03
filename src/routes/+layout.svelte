<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import StarrySky from '$lib/components/theme/StarrySky.svelte';
	import CloudySky from '$lib/components/theme/CloudySky.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		theme.init();
		authStore.initialize();
	});
</script>

<div class="app-shell">
	<!-- Animated background -->
	{#if theme.value === 'dark'}
		<div class="bg-gradient dark"></div>
		<StarrySky />
	{:else}
		<div class="bg-gradient light"></div>
		<CloudySky />
	{/if}

	<!-- App content -->
	<div class="app-content">
		<Header />
		{@render children()}
	</div>

	<!-- Auth modal -->
	<AuthModal />
</div>

<style>
	.app-shell {
		min-height: 100vh;
		position: relative;
	}

	.bg-gradient {
		position: fixed;
		inset: 0;
		z-index: 0;
		transition: opacity 0.8s ease;
	}

	.bg-gradient.dark {
		background: var(--bg-gradient);
	}

	.bg-gradient.light {
		background: var(--bg-gradient);
	}

	.app-content {
		position: relative;
		z-index: 1;
		min-height: 100vh;
	}
</style>
