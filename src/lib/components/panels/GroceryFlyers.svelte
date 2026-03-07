<script lang="ts">
	import { fetchFlyers } from '$lib/api/flyers';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { GroceryFlyer } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let flyers = $state<GroceryFlyer[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchFlyers({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			flyers = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function formatDateRange(from: string, to: string): string {
		const f = new Date(from + 'T00:00:00');
		const t = new Date(to + 'T00:00:00');
		const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return `${f.toLocaleDateString('en-CA', opts)} – ${t.toLocaleDateString('en-CA', opts)}`;
	}

	function storeInitial(name: string): string {
		return name.charAt(0).toUpperCase();
	}

	function storeColor(slug: string): string {
		switch (slug) {
			case 'thrifty-foods':
				return '#e63946';
			case 'save-on-foods':
				return '#2d6a4f';
			case 'fairway-market':
			case 'fairway-markets':
				return '#457b9d';
			case 'country-grocer':
				return '#6b705c';
			case 'red-barn-market':
				return '#bc4749';
			case 'peppers-foods':
			case 'pepper-s-foods':
				return '#e07a5f';
			case 'the-root-cellar':
			case 'root-cellar':
				return '#588157';
			case 'walmart':
				return '#0071ce';
			case 'costco':
				return '#e31837';
			case 'quality-foods':
				return '#1a5632';
			default:
				return '#6c757d';
		}
	}

	function showOnMap(flyer: GroceryFlyer) {
		// Pick the best location: municipality-matching first, then primary coordinates
		const muni = municipalityStore.slug;
		let coords = flyer.coordinates;
		let locationName = flyer.store;

		if (flyer.locations && flyer.locations.length > 0) {
			const match = muni ? flyer.locations.find((l) => l.municipality === muni) : undefined;
			const loc = match || flyer.locations[0];
			coords = loc.coordinates;
			locationName = loc.name;
		}

		if (!coords) return;
		mapFocusStore.focus({
			coordinates: coords,
			title: locationName,
			description: `${flyer.title} — ${formatDateRange(flyer.validFrom, flyer.validTo)}`,
			color: storeColor(flyer.storeSlug),
			zoom: 14
		});
	}

	function locationCount(flyer: GroceryFlyer): number {
		return flyer.locations?.length || (flyer.coordinates ? 1 : 0);
	}
</script>

<div class="flyers">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if flyers.length === 0}
		<div class="empty" role="status">No flyers available right now</div>
	{:else}
		<div class="flyer-list">
			{#each flyers as flyer (flyer.id)}
				<div class="flyer-card">
					<div class="flyer-main">
						<span class="store-badge" style="background: {storeColor(flyer.storeSlug)}">
							{storeInitial(flyer.store)}
						</span>
						<div class="flyer-info">
							<div class="store-name">{flyer.store}</div>
							<div class="flyer-title">{flyer.title}</div>
							<div class="flyer-meta">
								<span class="flyer-dates">{formatDateRange(flyer.validFrom, flyer.validTo)}</span>
								{#if flyer.itemCount}
									<span class="item-count">{flyer.itemCount} deals</span>
								{/if}
							</div>
						</div>
						<div class="flyer-actions">
							{#if flyer.coordinates || (flyer.locations && flyer.locations.length > 0)}
								<button
									class="map-btn"
									onclick={() => showOnMap(flyer)}
									title="Show on map"
									aria-label="Show {flyer.store} on map"
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
										<circle cx="12" cy="10" r="3" />
									</svg>
									{#if locationCount(flyer) > 1}
										<span class="location-count">{locationCount(flyer)}</span>
									{/if}
								</button>
							{/if}
							<a
								href={flyer.flyerUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="view-btn"
								title="View flyer"
								aria-label="View {flyer.store} flyer"
							>
								&#8599;
							</a>
						</div>
					</div>
					{#if flyer.highlights && flyer.highlights.length > 0}
						<div class="highlights">
							{#each flyer.highlights as hl (hl.name)}
								<div class="highlight-item">
									<span class="hl-name">{hl.name}</span>
									{#if hl.price}
										<span class="hl-price">{hl.price}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.flyers {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.flyer-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	.flyer-card {
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
		overflow: hidden;
		flex-shrink: 0;
	}

	.flyer-card:hover {
		background: var(--bg-surface-elevated);
	}

	.flyer-main {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
	}

	.store-badge {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.flyer-info {
		flex: 1;
		min-width: 0;
	}

	.store-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.flyer-title {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.flyer-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 2px;
	}

	.flyer-dates {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-family: 'Geist Mono', monospace;
	}

	.item-count {
		font-size: 0.5625rem;
		color: var(--accent-primary);
		font-weight: 600;
	}

	.flyer-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.map-btn {
		position: relative;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid var(--border-subtle);
		background: transparent;
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
	}

	.map-btn:hover {
		color: var(--accent-primary);
		border-color: var(--accent-primary);
	}

	.location-count {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent-primary);
		color: #fff;
		font-size: 0.5rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.view-btn {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		color: var(--text-tertiary);
		text-decoration: none;
		transition: color 0.15s;
	}

	.view-btn:hover {
		color: var(--accent-primary);
	}

	.highlights {
		display: flex;
		flex-wrap: wrap;
		gap: 0;
		border-top: 1px solid var(--border-subtle);
	}

	.highlight-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 3px 10px;
		width: 50%;
		gap: 4px;
		box-sizing: border-box;
		border-bottom: 1px solid var(--border-subtle);
	}

	.highlight-item:nth-child(odd) {
		border-right: 1px solid var(--border-subtle);
	}

	.hl-name {
		font-size: 0.5625rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.hl-price {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--accent-secondary);
		font-family: 'Geist Mono', monospace;
		flex-shrink: 0;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
