<script lang="ts">
	import { fetchLocalFood } from '$lib/api/local-food';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
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
</script>

<div class="local-food">
	<div class="filters">
		{#each filters as filter}
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
					</div>
					<div class="item-desc">{item.description}</div>
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
	}

	.item-name a {
		color: inherit;
		text-decoration: none;
	}

	.item-name a:hover {
		color: var(--accent-primary);
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
