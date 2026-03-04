<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { urlState } from '$lib/stores/url-state.svelte';
	import StarrySky from '$lib/components/theme/StarrySky.svelte';
	import CloudySky from '$lib/components/theme/CloudySky.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';
	import SearchOverlay from '$lib/components/layout/SearchOverlay.svelte';
	import LeadCaptureBanner from '$lib/components/layout/LeadCaptureBanner.svelte';
	import LeadCaptureModal from '$lib/components/auth/LeadCaptureModal.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		theme.init();
		authStore.initialize();
		urlState.initialize();
	});
</script>

<div class="app-shell">
	<a href="#main-dashboard" class="skip-link">Skip to dashboard</a>

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
		<main id="main-dashboard">
			{@render children()}
		</main>
	</div>

	<!-- Auth modal -->
	<AuthModal />

	<!-- Search overlay -->
	<SearchOverlay />

	<!-- Lead capture -->
	<LeadCaptureBanner />
	<LeadCaptureModal />
</div>

<style>
	.skip-link {
		position: absolute;
		top: -100%;
		left: 16px;
		z-index: 300;
		padding: 8px 16px;
		background: var(--accent-primary);
		color: var(--text-inverse);
		border-radius: 0 0 8px 8px;
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
		transition: top 0.2s;
	}

	.skip-link:focus {
		top: 0;
	}

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
