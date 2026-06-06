<script lang="ts">
	import { fetchEvChargers } from '$lib/api/ev-charging';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { EvCharger } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let chargers = $state<EvCharger[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let freeCount = $state(0);
	let freeOnly = $state(false);

	async function load() {
		loading = true;
		error = null;
		const result = await fetchEvChargers({ municipality: municipalityStore.slug });
		if (result.error) {
			error = result.error;
		} else {
			chargers = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			freeCount = (meta?.freeCount as number) || 0;
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		load();
	});

	const displayed = $derived(freeOnly ? chargers.filter((c) => c.free) : chargers);

	function focusOnMap(c: EvCharger) {
		if (!c.coordinates) return;
		mapFocusStore.focus({
			coordinates: c.coordinates,
			title: c.name,
			description: c.free ? 'Free charging' : c.rate || 'EV charging',
			color: '#38a169',
			zoom: 16
		});
	}
</script>

<div class="ev">
	<div class="controls">
		<div class="summary">
			<strong>{chargers.length}</strong> stations
			{#if freeCount > 0}<span class="bit">· {freeCount} free</span>{/if}
		</div>
		<button
			class="toggle"
			class:active={freeOnly}
			aria-pressed={freeOnly}
			onclick={() => (freeOnly = !freeOnly)}
		>
			Free only
		</button>
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if note && !live}
			<div class="note warn" role="status">{note}</div>
		{/if}

		<div class="list">
			{#each displayed as c (c.id)}
				<div
					class="item"
					class:clickable={!!c.coordinates}
					role="button"
					tabindex="0"
					aria-label={c.coordinates ? `Show ${c.name} on map` : c.name}
					onclick={() => focusOnMap(c)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focusOnMap(c);
						}
					}}
				>
					<div class="item-head">
						<span class="plug" aria-hidden="true">⚡</span>
						<span class="name">{c.name}</span>
						<span class="price" class:free={c.free}>{c.free ? 'Free' : 'Paid'}</span>
					</div>
					<div class="meta">
						{#if c.network}<span class="bit net">{c.network}</span>{/if}
						{#if c.hours}<span class="bit">{c.hours}</span>{/if}
						{#if c.maxTime}<span class="bit">Max {c.maxTime}</span>{/if}
						{#if !c.free && c.rate}<span class="bit rate">{c.rate}</span>{/if}
					</div>
				</div>
			{:else}
				<div class="empty" role="status">
					{#if note && !live}{note}{:else if freeOnly}No free stations in this view.{:else}No EV
						charging stations found.{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.ev {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.summary {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.summary strong {
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.toggle {
		padding: 3px 10px;
		font-size: 0.6875rem;
		font-weight: 600;
		border: 1px solid var(--accent-secondary);
		border-radius: 6px;
		background: transparent;
		color: var(--accent-secondary);
		cursor: pointer;
	}

	.toggle.active {
		background: var(--accent-secondary);
		color: #fff;
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

	.item {
		position: relative;
		padding: 9px 2px 10px 15px;
		border-bottom: 1px solid var(--border-primary);
		text-align: left;
		--row-accent: var(--accent-secondary);
	}

	.item::before {
		content: '';
		position: absolute;
		left: 2px;
		top: 14px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--row-accent);
	}

	.item:last-child {
		border-bottom: none;
	}

	.item.clickable {
		cursor: pointer;
		transition: background 0.15s;
	}

	.item.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}

	.item:focus-visible {
		outline: 2px solid var(--accent-secondary);
		outline-offset: 1px;
	}

	.item-head {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.plug {
		font-size: 0.875rem;
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

	.price {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 1px 7px;
		border-radius: 10px;
		background: var(--bg-surface-active, var(--bg-surface-hover));
		color: var(--text-secondary);
	}

	.price.free {
		background: var(--accent-secondary);
		color: #fff;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 4px;
	}

	.bit {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.bit.net {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.bit.rate {
		font-style: italic;
	}

	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
