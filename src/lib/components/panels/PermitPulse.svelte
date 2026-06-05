<script lang="ts">
	import { fetchPermits } from '$lib/api/permits';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { BuildingPermit } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { permitActivityColor } from '$lib/utils/color-maps';

	type Activity = BuildingPermit['activity'];

	let permits = $state<BuildingPermit[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let totalValue = $state(0);
	let byActivity = $state<Record<string, { count: number; value: number }>>({});
	let activeActivity = $state<Activity | null>(null);

	const ACTIVITY_LABELS: Record<Activity, string> = {
		'new-construction': 'New / major build',
		renovation: 'Renovation',
		demolition: 'Demolition',
		electrical: 'Electrical',
		plumbing: 'Plumbing',
		sign: 'Sign',
		other: 'Other'
	};

	async function load() {
		loading = true;
		error = null;
		const result = await fetchPermits({ municipality: municipalityStore.slug });
		if (result.error) {
			error = result.error;
		} else {
			permits = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			totalValue = (meta?.totalValue as number) || 0;
			byActivity = (meta?.byActivity as Record<string, { count: number; value: number }>) || {};
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeActivity = null;
		load();
	});

	const activityRows = $derived(
		Object.entries(byActivity)
			.map(([key, v]) => ({ key: key as Activity, ...v }))
			.sort((a, b) => b.value - a.value || b.count - a.count)
	);

	const maxActivityValue = $derived(Math.max(1, ...activityRows.map((r) => r.value)));

	const displayed = $derived(
		activeActivity ? permits.filter((p) => p.activity === activeActivity) : permits
	);

	function toggleActivity(a: Activity) {
		activeActivity = activeActivity === a ? null : a;
	}

	function focusOnMap(p: BuildingPermit) {
		if (!p.coordinates) return;
		mapFocusStore.focus({
			coordinates: p.coordinates,
			title: p.address,
			description: p.purpose,
			color: '#3182ce',
			zoom: 16
		});
	}

	const moneyFmt = new Intl.NumberFormat('en-CA', {
		style: 'currency',
		currency: 'CAD',
		maximumFractionDigits: 0,
		notation: 'compact'
	});
	const moneyFull = new Intl.NumberFormat('en-CA', {
		style: 'currency',
		currency: 'CAD',
		maximumFractionDigits: 0
	});

	function formatDate(iso?: string): string {
		if (!iso) return '';
		const d = new Date(`${iso}T00:00:00`);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
	}
</script>

<div class="pulse">
	{#if loading}
		<PanelSkeleton variant="card" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if permits.length > 0}
			<div class="headline">
				<div class="metric">
					<span class="metric-num">{permits.length}</span>
					<span class="metric-label">permits · 60 days</span>
				</div>
				<div class="metric">
					<span class="metric-num">{moneyFmt.format(totalValue)}</span>
					<span class="metric-label">declared value</span>
				</div>
			</div>

			{#if activityRows.length > 0}
				<div class="activity-bars">
					{#each activityRows as row (row.key)}
						<button
							class="bar-row"
							class:active={activeActivity === row.key}
							onclick={() => toggleActivity(row.key)}
							aria-pressed={activeActivity === row.key}
						>
							<span class="bar-label">{ACTIVITY_LABELS[row.key]}</span>
							<span class="bar-track">
								<span
									class="bar-fill"
									style="width: {(row.value / maxActivityValue) *
										100}%; background: {permitActivityColor(row.key)}"
								></span>
							</span>
							<span class="bar-count">{row.count}</span>
							<span class="bar-value">{moneyFmt.format(row.value)}</span>
						</button>
					{/each}
				</div>
			{/if}
		{/if}

		{#if !live && note}
			<div class="note warn" role="status">{note}</div>
		{:else if note && permits.length > 0}
			<div class="note" role="note">{note}</div>
		{/if}

		<div class="list">
			{#each displayed.slice(0, 40) as p (p.id)}
				<div
					class="item"
					class:clickable={!!p.coordinates}
					style="--c: {permitActivityColor(p.activity)}"
					role="button"
					tabindex="0"
					aria-label={p.coordinates ? `Show ${p.address} on map` : p.address}
					onclick={() => focusOnMap(p)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focusOnMap(p);
						}
					}}
				>
					<div class="item-head">
						<span class="dot"></span>
						<span class="addr">{p.address}</span>
						{#if p.value}<span class="val">{moneyFull.format(p.value)}</span>{/if}
					</div>
					<div class="purpose">{p.purpose}</div>
					<div class="meta">
						<span
							class="pill"
							style="color: {permitActivityColor(p.activity)}; border-color: {permitActivityColor(
								p.activity
							)}"
						>
							{ACTIVITY_LABELS[p.activity]}
						</span>
						{#if p.neighbourhood}<span class="bit">{p.neighbourhood}</span>{/if}
						{#if p.issuedDate}<span class="bit date">{formatDate(p.issuedDate)}</span>{/if}
					</div>
				</div>
			{:else}
				<div class="empty" role="status">
					{#if note}{note}{:else}No recent building permits in this area.{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.pulse {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.headline {
		display: flex;
		gap: 16px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.metric {
		display: flex;
		flex-direction: column;
	}

	.metric-num {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}

	.metric-label {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.activity-bars {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 88px 1fr 28px 52px;
		align-items: center;
		gap: 6px;
		padding: 2px 4px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;
	}

	.bar-row:hover {
		background: var(--bg-surface-hover);
	}

	.bar-row.active {
		border-color: var(--c, var(--border-primary));
		background: var(--bg-surface-hover);
	}

	.bar-label {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-track {
		height: 8px;
		background: var(--bg-surface-hover);
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		display: block;
		height: 100%;
		border-radius: 4px;
		min-width: 2px;
	}

	.bar-count {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.bar-value {
		font-size: 0.625rem;
		color: var(--text-secondary);
		text-align: right;
		font-variant-numeric: tabular-nums;
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
		transition: background 0.15s;
	}

	.item.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}

	.item:focus-visible {
		outline: 2px solid var(--c);
		outline-offset: 1px;
	}

	.item-head {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--c);
		flex-shrink: 0;
	}

	.addr {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.val {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.purpose {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.3;
		margin-bottom: 5px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
	}

	.pill {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 1px 7px;
		border: 1px solid;
		border-radius: 10px;
	}

	.bit {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.bit.date {
		margin-left: auto;
		font-family: var(--font-mono, monospace);
	}

	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
