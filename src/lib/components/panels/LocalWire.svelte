<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchNews } from '$lib/api/news';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { refreshStore, REFRESH_INTERVALS } from '$lib/stores/refresh.svelte';
	import { newsSources } from '$lib/config/news-sources';
	import type { NewsItem } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import BookmarkButton from '$lib/components/ui/BookmarkButton.svelte';

	let articles = $state<NewsItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeSource = $state<string | null>(null);
	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	async function loadNews() {
		loading = true;
		error = null;
		const result = await fetchNews({
			municipality: municipalityStore.slug,
			source: activeSource ?? undefined,
			limit: 50
		});
		if (result.error) {
			error = result.error;
		} else {
			articles = result.data || [];
		}
		loading = false;
	}

	function startRefreshTimer() {
		if (refreshTimer) clearInterval(refreshTimer);
		if (refreshStore.enabled) {
			refreshTimer = setInterval(loadNews, REFRESH_INTERVALS['local-wire']);
		}
	}

	onMount(() => {
		startRefreshTimer();
	});

	onDestroy(() => {
		if (refreshTimer) clearInterval(refreshTimer);
	});

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadNews();
	});

	$effect(() => {
		const _enabled = refreshStore.enabled;
		startRefreshTimer();
	});

	function selectSource(slug: string | null) {
		activeSource = slug;
		loadNews();
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	function sourceColor(slug: string): string {
		return newsSources.find((s) => s.slug === slug)?.color || 'var(--accent-primary)';
	}

	function sourceName(slug: string): string {
		return newsSources.find((s) => s.slug === slug)?.name || slug;
	}
</script>

<div class="local-wire">
	<div class="source-tabs">
		<button class="tab" class:active={activeSource === null} onclick={() => selectSource(null)}>
			All
		</button>
		{#each newsSources as src (src.slug)}
			<button
				class="tab"
				class:active={activeSource === src.slug}
				onclick={() => selectSource(src.slug)}
				style="--tab-color: {src.color}"
			>
				{src.name}
			</button>
		{/each}
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadNews} />
	{:else}
		<div class="article-list">
			{#each articles as article (article.id)}
				<a href={article.url} target="_blank" rel="noopener" class="article-card">
					{#if article.imageUrl}
						<div class="article-image">
							<img src={article.imageUrl} alt="" loading="lazy" />
						</div>
					{/if}
					<div class="article-body">
						<div class="article-meta">
							<span class="source-badge" style="background: {sourceColor(article.sourceSlug)}">
								{sourceName(article.sourceSlug)}
							</span>
							<span class="article-time">{timeAgo(article.published)}</span>
						</div>
						<h3 class="article-headline">{article.title}</h3>
						{#if article.description}
							<p class="article-excerpt">{article.description}</p>
						{/if}
					</div>
					<BookmarkButton
						itemType="news"
						externalId={article.id}
						title={article.title}
						description={article.description}
						municipality={article.municipality}
						url={article.url}
					/>
				</a>
			{:else}
				<div class="empty">No news articles found</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.local-wire {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.source-tabs {
		display: flex;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
		overflow-x: auto;
		flex-shrink: 0;
	}

	.source-tabs::-webkit-scrollbar {
		height: 2px;
	}

	.source-tabs::-webkit-scrollbar-thumb {
		background: var(--border-primary);
		border-radius: 2px;
	}

	.tab {
		padding: 4px 10px;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.tab.active {
		background: var(--tab-color, var(--accent-primary));
		color: #fff;
		border-color: var(--tab-color, var(--accent-primary));
	}

	.tab:hover:not(.active) {
		background: var(--bg-surface-hover);
	}

	.article-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.article-card {
		display: flex;
		gap: 10px;
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.article-card:hover {
		background: var(--bg-surface-elevated);
	}

	.article-image {
		flex-shrink: 0;
		width: 72px;
		height: 54px;
		border-radius: 6px;
		overflow: hidden;
	}

	.article-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.article-body {
		flex: 1;
		min-width: 0;
	}

	.article-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
	}

	.source-badge {
		font-size: 0.5625rem;
		font-weight: 600;
		padding: 1px 5px;
		border-radius: 3px;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.article-time {
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}

	.article-headline {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.article-excerpt {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin: 3px 0 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
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
