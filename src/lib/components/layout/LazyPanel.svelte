<script lang="ts">
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import type { Component } from 'svelte';

	interface Props {
		loader: () => Promise<{ default: Component }>;
	}

	let { loader }: Props = $props();

	let LoadedComponent = $state<Component | null>(null);
	let loadError = $state(false);

	$effect(() => {
		const _loader = loader;
		LoadedComponent = null;
		loadError = false;
		loader()
			.then((mod) => {
				LoadedComponent = mod.default;
			})
			.catch(() => {
				loadError = true;
			});
	});
</script>

{#if loadError}
	<div class="lazy-error">Failed to load panel</div>
{:else if LoadedComponent}
	<LoadedComponent />
{:else}
	<PanelSkeleton variant="list" />
{/if}

<style>
	.lazy-error {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
