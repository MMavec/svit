<script lang="ts">
	import { fetchPowerOutages } from '$lib/api/power-outages';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { PowerOutage } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let outages = $state<PowerOutage[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let note = $state<string | null>(null);
	let customersOut = $state(0);

	async function load() {
		loading = true;
		error = null;
		const result = await fetchPowerOutages();
		if (result.error) error = result.error;
		else {
			outages = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			note = (meta?.note as string) || null;
			customersOut = (meta?.customersOut as number) || 0;
		}
		loading = false;
	}

	// Power outages are region-wide (not per-municipality), but re-read the slug so the panel
	// refreshes alongside the rest of the dashboard.
	$effect(() => {
		const _slug = municipalityStore.slug;
		load();
	});

	function timeAgo(iso?: string): string {
		if (!iso) return '';
		const then = new Date(iso).getTime();
		if (isNaN(then)) return '';
		const mins = Math.round((Date.now() - then) / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.round(mins / 60);
		return `${hrs}h ago`;
	}

	function etaText(iso?: string): string {
		if (!iso) return '';
		const t = new Date(iso);
		if (isNaN(t.getTime())) return '';
		return t.toLocaleString('en-CA', {
			hour: 'numeric',
			minute: '2-digit',
			month: 'short',
			day: 'numeric'
		});
	}

	function focus(o: PowerOutage) {
		if (!o.coordinates) return;
		mapFocusStore.focus({
			coordinates: o.coordinates,
			title: `${o.municipality}: ${o.area}`,
			description: `${o.customersAffected} customers · ${o.cause}`,
			color: '#e53e3e',
			zoom: 14
		});
	}
</script>

<div class="tile">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else if outages.length === 0}
		<div class="all-clear" role="status">
			<span class="check" aria-hidden="true">&#10003;</span>
			<div class="clear-text">{note || 'No active power outages in Greater Victoria.'}</div>
		</div>
	{:else}
		<div class="headline">
			<span class="big">{outages.length}</span>
			<span class="big-label">outage{outages.length === 1 ? '' : 's'}</span>
			<span class="cust">{customersOut.toLocaleString()} customers affected</span>
		</div>
		<div class="list">
			{#each outages as o (o.id)}
				<div
					class="item"
					class:clickable={!!o.coordinates}
					role="button"
					tabindex="0"
					aria-label={o.coordinates ? `Show outage in ${o.municipality} on map` : o.area}
					onclick={() => focus(o)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focus(o);
						}
					}}
				>
					<div class="head">
						<span class="bar"></span>
						<span class="muni">{o.municipality}</span>
						<span class="count">{o.customersAffected.toLocaleString()}</span>
					</div>
					<div class="area">{o.area}</div>
					<div class="meta">
						<span class="cause">{o.cause}</span>
						{#if o.crewStatus}<span class="bit">· {o.crewStatus}</span>{/if}
						{#if o.eta}<span class="bit eta">ETA {etaText(o.eta)}</span>{/if}
						{#if o.lastUpdated}<span class="bit upd">{timeAgo(o.lastUpdated)}</span>{/if}
					</div>
				</div>
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
	.all-clear {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex: 1;
		text-align: center;
		padding: 16px;
	}
	.check {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent-secondary) 18%, transparent);
		color: var(--accent-secondary);
		font-size: 1.25rem;
		font-weight: 800;
	}
	.clear-text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.4;
		max-width: 240px;
	}
	.headline {
		display: flex;
		align-items: baseline;
		gap: 6px;
		flex-wrap: wrap;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}
	.big {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--status-critical);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.big-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	.cust {
		margin-left: auto;
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}
	.list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		flex: 1;
	}
	.item {
		padding: 9px 2px 10px;
		border-bottom: 1px solid var(--border-primary);
		text-align: left;
	}
	.item:last-child {
		border-bottom: none;
	}
	.item.clickable {
		cursor: pointer;
	}
	.item.clickable:hover {
		background: var(--bg-surface-hover);
	}
	.item:focus-visible {
		outline: 2px solid var(--status-critical);
		outline-offset: 1px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 2px;
	}
	.bar {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--status-critical);
		flex-shrink: 0;
	}
	.muni {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
	}
	.count {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--status-critical);
		font-variant-numeric: tabular-nums;
	}
	.area {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 3px;
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 5px;
	}
	.cause {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}
	.bit {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}
	.bit.eta {
		color: var(--accent-warning);
	}
	.bit.upd {
		margin-left: auto;
		font-family: var(--font-mono, monospace);
	}
</style>
