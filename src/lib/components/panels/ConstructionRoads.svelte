<script lang="ts">
	import { fetchConstruction } from '$lib/api/construction';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { ConstructionEvent } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let events = $state<ConstructionEvent[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeFilter = $state<'all' | 'CONSTRUCTION' | 'INCIDENT'>('all');

	async function loadEvents() {
		loading = true;
		error = null;
		const result = await fetchConstruction({
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
		loadEvents();
	});

	const filteredEvents = $derived(
		activeFilter === 'all' ? events : events.filter((e) => e.eventType === activeFilter)
	);

	function severityColor(severity: ConstructionEvent['severity']): string {
		switch (severity) {
			case 'MAJOR':
				return 'var(--accent-danger, #e53e3e)';
			case 'MODERATE':
				return 'var(--accent-warning, #f6ad55)';
			case 'MINOR':
				return 'var(--accent-secondary, #68d391)';
			default:
				return 'var(--text-tertiary)';
		}
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString('en-CA', {
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return '';
		}
	}

	function roadSummary(event: ConstructionEvent): string {
		if (!event.roads.length) return '';
		const road = event.roads[0];
		let summary = road.name;
		if (road.direction) summary += ` ${road.direction}B`;
		if (road.from && road.to) summary += ` (${road.from} to ${road.to})`;
		else if (road.from) summary += ` at ${road.from}`;
		return summary;
	}
</script>

<div class="construction">
	<div class="filter-tabs">
		<button
			class="tab"
			class:active={activeFilter === 'all'}
			onclick={() => (activeFilter = 'all')}
		>
			All ({events.length})
		</button>
		<button
			class="tab"
			class:active={activeFilter === 'CONSTRUCTION'}
			onclick={() => (activeFilter = 'CONSTRUCTION')}
		>
			Construction
		</button>
		<button
			class="tab"
			class:active={activeFilter === 'INCIDENT'}
			onclick={() => (activeFilter = 'INCIDENT')}
		>
			Incidents
		</button>
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadEvents} />
	{:else}
		<div class="event-list">
			{#each filteredEvents as event (event.id)}
				<div class="event-card">
					<div class="event-header">
						<span class="severity-badge" style="background: {severityColor(event.severity)}">
							{event.severity}
						</span>
						<span class="event-type">
							{event.eventType === 'INCIDENT' ? 'Incident' : 'Construction'}
						</span>
						<span class="event-date">{formatDate(event.updated)}</span>
					</div>
					{#if event.roads.length > 0}
						<div class="road-name">{roadSummary(event)}</div>
					{/if}
					<div class="event-desc">{event.description}</div>
					{#if event.schedule}
						<div class="schedule">
							{#if event.schedule.startDate}
								<span>{formatDate(event.schedule.startDate)}</span>
							{/if}
							{#if event.schedule.startDate && event.schedule.endDate}
								<span class="schedule-sep">—</span>
							{/if}
							{#if event.schedule.endDate}
								<span>{formatDate(event.schedule.endDate)}</span>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="empty">No active construction or road closures reported</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.construction {
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

	.severity-badge {
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 3px;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.event-type {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.event-date {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		margin-left: auto;
	}

	.road-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent-primary);
		margin-bottom: 2px;
	}

	.event-desc {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.schedule {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 4px;
		font-size: 0.625rem;
		font-family: 'Geist Mono', monospace;
		color: var(--text-tertiary);
	}

	.schedule-sep {
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
