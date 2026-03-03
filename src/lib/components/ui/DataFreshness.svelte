<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		timestamp: Date | null;
	}

	let { timestamp }: Props = $props();

	let label = $state('');
	let timer: ReturnType<typeof setInterval>;

	function update() {
		if (!timestamp) {
			label = '';
			return;
		}
		const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
		if (seconds < 60) label = 'Just now';
		else if (seconds < 3600) label = `${Math.floor(seconds / 60)}m ago`;
		else label = `${Math.floor(seconds / 3600)}h ago`;
	}

	onMount(() => {
		update();
		timer = setInterval(update, 30_000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	// Re-compute when timestamp changes
	$effect(() => {
		const _ts = timestamp;
		update();
	});
</script>

{#if label}
	<span
		class="data-freshness"
		role="status"
		aria-label="Data updated {label}"
		title={timestamp?.toLocaleTimeString()}
	>
		{label}
	</span>
{/if}

<style>
	.data-freshness {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		opacity: 0.7;
		white-space: nowrap;
	}
</style>
