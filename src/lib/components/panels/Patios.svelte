<script lang="ts">
	import { fetchPatios } from '$lib/api/patios';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { PatioArea } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let patios = $state<PatioArea[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let byType = $state<Record<string, number>>({});
	let activeType = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		const result = await fetchPatios({ municipality: municipalityStore.slug, limit: 200 });
		if (result.error) error = result.error;
		else {
			patios = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			byType = (meta?.byType as Record<string, number>) || {};
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeType = null;
		load();
	});

	const types = $derived(
		Object.keys(byType)
			.filter((t) => byType[t] > 0)
			.sort((a, b) => byType[b] - byType[a])
	);
	const displayed = $derived(
		activeType ? patios.filter((p) => p.patioType === activeType) : patios
	);

	function focus(p: PatioArea) {
		if (!p.coordinates) return;
		mapFocusStore.focus({
			coordinates: p.coordinates,
			title: p.patioType,
			description: p.note ? `Patio area · ${p.note}` : 'Outdoor patio area',
			color: '#dd6b20',
			zoom: 17
		});
	}
</script>

<div class="tile">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if types.length > 0}
			<div class="chips" role="group" aria-label="Filter by patio type">
				{#each types as t (t)}
					<button
						class="chip"
						class:active={activeType === t}
						aria-pressed={activeType === t}
						onclick={() => (activeType = activeType === t ? null : t)}
					>
						{t}<span class="count">{byType[t]}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if note}<div class="note" class:warn={!live} role="note">{note}</div>{/if}

		<div class="list">
			{#each displayed.slice(0, 150) as p (p.id)}
				<button
					class="row"
					class:clickable={!!p.coordinates}
					onclick={() => focus(p)}
					aria-label={p.coordinates ? `Show ${p.patioType} on map` : p.patioType}
				>
					<span class="bar"></span>
					<span class="label">{p.patioType}</span>
					{#if p.note}<span class="note-bit">{p.note}</span>{/if}
				</button>
			{:else}
				<div class="empty" role="status">{note || 'No patio areas found.'}</div>
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
		border-color: var(--accent-warning);
		color: var(--text-primary);
	}
	.chip.active {
		border-color: var(--accent-warning);
		background: color-mix(in srgb, var(--accent-warning) 16%, transparent);
		color: var(--text-primary);
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
		overflow-y: auto;
		flex: 1;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 2px;
		border: none;
		border-bottom: 1px solid var(--border-primary);
		background: transparent;
		text-align: left;
		width: 100%;
	}
	.row:last-child {
		border-bottom: none;
	}
	.row.clickable {
		cursor: pointer;
	}
	.row.clickable:hover {
		background: var(--bg-surface-hover);
	}
	.row:focus-visible {
		outline: 2px solid var(--accent-warning);
		outline-offset: 1px;
	}
	.bar {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent-warning);
		flex-shrink: 0;
		margin-left: 2px;
	}
	.label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
		flex: 1;
	}
	.note-bit {
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}
	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
