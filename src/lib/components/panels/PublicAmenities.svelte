<script lang="ts">
	import { fetchAmenities } from '$lib/api/amenities';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { PublicAmenity } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { amenityKindColor } from '$lib/utils/color-maps';

	type Kind = PublicAmenity['kind'];

	let amenities = $state<PublicAmenity[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let byKind = $state<Record<string, number>>({});
	let activeKind = $state<Kind | null>(null);

	const LABELS: Record<Kind, string> = { washroom: 'Washrooms', facility: 'Facilities' };

	async function load() {
		loading = true;
		error = null;
		const result = await fetchAmenities({ municipality: municipalityStore.slug });
		if (result.error) error = result.error;
		else {
			amenities = result.data || [];
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
	const displayed = $derived(
		activeKind ? amenities.filter((a) => a.kind === activeKind) : amenities
	);

	function focus(a: PublicAmenity) {
		if (!a.coordinates) return;
		mapFocusStore.focus({
			coordinates: a.coordinates,
			title: a.name,
			description: a.address || LABELS[a.kind],
			color: '#00b5d8',
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
						style="--c: {amenityKindColor(k)}"
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
			{#each displayed as a (a.id)}
				<div
					class="item"
					class:clickable={!!a.coordinates}
					style="--c: {amenityKindColor(a.kind)}"
					role="button"
					tabindex="0"
					aria-label={a.coordinates ? `Show ${a.name} on map` : a.name}
					onclick={() => focus(a)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focus(a);
						}
					}}
				>
					<div class="head">
						<span class="bar"></span>
						<span class="name">{a.name}</span>
						{#if a.category}<span class="cat">{a.category}</span>{/if}
					</div>
					<div class="meta">
						{#if a.address}<span class="bit">{a.address}</span>{/if}
						{#if a.hours}<span class="bit hours">{a.hours}</span>{/if}
					</div>
				</div>
			{:else}
				<div class="empty" role="status">{note || 'No public amenities found.'}</div>
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
		padding: 6px 8px;
		border-radius: 6px;
		color: var(--accent-warning);
		background: var(--bg-surface-hover);
		border-left: 2px solid var(--accent-warning);
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
	.cat {
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
	.bit.hours {
		color: var(--text-secondary);
	}
	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
