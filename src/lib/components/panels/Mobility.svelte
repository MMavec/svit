<script lang="ts">
	import { fetchMobility } from '$lib/api/mobility';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { MobilityFeature } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { mobilityKindColor } from '$lib/utils/color-maps';

	type Kind = MobilityFeature['kind'];

	let features = $state<MobilityFeature[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let byKind = $state<Record<string, number>>({});
	let activeKind = $state<Kind | null>(null);

	const LABELS: Record<Kind, string> = {
		'bike-rack': 'Bike racks',
		'car-share': 'Car share',
		'pay-station': 'Pay stations'
	};

	async function load() {
		loading = true;
		error = null;
		const result = await fetchMobility({ municipality: municipalityStore.slug, limit: 200 });
		if (result.error) error = result.error;
		else {
			features = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			byKind = (meta?.byKind as Record<string, number>) || {};
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeKind = null;
		load();
	});

	const present = $derived((Object.keys(LABELS) as Kind[]).filter((k) => (byKind[k] ?? 0) > 0));
	const displayed = $derived(activeKind ? features.filter((f) => f.kind === activeKind) : features);

	function focus(f: MobilityFeature) {
		if (!f.coordinates) return;
		mapFocusStore.focus({
			coordinates: f.coordinates,
			title: f.label,
			description: LABELS[f.kind],
			color: '#38a169',
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
		{#if present.length > 0}
			<div class="chips" role="group" aria-label="Filter by type">
				{#each present as k (k)}
					<button
						class="chip"
						class:active={activeKind === k}
						style="--c: {mobilityKindColor(k)}"
						aria-pressed={activeKind === k}
						onclick={() => (activeKind = activeKind === k ? null : k)}
					>
						<span class="dot"></span>{LABELS[k]}<span class="count">{byKind[k]}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if note && !live}<div class="note warn" role="status">{note}</div>{/if}

		<div class="list">
			{#each displayed.slice(0, 120) as f (f.id)}
				<button
					class="row"
					class:clickable={!!f.coordinates}
					style="--c: {mobilityKindColor(f.kind)}"
					onclick={() => focus(f)}
					aria-label={f.coordinates ? `Show ${f.label} on map` : f.label}
				>
					<span class="bar"></span>
					<span class="label">{f.label}</span>
					{#if f.detail}<span class="detail">{f.detail}</span>{/if}
				</button>
			{:else}
				<div class="empty" role="status">{note || 'No mobility infrastructure found.'}</div>
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
		font-variant-numeric: tabular-nums;
	}
	.note {
		font-size: 0.6875rem;
		padding: 6px 8px;
		border-radius: 6px;
		color: var(--accent-warning);
		background: var(--bg-surface-hover);
		border-left: 2px solid var(--accent-warning);
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
		flex: 1;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border: none;
		border-radius: 6px;
		background: var(--bg-surface-hover);
		text-align: left;
		width: 100%;
	}
	.row.clickable {
		cursor: pointer;
	}
	.row.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}
	.row:focus-visible {
		outline: 2px solid var(--c);
		outline-offset: 1px;
	}
	.bar {
		width: 3px;
		height: 18px;
		border-radius: 2px;
		background: var(--c);
		flex-shrink: 0;
	}
	.label {
		font-size: 0.75rem;
		color: var(--text-primary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.detail {
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
