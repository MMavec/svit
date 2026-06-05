<script lang="ts">
	import { fetchBusinessLicences } from '$lib/api/business-licences';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { BusinessLicence } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import BookmarkButton from '$lib/components/ui/BookmarkButton.svelte';
	import { licenceCategoryColor } from '$lib/utils/color-maps';

	type Category = BusinessLicence['category'];

	let licences = $state<BusinessLicence[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let newlyCommencedCount = $state(0);
	let byCategory = $state<Record<string, number>>({});
	let newOnly = $state(true);
	let activeCategory = $state<Category | null>(null);

	const CATEGORY_LABELS: Record<Category, string> = {
		retail: 'Retail',
		'food-drink': 'Food & drink',
		professional: 'Professional',
		'personal-services': 'Personal services',
		accommodation: 'Accommodation',
		'rental-housing': 'Rental housing',
		contractor: 'Trades',
		machines: 'Machines',
		other: 'Other'
	};

	async function load() {
		loading = true;
		error = null;
		// Fetch a healthy pool so the default "newly commenced" client-side filter isn't sparse
		// (most recently-issued licences are Jan-1 annual renewals).
		const result = await fetchBusinessLicences({
			municipality: municipalityStore.slug,
			limit: 150
		});
		if (result.error) {
			error = result.error;
		} else {
			licences = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			newlyCommencedCount = (meta?.newlyCommencedCount as number) || 0;
			byCategory = (meta?.byCategory as Record<string, number>) || {};
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeCategory = null;
		load();
	});

	const displayed = $derived(
		licences
			.filter((l) => (newOnly ? l.newlyCommenced : true))
			.filter((l) => (activeCategory ? l.category === activeCategory : true))
	);

	const presentCategories = $derived(
		(Object.keys(byCategory) as Category[])
			.filter((c) => byCategory[c] > 0)
			.sort((a, b) => byCategory[b] - byCategory[a])
	);

	function toggleCategory(c: Category) {
		activeCategory = activeCategory === c ? null : c;
	}

	function focusOnMap(l: BusinessLicence) {
		if (!l.coordinates) return;
		mapFocusStore.focus({
			coordinates: l.coordinates,
			title: l.tradeName,
			description: l.licenceType,
			color: '#3182ce',
			zoom: 16
		});
	}

	function formatDate(iso?: string): string {
		if (!iso) return '';
		const d = new Date(`${iso}T00:00:00`);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
	}
</script>

<div class="lic">
	<div class="controls">
		<button
			class="toggle"
			class:active={newOnly}
			aria-pressed={newOnly}
			onclick={() => (newOnly = !newOnly)}
			title="Show only licences whose coverage starts after Jan 1 (not routine annual renewals)"
		>
			Newly commenced
			{#if newlyCommencedCount > 0}<span class="toggle-count">{newlyCommencedCount}</span>{/if}
		</button>
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if presentCategories.length > 0}
			<div class="cats" role="group" aria-label="Filter by category">
				{#each presentCategories as c (c)}
					<button
						class="chip"
						class:active={activeCategory === c}
						style="--c: {licenceCategoryColor(c)}"
						aria-pressed={activeCategory === c}
						onclick={() => toggleCategory(c)}
					>
						<span class="chip-dot"></span>
						{CATEGORY_LABELS[c]}
						<span class="chip-count">{byCategory[c]}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if note}
			<div class="note" class:warn={!live} role="note">{note}</div>
		{/if}

		<div class="list">
			{#each displayed as l (l.id)}
				<div
					class="item"
					class:clickable={!!l.coordinates}
					style="--c: {licenceCategoryColor(l.category)}"
					role="button"
					tabindex="0"
					aria-label={l.coordinates ? `Show ${l.tradeName} on map` : l.tradeName}
					onclick={() => focusOnMap(l)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focusOnMap(l);
						}
					}}
				>
					<div class="item-head">
						<span class="dot"></span>
						<span class="name">{l.tradeName}</span>
						{#if l.newlyCommenced}<span class="new-badge" title="Coverage starts after Jan 1"
								>new</span
							>{/if}
						<BookmarkButton
							itemType="business-licence"
							externalId={l.id}
							title={l.tradeName}
							description={l.licenceType}
							municipality={l.municipality}
						/>
					</div>
					<div class="type">{l.licenceType}</div>
					<div class="meta">
						<span
							class="pill"
							style="color: {licenceCategoryColor(l.category)}; border-color: {licenceCategoryColor(
								l.category
							)}"
						>
							{CATEGORY_LABELS[l.category]}
						</span>
						{#if l.neighbourhood}<span class="bit">{l.neighbourhood}</span>{/if}
						{#if l.issuedDate}<span class="bit date">{formatDate(l.issuedDate)}</span>{/if}
					</div>
				</div>
			{:else}
				<div class="empty" role="status">
					{#if note && !live}{note}{:else if newOnly}No newly-commenced licences in this view.
						Toggle off to see all recent licences.{:else}No business licences in this area.{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.lic {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.controls {
		display: flex;
		gap: 4px;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 12px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--accent-primary);
		border-radius: 6px;
		background: transparent;
		color: var(--accent-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle.active {
		background: var(--accent-primary);
		color: var(--text-inverse, #fff);
	}

	.toggle-count {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0 5px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		color: var(--text-secondary);
	}

	.toggle.active .toggle-count {
		background: rgba(255, 255, 255, 0.25);
		color: #fff;
	}

	.cats {
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
		transition: all 0.15s;
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

	.chip-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c);
	}

	.chip-count {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--text-tertiary);
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

	.new-badge {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 1px 5px;
		border-radius: 8px;
		background: var(--accent-secondary);
		color: #fff;
	}

	.type {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.3;
		margin-bottom: 5px;
		text-transform: capitalize;
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
