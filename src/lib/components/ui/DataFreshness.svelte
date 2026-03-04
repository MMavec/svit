<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		timestamp: Date | null;
		cached?: boolean;
		cachedAt?: string | null;
	}

	let { timestamp, cached = false, cachedAt = null }: Props = $props();

	let label = $state('');
	let freshness = $state<'fresh' | 'recent' | 'stale'>('fresh');
	let timer: ReturnType<typeof setInterval>;

	function update() {
		if (!timestamp) {
			label = '';
			return;
		}
		const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
		if (seconds < 60) {
			label = 'Just now';
			freshness = 'fresh';
		} else if (seconds < 120) {
			label = `${Math.floor(seconds / 60)}m ago`;
			freshness = 'fresh';
		} else if (seconds < 600) {
			label = `${Math.floor(seconds / 60)}m ago`;
			freshness = 'recent';
		} else if (seconds < 3600) {
			label = `${Math.floor(seconds / 60)}m ago`;
			freshness = 'stale';
		} else {
			label = `${Math.floor(seconds / 3600)}h ago`;
			freshness = 'stale';
		}
	}

	onMount(() => {
		update();
		timer = setInterval(update, 30_000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	$effect(() => {
		const _ts = timestamp;
		const _c = cached;
		update();
	});
</script>

{#if cached}
	<span
		class="data-freshness cached-badge"
		role="status"
		aria-label="Showing cached data"
		title={cachedAt ? `Cached at ${new Date(cachedAt).toLocaleTimeString()}` : 'Cached data'}
	>
		Cached
	</span>
{/if}
{#if label}
	<span
		class="data-freshness freshness-{freshness}"
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
		white-space: nowrap;
		transition: color 0.3s ease;
	}

	.freshness-fresh {
		color: var(--accent-secondary);
		opacity: 0.8;
	}

	.freshness-recent {
		color: var(--accent-warning);
		opacity: 0.85;
	}

	.freshness-stale {
		color: var(--accent-danger);
		opacity: 0.9;
	}

	.cached-badge {
		color: var(--accent-warning);
		font-weight: 600;
		padding: 1px 5px;
		border-radius: 4px;
		background: rgba(246, 173, 85, 0.15);
		letter-spacing: 0.3px;
		animation: fade-in 0.3s ease;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
