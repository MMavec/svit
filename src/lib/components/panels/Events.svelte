<script lang="ts">
	import { fetchEvents } from '$lib/api/events';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { CommunityEvent } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import { isValidHttpUrl } from '$lib/utils/sanitize';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import BookmarkButton from '$lib/components/ui/BookmarkButton.svelte';
	import { eventCategoryColor } from '$lib/utils/color-maps';

	let events = $state<CommunityEvent[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchEvents({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			events = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function categoryIcon(cat: CommunityEvent['category']): string {
		switch (cat) {
			case 'arts':
				return 'A';
			case 'sports':
				return 'S';
			case 'community':
				return 'C';
			case 'market':
				return 'M';
			case 'festival':
				return 'F';
			case 'education':
				return 'E';
			case 'government':
				return 'G';
			default:
				return 'O';
		}
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
	}

	function daysUntil(iso: string): string {
		const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return 'Past';
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		return `In ${diff}d`;
	}
</script>

<div class="events">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if events.length === 0}
		<div class="empty" role="status">No upcoming events</div>
	{:else}
		<div class="event-list">
			{#each events as event (event.id)}
				<div class="event-card">
					<div class="event-header">
						<span class="cat-badge" style="background: {eventCategoryColor(event.category)}">
							{categoryIcon(event.category)}
						</span>
						<span class="event-date">{formatDate(event.date)}</span>
						<span class="days-until">{daysUntil(event.date)}</span>
						{#if event.free}
							<span class="free-badge">FREE</span>
						{/if}
						<BookmarkButton
							itemType="event"
							externalId={event.id}
							title={event.title}
							description={event.description}
							municipality={event.municipality}
							url={event.url}
						/>
					</div>
					<div class="event-title">
						{#if isValidHttpUrl(event.url)}
							<a href={event.url} target="_blank" rel="noopener noreferrer">{event.title}</a>
						{:else}
							{event.title}
						{/if}
					</div>
					{#if event.description}
						<div class="event-desc">{event.description}</div>
					{/if}
					<div class="event-footer">
						<span class="event-location">{event.location}</span>
						{#if event.time}
							<span class="event-time">{event.time}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.events {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.event-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.event-card:hover {
		background: var(--bg-surface-elevated);
	}

	.event-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.cat-badge {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5625rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.event-date {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		font-family: 'Geist Mono', monospace;
	}

	.days-until {
		font-size: 0.5625rem;
		color: var(--accent-primary);
		font-weight: 600;
	}

	.free-badge {
		font-size: 0.5rem;
		font-weight: 700;
		color: var(--accent-secondary);
		background: rgba(104, 211, 145, 0.15);
		padding: 1px 4px;
		border-radius: 3px;
		letter-spacing: 0.05em;
		margin-left: auto;
	}

	.event-title {
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

	.event-title a {
		color: inherit;
		text-decoration: none;
	}

	.event-title a:hover {
		color: var(--accent-primary);
	}

	.event-desc {
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

	.event-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 4px;
		font-size: 0.625rem;
	}

	.event-location {
		color: var(--text-tertiary);
	}

	.event-time {
		color: var(--text-tertiary);
		font-family: 'Geist Mono', monospace;
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
