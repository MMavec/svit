<script lang="ts">
	import { fetchHeritage } from '$lib/api/heritage';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { HeritageSite } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let sites = $state<HeritageSite[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let protectedCount = $state(0);
	let protectedOnly = $state(false);
	let query = $state('');

	async function load() {
		loading = true;
		error = null;
		const result = await fetchHeritage({ municipality: municipalityStore.slug });
		if (result.error) error = result.error;
		else {
			sites = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			protectedCount = (meta?.protectedCount as number) || 0;
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		protectedOnly = false;
		query = '';
		load();
	});

	const displayed = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return sites.filter((s) => {
			if (protectedOnly && !s.isProtected) return false;
			if (q && !`${s.name} ${s.address ?? ''}`.toLowerCase().includes(q)) return false;
			return true;
		});
	});

	function focus(s: HeritageSite) {
		if (!s.coordinates) return;
		mapFocusStore.focus({
			coordinates: s.coordinates,
			title: s.name,
			description: s.address || 'Heritage site',
			color: '#805ad5',
			zoom: 17
		});
	}
</script>

<div class="tile">
	<div class="controls">
		<input
			class="search"
			type="search"
			placeholder="Search heritage sites…"
			bind:value={query}
			aria-label="Search heritage sites"
		/>
		<button
			class="toggle"
			class:active={protectedOnly}
			aria-pressed={protectedOnly}
			onclick={() => (protectedOnly = !protectedOnly)}
			title="Show only legally protected sites"
		>
			Protected{#if protectedCount > 0}<span class="count">{protectedCount}</span>{/if}
		</button>
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if note}<div class="note" class:warn={!live} role="note">{note}</div>{/if}
		<div class="list">
			{#each displayed as s (s.id)}
				<div
					class="item"
					class:clickable={!!s.coordinates}
					role="button"
					tabindex="0"
					aria-label={s.coordinates ? `Show ${s.name} on map` : s.name}
					onclick={() => focus(s)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focus(s);
						}
					}}
				>
					<div class="head">
						<span class="icon" aria-hidden="true">&#9733;</span>
						<span class="name">{s.name}</span>
						{#if s.isProtected}<span class="badge" title="Legally protected">Protected</span>{/if}
					</div>
					{#if s.address}<div class="addr">{s.address}</div>{/if}
				</div>
			{:else}
				<div class="empty" role="status">{note || 'No heritage sites found.'}</div>
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
	.controls {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.search {
		flex: 1;
		min-width: 0;
		padding: 5px 10px;
		font-size: 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--bg-surface-hover);
		color: var(--text-primary);
	}
	.search:focus {
		outline: none;
		border-color: var(--palette-purple);
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		font-size: 0.6875rem;
		font-weight: 600;
		border: 1px solid var(--palette-purple);
		border-radius: 6px;
		background: transparent;
		color: var(--palette-purple);
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.toggle.active {
		background: var(--palette-purple);
		color: #fff;
	}
	.count {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0 5px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		color: var(--text-secondary);
	}
	.toggle.active .count {
		background: rgba(255, 255, 255, 0.25);
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
		--row-accent: var(--palette-purple);
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
	}
	.item.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}
	.item:focus-visible {
		outline: 2px solid var(--palette-purple);
		outline-offset: 1px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.icon {
		color: var(--palette-purple);
		font-size: 0.75rem;
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
	.badge {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 1px 6px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--palette-purple) 18%, transparent);
		color: var(--palette-purple);
	}
	.addr {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		margin-top: 2px;
		margin-left: 18px;
	}
	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
