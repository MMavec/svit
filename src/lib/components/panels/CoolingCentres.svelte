<script lang="ts">
	import { fetchCooling } from '$lib/api/cooling';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { CoolingResource } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { coolingCategoryColor } from '$lib/utils/color-maps';

	type Cat = CoolingResource['category'];

	let resources = $state<CoolingResource[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let byCategory = $state<Record<string, number>>({});
	let activeCat = $state<Cat | null>(null);

	const LABELS: Record<Cat, string> = { indoor: 'Cooling centres', water: 'Water', other: 'Other' };

	async function load() {
		loading = true;
		error = null;
		const result = await fetchCooling({ municipality: municipalityStore.slug });
		if (result.error) error = result.error;
		else {
			resources = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			byCategory = (meta?.byCategory as Record<string, number>) || {};
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeCat = null;
		load();
	});

	const present = $derived((Object.keys(LABELS) as Cat[]).filter((c) => (byCategory[c] ?? 0) > 0));
	const displayed = $derived(
		activeCat ? resources.filter((r) => r.category === activeCat) : resources
	);

	function focus(r: CoolingResource) {
		if (!r.coordinates) return;
		mapFocusStore.focus({
			coordinates: r.coordinates,
			title: r.name,
			description: r.location || r.resourceType,
			color: '#00b5d8',
			zoom: 16
		});
	}
</script>

<div class="tile">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if present.length > 0}
			<div class="chips" role="group" aria-label="Filter by type">
				{#each present as c (c)}
					<button
						class="chip"
						class:active={activeCat === c}
						style="--c: {coolingCategoryColor(c)}"
						aria-pressed={activeCat === c}
						onclick={() => (activeCat = activeCat === c ? null : c)}
					>
						<span class="dot"></span>{LABELS[c]}<span class="count">{byCategory[c]}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if note}<div class="note" class:warn={!live} role="note">{note}</div>{/if}

		<div class="list">
			{#each displayed as r (r.id)}
				<div
					class="item"
					class:clickable={!!r.coordinates}
					style="--c: {coolingCategoryColor(r.category)}"
					role="button"
					tabindex="0"
					aria-label={r.coordinates ? `Show ${r.name} on map` : r.name}
					onclick={() => focus(r)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focus(r);
						}
					}}
				>
					<div class="head">
						<span class="bar"></span>
						<span class="name">{r.name}</span>
						<span class="type">{r.resourceType}</span>
					</div>
					<div class="meta">
						{#if r.location}<span class="bit">{r.location}</span>{/if}
						{#if r.hours}<span class="bit">{r.hours}</span>{/if}
						{#if r.hoursUrl}<a
								class="link"
								href={r.hoursUrl}
								target="_blank"
								rel="noopener noreferrer"
								onclick={(e) => e.stopPropagation()}>Hours ↗</a
							>{/if}
					</div>
				</div>
			{:else}
				<div class="empty" role="status">{note || 'No cooling resources found.'}</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 8px;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.chip:hover {
		border-color: var(--c);
		color: var(--text-primary);
	}
	.chip.active {
		border-color: var(--c);
		background: color-mix(in srgb, var(--c) 16%, transparent);
		color: var(--text-primary);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c);
	}
	.count {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--text-tertiary);
	}
	.note {
		font-size: 0.6875rem;
		line-height: 1.4;
		padding: 6px 8px;
		border-radius: 6px;
		color: var(--text-tertiary);
		background: var(--bg-surface-hover);
		border-left: 2px solid var(--border-primary);
	}
	.note.warn {
		color: var(--accent-warning);
		border-left-color: var(--accent-warning);
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}
	.item {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border-left: 3px solid var(--c);
		text-align: left;
	}
	.item.clickable {
		cursor: pointer;
	}
	.item.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}
	.item:focus-visible {
		outline: 2px solid var(--c);
		outline-offset: 1px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
	}
	.bar {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c);
		flex-shrink: 0;
	}
	.name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.type {
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
	}
	.bit {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}
	.link {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--accent-secondary);
		text-decoration: none;
	}
	.link:hover {
		text-decoration: underline;
	}
	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
