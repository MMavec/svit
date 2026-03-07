<script lang="ts">
	import { fetchCommunityPosts } from '$lib/api/community-board';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { CommunityPost } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let posts = $state<CommunityPost[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeFilter = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchCommunityPosts({
			municipality: municipalityStore.slug,
			category: activeFilter || undefined
		});
		if (result.error) {
			error = result.error;
		} else {
			posts = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		const _filter = activeFilter;
		loadData();
	});

	const filters = [
		{ label: 'All', value: null },
		{ label: 'For Sale', value: 'for-sale' },
		{ label: 'Free', value: 'free' },
		{ label: 'Wanted', value: 'wanted' },
		{ label: 'Services', value: 'services' }
	];

	function categoryBadge(cat: CommunityPost['category']): { label: string; color: string } {
		switch (cat) {
			case 'for-sale':
				return { label: 'FOR SALE', color: '#457b9d' };
			case 'free':
				return { label: 'FREE', color: '#2d6a4f' };
			case 'wanted':
				return { label: 'WANTED', color: '#e07a5f' };
			case 'services':
				return { label: 'SERVICE', color: '#5e548e' };
			case 'housing':
				return { label: 'HOUSING', color: '#bc4749' };
			case 'events':
				return { label: 'EVENT', color: '#c77f32' };
			default:
				return { label: 'OTHER', color: '#6c757d' };
		}
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours < 1) return 'Just now';
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days === 1) return 'Yesterday';
		return `${days}d ago`;
	}

	function sourceLabel(source: string): string {
		switch (source) {
			case 'craigslist':
				return 'Craigslist';
			case 'usedvictoria':
				return 'UsedVictoria';
			case 'seed':
				return 'Community';
			default:
				return source;
		}
	}
</script>

<div class="board">
	<div class="filters">
		{#each filters as filter}
			<button
				class="filter-btn"
				class:active={activeFilter === filter.value}
				onclick={() => {
					activeFilter = filter.value;
				}}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if posts.length === 0}
		<div class="empty" role="status">No posts right now</div>
	{:else}
		<div class="post-list">
			{#each posts as post (post.id)}
				{@const badge = categoryBadge(post.category)}
				<div class="post-card">
					<div class="post-header">
						<span class="cat-badge" style="background: {badge.color}">{badge.label}</span>
						<span class="post-time">{timeAgo(post.postedAt)}</span>
						{#if post.municipality}
							<span class="post-muni">{post.municipality}</span>
						{/if}
					</div>
					<div class="post-title">{post.title}</div>
					{#if post.description}
						<div class="post-desc">{post.description}</div>
					{/if}
					<div class="post-footer">
						<span class="post-source">via {sourceLabel(post.source)}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 6px;
	}

	.filters {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 3px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-subtle);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.625rem;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}

	.filter-btn:hover {
		background: var(--bg-surface-hover);
	}

	.filter-btn.active {
		background: var(--accent-primary);
		color: #fff;
		border-color: var(--accent-primary);
	}

	.post-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.post-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.post-card:hover {
		background: var(--bg-surface-elevated);
	}

	.post-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.cat-badge {
		font-size: 0.5rem;
		font-weight: 700;
		color: #fff;
		padding: 1px 5px;
		border-radius: 3px;
		letter-spacing: 0.05em;
	}

	.post-time {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		font-family: 'Geist Mono', monospace;
	}

	.post-muni {
		font-size: 0.5rem;
		color: var(--text-tertiary);
		margin-left: auto;
		text-transform: capitalize;
	}

	.post-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.post-desc {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-top: 2px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.post-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 4px;
	}

	.post-source {
		font-size: 0.5rem;
		color: var(--text-tertiary);
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
