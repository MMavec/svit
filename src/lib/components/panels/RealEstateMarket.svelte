<script lang="ts">
	import { fetchRealEstateMetrics } from '$lib/api/real-estate';
	import type { RealEstateMetric } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let metrics = $state<RealEstateMetric[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchRealEstateMetrics();
		if (result.error) {
			error = result.error;
		} else {
			metrics = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		loadData();
	});

	function formatValue(metric: RealEstateMetric): string {
		switch (metric.unit) {
			case 'dollars':
				return metric.value >= 1000000
					? `$${(metric.value / 1000000).toFixed(1)}M`
					: `$${metric.value.toLocaleString()}`;
			case 'percent':
				return `${metric.value}%`;
			case 'ratio':
				return metric.value.toFixed(1);
			case 'count':
				return metric.value.toLocaleString();
		}
	}

	function changeColor(change: number | undefined): string {
		if (change === undefined) return 'var(--text-tertiary)';
		// For real estate, rising prices = red (cost concern), falling = green (opportunity)
		// But rising sales/listings = green (active market)
		return change > 0
			? 'var(--accent-secondary)'
			: change < 0
				? 'var(--accent-danger)'
				: 'var(--text-tertiary)';
	}

	function changeLabel(change: number | undefined): string {
		if (change === undefined) return '';
		const sign = change > 0 ? '+' : '';
		return `${sign}${change}% YoY`;
	}
</script>

<div class="real-estate">
	{#if loading}
		<PanelSkeleton variant="card" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if metrics.length === 0}
		<div class="empty" role="status">No real estate data available</div>
	{:else}
		<div class="source-label">
			VREB MLS&reg; Statistics &bull; {metrics[0]?.period}
		</div>
		<div class="metric-grid">
			{#each metrics as metric (metric.id)}
				<div class="metric-card">
					<div class="metric-label">
						{metric.label}
						{#if metric.propertyType && metric.propertyType !== 'all'}
							<span class="type-badge">{metric.propertyType}</span>
						{/if}
					</div>
					<div class="metric-value">{formatValue(metric)}</div>
					<div class="metric-footer">
						{#if metric.change !== undefined}
							<span class="metric-change" style="color: {changeColor(metric.change)}">
								{changeLabel(metric.change)}
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		<div class="attribution">
			<a href="https://www.vreb.org/current-statistics" target="_blank" rel="noopener noreferrer">
				Full report at vreb.org
			</a>
		</div>
	{/if}
</div>

<style>
	.real-estate {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 6px;
	}

	.source-label {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		text-align: center;
		padding: 2px 0;
	}

	.metric-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.metric-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.metric-label {
		font-size: 0.625rem;
		color: var(--text-secondary);
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.type-badge {
		font-size: 0.5rem;
		padding: 0 3px;
		border-radius: 3px;
		background: var(--bg-surface-elevated);
		color: var(--text-tertiary);
		text-transform: capitalize;
	}

	.metric-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
	}

	.metric-footer {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.metric-change {
		font-size: 0.5625rem;
		font-weight: 600;
		font-family: 'Geist Mono', monospace;
	}

	.attribution {
		text-align: center;
		padding: 4px 0;
	}

	.attribution a {
		font-size: 0.5625rem;
		color: var(--accent-primary);
		text-decoration: none;
	}

	.attribution a:hover {
		text-decoration: underline;
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
