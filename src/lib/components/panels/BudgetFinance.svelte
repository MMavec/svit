<script lang="ts">
	import { fetchBudgetItems } from '$lib/api/budget';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { BudgetItem } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let items = $state<BudgetItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let viewType = $state<'expenditure' | 'revenue'>('expenditure');

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchBudgetItems({
			municipality: municipalityStore.slug
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
		loadData();
	});

	let filteredItems = $derived(items.filter((i) => i.type === viewType));

	let totalAmount = $derived(filteredItems.reduce((sum, i) => sum + i.amount, 0));

	function formatAmount(amount: number): string {
		if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
		if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
		return `$${amount.toLocaleString()}`;
	}

	function barWidth(item: BudgetItem): string {
		return `${item.percentOfTotal}%`;
	}

	function barColor(index: number): string {
		const colors = ['#63b3ed', '#68d391', '#f6ad55', '#fc8181', '#b794f4', '#f687b3', '#76e4f7'];
		return colors[index % colors.length];
	}
</script>

<div class="budget">
	{#if loading}
		<PanelSkeleton variant="card" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if items.length === 0}
		<div class="empty">No budget data available</div>
	{:else}
		<div class="toggle-row">
			<button
				class="toggle-btn"
				class:active={viewType === 'expenditure'}
				onclick={() => (viewType = 'expenditure')}
			>
				Spending
			</button>
			<button
				class="toggle-btn"
				class:active={viewType === 'revenue'}
				onclick={() => (viewType = 'revenue')}
			>
				Revenue
			</button>
			<span class="total-amount">{formatAmount(totalAmount)}</span>
		</div>
		<div class="bar-list">
			{#each filteredItems as item, i (item.id)}
				<div class="bar-row">
					<div class="bar-label">
						<span class="bar-category">{item.category}</span>
						<span class="bar-amount">{formatAmount(item.amount)}</span>
					</div>
					<div class="bar-track">
						<div class="bar-fill" style="width: {barWidth(item)}; background: {barColor(i)}"></div>
					</div>
					<div class="bar-meta">
						<span class="bar-percent">{item.percentOfTotal}%</span>
						{#if item.changeFromPrior !== undefined}
							<span
								class="bar-change"
								style="color: {item.changeFromPrior >= 0 ? '#68d391' : '#fc8181'}"
							>
								{item.changeFromPrior >= 0 ? '+' : ''}{item.changeFromPrior}%
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.budget {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.toggle-btn {
		padding: 3px 10px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-btn.active {
		background: var(--accent-primary);
		color: #fff;
		border-color: var(--accent-primary);
	}

	.total-amount {
		margin-left: auto;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
	}

	.bar-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
		flex: 1;
	}

	.bar-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bar-label {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.bar-category {
		font-size: 0.75rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.bar-amount {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		font-family: 'Geist Mono', monospace;
	}

	.bar-track {
		height: 6px;
		background: var(--bg-surface-hover);
		border-radius: 3px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.5s ease;
	}

	.bar-meta {
		display: flex;
		gap: 8px;
		font-size: 0.5625rem;
	}

	.bar-percent {
		color: var(--text-tertiary);
	}

	.bar-change {
		font-weight: 600;
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
