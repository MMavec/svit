<script lang="ts">
	import { fetchHousingMetrics } from '$lib/api/housing';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { HousingMetric } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let metrics = $state<HousingMetric[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchHousingMetrics({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			metrics = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function formatValue(metric: HousingMetric): string {
		switch (metric.unit) {
			case 'dollars':
				return metric.value >= 1000000
					? `$${(metric.value / 1000000).toFixed(1)}M`
					: `$${metric.value.toLocaleString()}`;
			case 'percent':
				return `${metric.value}%`;
			case 'count':
				return metric.value.toLocaleString();
		}
	}

	function changeColor(change: number | undefined): string {
		if (change === undefined) return 'var(--text-tertiary)';
		if (change > 0) return 'var(--accent-secondary)';
		if (change < 0) return 'var(--accent-danger)';
		return 'var(--text-tertiary)';
	}

	function changeLabel(change: number | undefined): string {
		if (change === undefined) return '';
		const sign = change > 0 ? '+' : '';
		return `${sign}${change}%`;
	}
</script>

<div class="housing">
	{#if loading}
		<PanelSkeleton variant="card" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if metrics.length === 0}
		<div class="empty" role="status">No housing metrics available for this municipality yet</div>
	{:else}
		<div class="metric-grid">
			{#each metrics as metric (metric.id)}
				<div class="metric-card">
					<div class="metric-label">{metric.label}</div>
					<div class="metric-value">{formatValue(metric)}</div>
					<div class="metric-footer">
						{#if metric.change !== undefined}
							<span class="metric-change" style="color: {changeColor(metric.change)}">
								{changeLabel(metric.change)}
							</span>
						{/if}
						<span class="metric-period">{metric.period}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.housing {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.metric-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		overflow-y: auto;
		flex: 1;
	}

	.metric-card {
		padding: 10px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.metric-label {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.metric-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
	}

	.metric-footer {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 2px;
	}

	.metric-change {
		font-size: 0.625rem;
		font-weight: 600;
		font-family: 'Geist Mono', monospace;
	}

	.metric-period {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
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
