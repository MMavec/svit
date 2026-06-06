<script lang="ts">
	import { fetchPublicLand } from '$lib/api/public-land';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { PublicLandParcel } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let parcels = $state<PublicLandParcel[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let byClass = $state<Record<string, number>>({});
	let activeClass = $state<string | null>(null);
	let query = $state('');

	async function load() {
		loading = true;
		error = null;
		const result = await fetchPublicLand({ municipality: municipalityStore.slug, limit: 500 });
		if (result.error) error = result.error;
		else {
			parcels = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			byClass = (meta?.byClass as Record<string, number>) || {};
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeClass = null;
		query = '';
		load();
	});

	const classes = $derived(
		Object.keys(byClass)
			.filter((c) => byClass[c] > 0)
			.sort((a, b) => byClass[b] - byClass[a])
	);

	const displayed = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return parcels.filter((p) => {
			if (activeClass && p.inventoryClass !== activeClass) return false;
			if (
				q &&
				!`${p.legalDescription ?? ''} ${p.pid ?? ''} ${p.inventoryClass}`.toLowerCase().includes(q)
			)
				return false;
			return true;
		});
	});

	function focus(p: PublicLandParcel) {
		if (!p.coordinates) return;
		mapFocusStore.focus({
			coordinates: p.coordinates,
			title: `${p.ownerName} — ${p.inventoryClass}`,
			description: p.legalDescription || p.pid || 'City-owned parcel',
			color: '#2f855a',
			zoom: 17
		});
	}
</script>

<div class="tile">
	<input
		class="search"
		type="search"
		placeholder="Search city land (PID, legal, class)…"
		bind:value={query}
		aria-label="Search public land"
	/>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if classes.length > 0}
			<div class="chips" role="group" aria-label="Filter by inventory class">
				{#each classes.slice(0, 8) as c (c)}
					<button
						class="chip"
						class:active={activeClass === c}
						aria-pressed={activeClass === c}
						onclick={() => (activeClass = activeClass === c ? null : c)}
					>
						{c}<span class="count">{byClass[c]}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if note}<div class="note" class:warn={!live} role="note">{note}</div>{/if}

		<div class="list">
			{#each displayed.slice(0, 200) as p (p.id)}
				<div
					class="item"
					class:clickable={!!p.coordinates}
					role="button"
					tabindex="0"
					aria-label={p.coordinates ? `Show parcel on map` : p.inventoryClass}
					onclick={() => focus(p)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focus(p);
						}
					}}
				>
					<div class="head">
						<span class="bar"></span>
						<span class="class">{p.inventoryClass}</span>
						{#if p.pid}<span class="pid">{p.pid}</span>{/if}
					</div>
					{#if p.legalDescription}<div class="legal">{p.legalDescription}</div>{/if}
				</div>
			{:else}
				<div class="empty" role="status">{note || 'No city-owned parcels found.'}</div>
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
	.search {
		padding: 5px 10px;
		font-size: 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--bg-surface-hover);
		color: var(--text-primary);
	}
	.search:focus {
		outline: none;
		border-color: var(--palette-green);
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
		border-color: var(--palette-green);
		color: var(--text-primary);
	}
	.chip.active {
		border-color: var(--palette-green);
		background: color-mix(in srgb, var(--palette-green) 16%, transparent);
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
		gap: 4px;
		overflow-y: auto;
		flex: 1;
	}
	.item {
		padding: 7px 8px;
		border-radius: 6px;
		background: var(--bg-surface-hover);
		border-left: 3px solid var(--palette-green);
		text-align: left;
	}
	.item.clickable {
		cursor: pointer;
	}
	.item.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}
	.item:focus-visible {
		outline: 2px solid var(--palette-green);
		outline-offset: 1px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.bar {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--palette-green);
		flex-shrink: 0;
	}
	.class {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
	}
	.pid {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-family: var(--font-mono, monospace);
	}
	.legal {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		line-height: 1.3;
		margin-top: 2px;
		margin-left: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
