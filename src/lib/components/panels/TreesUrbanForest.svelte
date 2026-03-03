<script lang="ts">
	import { fetchTreeObservations } from '$lib/api/trees';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { TreeObservation } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';

	let trees = $state<TreeObservation[]>([]);
	let loading = $state(true);

	async function loadData() {
		loading = true;
		const result = await fetchTreeObservations({
			municipality: municipalityStore.slug
		});
		trees = result.data || [];
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	let heritageCount = $derived(trees.filter((t) => t.heritage).length);
</script>

<div class="trees">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if trees.length === 0}
		<div class="empty">No tree observations available</div>
	{:else}
		{#if heritageCount > 0}
			<div class="heritage-banner">
				<span class="heritage-count">{heritageCount}</span>
				<span class="heritage-text">heritage tree{heritageCount > 1 ? 's' : ''} observed</span>
			</div>
		{/if}
		<div class="tree-list">
			{#each trees as tree (tree.id)}
				<div class="tree-card" class:heritage={tree.heritage}>
					<div class="tree-header">
						{#if tree.heritage}
							<span class="heritage-badge">H</span>
						{/if}
						<span class="tree-name">{tree.commonName}</span>
						<span class="tree-time">{timeAgo(tree.observedAt)}</span>
					</div>
					<div class="tree-species">{tree.species}</div>
					{#if tree.location}
						<div class="tree-location">{tree.location}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.trees {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 6px;
	}

	.heritage-banner {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: rgba(104, 211, 145, 0.1);
		border-radius: 6px;
		border-left: 3px solid #68d391;
	}

	.heritage-count {
		font-size: 1rem;
		font-weight: 700;
		color: #68d391;
		font-family: 'Geist Mono', monospace;
	}

	.heritage-text {
		font-size: 0.6875rem;
		color: var(--text-secondary);
	}

	.tree-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.tree-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.tree-card:hover {
		background: var(--bg-surface-elevated);
	}

	.tree-card.heritage {
		border-left: 3px solid #68d391;
		padding-left: 7px;
	}

	.tree-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 2px;
	}

	.heritage-badge {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		background: #68d391;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.tree-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.tree-time {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		margin-left: auto;
	}

	.tree-species {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.tree-location {
		font-size: 0.625rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
