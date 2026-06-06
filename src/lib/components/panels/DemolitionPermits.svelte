<script lang="ts">
	import { fetchDemolitions } from '$lib/api/demolitions';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { DemolitionPermit } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import BookmarkButton from '$lib/components/ui/BookmarkButton.svelte';
	import { demolitionCategoryColor } from '$lib/utils/color-maps';

	type Category = DemolitionPermit['category'];

	let permits = $state<DemolitionPermit[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let totalValue = $state(0);
	let dateRange = $state<{ from: string; to: string } | null>(null);
	let activeCategory = $state<Category | null>(null);

	const CATEGORIES: { key: Category; label: string }[] = [
		{ key: 'single-family', label: 'House' },
		{ key: 'multi-unit', label: 'Multi-unit' },
		{ key: 'commercial', label: 'Commercial' },
		{ key: 'accessory', label: 'Accessory' },
		{ key: 'institutional', label: 'Institutional' },
		{ key: 'other', label: 'Other' }
	];

	async function loadDemolitions() {
		loading = true;
		error = null;
		const result = await fetchDemolitions({ municipality: municipalityStore.slug });
		if (result.error) {
			error = result.error;
		} else {
			permits = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			totalValue = (meta?.totalValue as number) || 0;
			dateRange = (meta?.dateRange as { from: string; to: string }) || null;
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeCategory = null;
		loadDemolitions();
	});

	const displayed = $derived(
		activeCategory ? permits.filter((p) => p.category === activeCategory) : permits
	);

	const categoryCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const p of permits) counts[p.category] = (counts[p.category] ?? 0) + 1;
		return counts;
	});

	function toggleCategory(cat: Category) {
		activeCategory = activeCategory === cat ? null : cat;
	}

	function focusOnMap(p: DemolitionPermit) {
		if (!p.coordinates) return;
		mapFocusStore.focus({
			coordinates: p.coordinates,
			title: p.address,
			description: p.structure,
			color: '#e53e3e',
			zoom: 16
		});
	}

	const moneyFmt = new Intl.NumberFormat('en-CA', {
		style: 'currency',
		currency: 'CAD',
		maximumFractionDigits: 0
	});
	const moneyShort = new Intl.NumberFormat('en-CA', {
		style: 'currency',
		currency: 'CAD',
		maximumFractionDigits: 1,
		notation: 'compact'
	});

	function formatValue(v?: number): string {
		return v ? moneyFmt.format(v) : '—';
	}

	function formatDate(iso?: string): string {
		if (!iso) return '';
		const d = new Date(`${iso}T00:00:00`);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="demo-watch">
	{#if loading}
		<PanelSkeleton variant="card" />
	{:else if error}
		<PanelError message={error} onRetry={loadDemolitions} />
	{:else}
		{#if permits.length > 0}
			<div class="demo-summary">
				<span class="summary-stat">
					<strong>{permits.length}</strong>
					demolition{permits.length === 1 ? '' : 's'}
				</span>
				<span class="summary-sep">·</span>
				<span class="summary-stat" title="Total declared value of demolition permits">
					<strong>{formatValue(totalValue)}</strong> declared
				</span>
				{#if dateRange}
					<span class="summary-sep">·</span>
					<span class="summary-stat range">
						{formatDate(dateRange.from)} – {formatDate(dateRange.to)}
					</span>
				{/if}
			</div>

			<div class="demo-controls" role="group" aria-label="Filter by structure type">
				{#each CATEGORIES as cat (cat.key)}
					{#if categoryCounts[cat.key]}
						<button
							class="cat-chip"
							class:active={activeCategory === cat.key}
							style="--chip-color: {demolitionCategoryColor(cat.key)}"
							aria-pressed={activeCategory === cat.key}
							onclick={() => toggleCategory(cat.key)}
						>
							<span class="chip-dot"></span>
							{cat.label}
							<span class="chip-count">{categoryCounts[cat.key]}</span>
						</button>
					{/if}
				{/each}
			</div>
		{/if}

		{#if !live && note}
			<div class="demo-note warn" role="status">{note}</div>
		{:else if note && permits.length > 0}
			<div class="demo-note" role="note">{note}</div>
		{/if}

		<div class="demo-list">
			{#each displayed as p (p.id)}
				<div
					class="demo-item"
					class:clickable={!!p.coordinates}
					style="--cat-color: {demolitionCategoryColor(p.category)}"
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
					<div class="demo-header">
						<span class="cat-badge" title={p.category}></span>
						<span class="demo-address">{p.address}</span>
						{#if p.heritage}
							<span class="heritage-badge" title="References heritage status">H</span>
						{/if}
						<BookmarkButton
							itemType="demolition"
							externalId={p.id}
							title={p.address}
							description={p.structure}
							municipality={p.municipality}
						/>
					</div>

					<div class="demo-desc">{p.structure}</div>

					<div class="demo-meta">
						<span
							class="cat-pill"
							style="color: {demolitionCategoryColor(
								p.category
							)}; border-color: {demolitionCategoryColor(p.category)}"
						>
							{p.category.replace('-', ' ')}
						</span>
						{#if p.neighbourhood}
							<span class="meta-bit">{p.neighbourhood}</span>
						{/if}
						{#if p.value}
							<span class="meta-bit value">{formatValue(p.value)}</span>
						{/if}
						{#if p.issuedDate}
							<span class="meta-bit date">{formatDate(p.issuedDate)}</span>
						{/if}
					</div>

					{#if p.assessedTotal}
						<div class="assessed" title="2026 BC Assessment, joined by parcel folio">
							<span class="assessed-label">Assessed</span>
							{#if p.assessedImprovement}<span
									>building {moneyShort.format(p.assessedImprovement)}</span
								>{/if}
							{#if p.assessedLand}<span>· land {moneyShort.format(p.assessedLand)}</span>{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="empty" role="status">
					{#if note}
						{note}
					{:else if activeCategory}
						No {activeCategory.replace('-', ' ')} demolitions in this view.
					{:else}
						No demolition permits on record for this area.
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.demo-watch {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.demo-summary {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.demo-summary strong {
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.summary-sep {
		color: var(--text-tertiary);
	}

	.demo-summary .range {
		font-family: var(--font-mono, monospace);
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.demo-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.cat-chip {
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
		transition: all 0.15s;
	}

	.cat-chip:hover {
		border-color: var(--chip-color);
		color: var(--text-primary);
	}

	.cat-chip.active {
		border-color: var(--chip-color);
		background: color-mix(in srgb, var(--chip-color) 16%, transparent);
		color: var(--text-primary);
	}

	.chip-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--chip-color);
	}

	.chip-count {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.cat-chip.active .chip-count {
		color: var(--text-secondary);
	}

	.demo-note {
		font-size: 0.6875rem;
		line-height: 1.4;
		padding: 6px 8px;
		border-radius: 6px;
		color: var(--text-tertiary);
		background: var(--bg-surface-hover);
		border-left: 2px solid var(--border-primary);
	}

	.demo-note.warn {
		color: var(--accent-warning);
		border-left-color: var(--accent-warning);
		background: color-mix(in srgb, var(--accent-warning) 10%, transparent);
	}

	.demo-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.demo-item {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border-left: 3px solid var(--cat-color);
		text-align: left;
	}

	.demo-item.clickable {
		cursor: pointer;
		transition: background 0.15s;
	}

	.demo-item.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}

	.demo-item:focus-visible {
		outline: 2px solid var(--cat-color);
		outline-offset: 1px;
	}

	.demo-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.cat-badge {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		background: var(--cat-color);
		flex-shrink: 0;
	}

	.demo-address {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.heritage-badge {
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: 800;
		border-radius: 3px;
		background: var(--palette-purple);
		color: #fff;
	}

	.demo-desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.3;
		margin-bottom: 5px;
	}

	.demo-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
	}

	.cat-pill {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: capitalize;
		padding: 1px 7px;
		border: 1px solid;
		border-radius: 10px;
	}

	.meta-bit {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.meta-bit.value {
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
	}

	.meta-bit.date {
		margin-left: auto;
		font-family: var(--font-mono, monospace);
	}

	.assessed {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 5px;
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.assessed-label {
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-secondary);
	}

	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
