<script lang="ts">
	import { fetchLocalFood } from '$lib/api/local-food';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { LocalFoodItem } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { isValidHttpUrl } from '$lib/utils/sanitize';

	let items = $state<LocalFoodItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeFilter = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchLocalFood({
			municipality: municipalityStore.slug,
			category: activeFilter || undefined
		});
		if (result.error) {
			error = result.error;
		} else {
			items = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		const _filter = activeFilter;
		loadData();
	});

	const filters = [
		{ label: 'All', value: null },
		{ label: 'Wine', value: 'winery' },
		{ label: 'Beer', value: 'brewery' },
		{ label: 'Cider', value: 'cidery' },
		{ label: 'Farms', value: 'farm' },
		{ label: 'Markets', value: 'market' }
	];

	function categoryIcon(cat: LocalFoodItem['category']): string {
		switch (cat) {
			case 'winery':
				return 'W';
			case 'brewery':
				return 'B';
			case 'cidery':
				return 'C';
			case 'distillery':
				return 'D';
			case 'farm':
				return 'F';
			case 'market':
				return 'M';
			case 'restaurant':
				return 'R';
			default:
				return '?';
		}
	}

	function categoryColor(cat: LocalFoodItem['category']): string {
		switch (cat) {
			case 'winery':
				return '#722f37';
			case 'brewery':
				return '#c77f32';
			case 'cidery':
				return '#6b8f3c';
			case 'distillery':
				return '#5e548e';
			case 'farm':
				return '#2d6a4f';
			case 'market':
				return '#e07a5f';
			case 'restaurant':
				return '#457b9d';
			default:
				return '#6c757d';
		}
	}

	function showOnMap(item: LocalFoodItem) {
		if (!item.coordinates) return;
		mapFocusStore.focus({
			coordinates: item.coordinates,
			title: item.name,
			description: item.address || item.category,
			color: categoryColor(item.category),
			zoom: 14
		});
	}
</script>

<div class="local-food">
	<div class="filters">
		{#each filters as filter (filter.label)}
			<button
				class="filter-btn"
				class:active={activeFilter === filter.value}
				onclick={() => {
					activeFilter = filter.value;
				}}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if items.length === 0}
		<div class="empty" role="status">No listings found</div>
	{:else}
		<div class="item-list">
			{#each items as item (item.id)}
				<div class="item-card">
					<div class="item-header">
						<span class="cat-badge" style="background: {categoryColor(item.category)}">
							{categoryIcon(item.category)}
						</span>
						<div class="item-name">
							{#if isValidHttpUrl(item.url)}
								<a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>
							{:else}
								{item.name}
							{/if}
						</div>
						{#if item.coordinates}
							<button
								class="map-btn"
								onclick={() => showOnMap(item)}
								title="Show on map"
								aria-label="Show {item.name} on map"
							>
								<svg
									width="12"
									height="12"
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
							</button>
						{/if}
					</div>
					<div class="item-desc">{item.description}</div>
					{#if item.specials && item.specials.length > 0}
						<div class="specials">
							{#each item.specials as special (special.title)}
								<div class="special-item">
									<span class="special-title">{special.title}</span>
									{#if special.description}
										<span class="special-desc">{special.description}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
					<div class="item-footer">
						{#if item.address}
							<span class="item-address">{item.address}</span>
						{/if}
						{#if item.hours}
							<span class="item-hours">{item.hours}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.local-food {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 6px;
	}

	.filters {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 3px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-subtle);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.625rem;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}

	.filter-btn:hover {
		background: var(--bg-surface-hover);
	}

	.filter-btn.active {
		background: var(--accent-primary);
		color: #fff;
		border-color: var(--accent-primary);
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.item-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.item-card:hover {
		background: var(--bg-surface-elevated);
	}

	.item-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.cat-badge {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.item-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
		min-width: 0;
	}

	.item-name a {
		color: inherit;
		text-decoration: none;
	}

	.item-name a:hover {
		color: var(--accent-primary);
	}

	.map-btn {
		width: 24px;
		height: 24px;
		border-radius: 5px;
		border: 1px solid var(--border-subtle);
		background: transparent;
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
	}

	.map-btn:hover {
		color: var(--accent-primary);
		border-color: var(--accent-primary);
	}

	.item-desc {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.specials {
		margin-top: 4px;
		padding: 4px 6px;
		border-radius: 4px;
		background: var(--bg-surface-elevated);
		border-left: 2px solid var(--accent-secondary);
	}

	.special-item {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.special-title {
		font-size: 0.5625rem;
		font-weight: 600;
		color: var(--accent-secondary);
	}

	.special-desc {
		font-size: 0.5rem;
		color: var(--text-tertiary);
	}

	.item-footer {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		font-size: 0.5625rem;
		color: var(--text-tertiary);
	}

	.item-hours {
		font-family: 'Geist Mono', monospace;
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
