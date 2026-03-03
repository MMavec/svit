<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchSocialPosts } from '$lib/api/social';
	import { fetchNews } from '$lib/api/news';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { SocialPost, NewsItem } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';

	type VoiceItem = { type: 'social'; data: SocialPost } | { type: 'news'; data: NewsItem };

	let items = $state<VoiceItem[]>([]);
	let loading = $state(true);
	let activeFilter = $state<'all' | 'social' | 'news'>('all');

	async function loadVoices() {
		loading = true;
		const slug = municipalityStore.slug;

		const [socialResult, newsResult] = await Promise.all([
			fetchSocialPosts({ municipality: slug, limit: 20 }),
			fetchNews({ municipality: slug, limit: 20 })
		]);

		const socialItems: VoiceItem[] = (socialResult.data || []).map((p) => ({
			type: 'social' as const,
			data: p
		}));
		const newsItems: VoiceItem[] = (newsResult.data || []).map((n) => ({
			type: 'news' as const,
			data: n
		}));

		// Merge and sort by date
		items = [...socialItems, ...newsItems].sort((a, b) => {
			const dateA = a.type === 'social' ? a.data.published : a.data.published;
			const dateB = b.type === 'social' ? b.data.published : b.data.published;
			return new Date(dateB).getTime() - new Date(dateA).getTime();
		});
		loading = false;
	}

	onMount(() => {
		loadVoices();
	});

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadVoices();
	});

	const filteredItems = $derived(
		activeFilter === 'all' ? items : items.filter((i) => i.type === activeFilter)
	);

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<div class="voices">
	<div class="filter-tabs">
		<button class="tab" class:active={activeFilter === 'all'} onclick={() => (activeFilter = 'all')}
			>All</button
		>
		<button
			class="tab"
			class:active={activeFilter === 'social'}
			onclick={() => (activeFilter = 'social')}>Social</button
		>
		<button
			class="tab"
			class:active={activeFilter === 'news'}
			onclick={() => (activeFilter = 'news')}>News</button
		>
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else}
		<div class="voice-list">
			{#each filteredItems.slice(0, 25) as item (item.type === 'social' ? item.data.id : item.data.id)}
				{#if item.type === 'social'}
					{@const post = item.data}
					<a href={post.url} target="_blank" rel="noopener" class="voice-item social-item">
						<div class="voice-header">
							{#if post.authorAvatar}
								<img src={post.authorAvatar} alt="" class="avatar" />
							{:else}
								<div class="avatar placeholder-avatar">
									{post.author.charAt(0)}
								</div>
							{/if}
							<div class="voice-author">
								<span class="author-name">{post.author}</span>
								<span class="author-handle">@{post.authorHandle}</span>
							</div>
							<span class="voice-time">{timeAgo(post.published)}</span>
						</div>
						<div class="voice-content">{post.content}</div>
						<div class="voice-stats">
							{#if post.likes}<span>{post.likes} likes</span>{/if}
							{#if post.reposts}<span>{post.reposts} reposts</span>{/if}
							{#if post.replies}<span>{post.replies} replies</span>{/if}
						</div>
					</a>
				{:else}
					{@const article = item.data}
					<a href={article.url} target="_blank" rel="noopener" class="voice-item news-item">
						<div class="voice-header">
							<span class="source-badge">{article.source}</span>
							<span class="voice-time">{timeAgo(article.published)}</span>
						</div>
						<div class="voice-title">{article.title}</div>
						{#if article.description}
							<div class="voice-content news-desc">{article.description}</div>
						{/if}
					</a>
				{/if}
			{:else}
				<div class="empty">No voices found</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.voices {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.filter-tabs {
		display: flex;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.tab {
		padding: 4px 12px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab.active {
		background: var(--accent-primary);
		color: var(--text-inverse);
		border-color: var(--accent-primary);
	}

	.voice-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.voice-item {
		display: block;
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.voice-item:hover {
		background: var(--bg-surface-elevated);
	}

	.voice-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
	}

	.placeholder-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent-primary);
		color: var(--text-inverse);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.voice-author {
		flex: 1;
		min-width: 0;
	}

	.author-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.author-handle {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		margin-left: 4px;
	}

	.voice-time {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.source-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 1px 6px;
		border-radius: 4px;
		background: var(--accent-primary);
		color: var(--text-inverse);
	}

	.voice-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.voice-content {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.news-desc {
		margin-top: 2px;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.voice-stats {
		display: flex;
		gap: 10px;
		margin-top: 4px;
		font-size: 0.625rem;
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
