<script lang="ts">
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { municipalities } from '$lib/config/municipalities';

	interface DemographicStat {
		label: string;
		value: string;
		change?: string;
		changeDir?: 'up' | 'down' | 'flat';
	}

	interface MunicipalityDemographics {
		population: number;
		populationGrowth: number;
		medianAge: number;
		avgHouseholdSize: number;
		ownershipRate: number;
		medianIncome: number;
		immigrantPct: number;
	}

	const DEMOGRAPHICS: Record<string, MunicipalityDemographics> = {
		victoria: {
			population: 91867,
			populationGrowth: 6.8,
			medianAge: 40.2,
			avgHouseholdSize: 1.9,
			ownershipRate: 42.1,
			medianIncome: 45200,
			immigrantPct: 22.5
		},
		saanich: {
			population: 117735,
			populationGrowth: 3.4,
			medianAge: 44.1,
			avgHouseholdSize: 2.4,
			ownershipRate: 68.3,
			medianIncome: 52400,
			immigrantPct: 24.1
		},
		esquimalt: {
			population: 17533,
			populationGrowth: 3.1,
			medianAge: 38.7,
			avgHouseholdSize: 2.1,
			ownershipRate: 47.2,
			medianIncome: 43800,
			immigrantPct: 18.9
		},
		'oak-bay': {
			population: 18015,
			populationGrowth: 0.8,
			medianAge: 51.3,
			avgHouseholdSize: 2.3,
			ownershipRate: 78.9,
			medianIncome: 62100,
			immigrantPct: 21.3
		},
		langford: {
			population: 46584,
			populationGrowth: 17.2,
			medianAge: 36.8,
			avgHouseholdSize: 2.6,
			ownershipRate: 71.5,
			medianIncome: 54900,
			immigrantPct: 16.8
		},
		colwood: {
			population: 18961,
			populationGrowth: 7.9,
			medianAge: 41.5,
			avgHouseholdSize: 2.5,
			ownershipRate: 72.1,
			medianIncome: 56200,
			immigrantPct: 17.2
		},
		sooke: {
			population: 15054,
			populationGrowth: 16.3,
			medianAge: 39.4,
			avgHouseholdSize: 2.5,
			ownershipRate: 74.8,
			medianIncome: 48600,
			immigrantPct: 12.1
		},
		sidney: {
			population: 12402,
			populationGrowth: 2.6,
			medianAge: 56.2,
			avgHouseholdSize: 2.0,
			ownershipRate: 67.4,
			medianIncome: 47800,
			immigrantPct: 19.5
		},
		'north-saanich': {
			population: 12236,
			populationGrowth: 1.9,
			medianAge: 53.7,
			avgHouseholdSize: 2.3,
			ownershipRate: 84.2,
			medianIncome: 61500,
			immigrantPct: 18.7
		},
		'central-saanich': {
			population: 18681,
			populationGrowth: 4.1,
			medianAge: 46.8,
			avgHouseholdSize: 2.5,
			ownershipRate: 79.3,
			medianIncome: 57800,
			immigrantPct: 15.9
		},
		'view-royal': {
			population: 11575,
			populationGrowth: 5.6,
			medianAge: 42.3,
			avgHouseholdSize: 2.4,
			ownershipRate: 69.7,
			medianIncome: 53100,
			immigrantPct: 19.4
		},
		highlands: {
			population: 2442,
			populationGrowth: 2.2,
			medianAge: 47.5,
			avgHouseholdSize: 2.6,
			ownershipRate: 93.1,
			medianIncome: 65400,
			immigrantPct: 14.2
		},
		metchosin: {
			population: 5078,
			populationGrowth: 1.1,
			medianAge: 50.8,
			avgHouseholdSize: 2.4,
			ownershipRate: 89.6,
			medianIncome: 59200,
			immigrantPct: 15.8
		}
	};

	function getCRDAggregate(): MunicipalityDemographics {
		const all = Object.values(DEMOGRAPHICS);
		const totalPop = all.reduce((s, d) => s + d.population, 0);
		return {
			population: totalPop,
			populationGrowth: parseFloat(
				(all.reduce((s, d) => s + d.populationGrowth * d.population, 0) / totalPop).toFixed(1)
			),
			medianAge: parseFloat(
				(all.reduce((s, d) => s + d.medianAge * d.population, 0) / totalPop).toFixed(1)
			),
			avgHouseholdSize: parseFloat(
				(all.reduce((s, d) => s + d.avgHouseholdSize * d.population, 0) / totalPop).toFixed(1)
			),
			ownershipRate: parseFloat(
				(all.reduce((s, d) => s + d.ownershipRate * d.population, 0) / totalPop).toFixed(1)
			),
			medianIncome: Math.round(
				all.reduce((s, d) => s + d.medianIncome * d.population, 0) / totalPop
			),
			immigrantPct: parseFloat(
				(all.reduce((s, d) => s + d.immigrantPct * d.population, 0) / totalPop).toFixed(1)
			)
		};
	}

	const currentDemographics = $derived(
		municipalityStore.slug ? DEMOGRAPHICS[municipalityStore.slug] || null : getCRDAggregate()
	);

	function formatNumber(n: number): string {
		return n.toLocaleString('en-CA');
	}

	function formatCurrency(n: number): string {
		return '$' + n.toLocaleString('en-CA');
	}

	const stats = $derived<DemographicStat[]>(
		currentDemographics
			? [
					{
						label: 'Population',
						value: formatNumber(currentDemographics.population),
						change: `+${currentDemographics.populationGrowth}%`,
						changeDir: currentDemographics.populationGrowth > 0 ? 'up' : 'flat'
					},
					{
						label: 'Median Age',
						value: `${currentDemographics.medianAge} yrs`
					},
					{
						label: 'Avg Household Size',
						value: `${currentDemographics.avgHouseholdSize}`
					},
					{
						label: 'Home Ownership',
						value: `${currentDemographics.ownershipRate}%`
					},
					{
						label: 'Median Income',
						value: formatCurrency(currentDemographics.medianIncome)
					},
					{
						label: 'Immigrants',
						value: `${currentDemographics.immigrantPct}%`
					}
				]
			: []
	);

	let viewMode = $state<'stats' | 'compare'>('stats');

	const rankedMunicipalities = $derived(
		municipalities
			.map((m) => ({
				...m,
				demographics: DEMOGRAPHICS[m.slug]
			}))
			.filter((m) => m.demographics)
			.sort((a, b) => b.demographics!.population - a.demographics!.population)
	);
</script>

<div class="demographics">
	<div class="view-tabs">
		<button class="tab" class:active={viewMode === 'stats'} onclick={() => (viewMode = 'stats')}>
			Stats
		</button>
		<button
			class="tab"
			class:active={viewMode === 'compare'}
			onclick={() => (viewMode = 'compare')}
		>
			Compare
		</button>
	</div>

	{#if viewMode === 'stats'}
		{#if stats.length === 0}
			<div class="empty">No demographic data available</div>
		{:else}
			<div class="stats-grid">
				{#each stats as stat (stat.label)}
					<div class="stat-card">
						<div class="stat-label">{stat.label}</div>
						<div class="stat-value">{stat.value}</div>
						{#if stat.change}
							<div
								class="stat-change"
								class:up={stat.changeDir === 'up'}
								class:down={stat.changeDir === 'down'}
							>
								{stat.change} (2021 Census)
							</div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="source-note">Source: Statistics Canada 2021 Census</div>
		{/if}
	{:else}
		<div class="compare-list">
			{#each rankedMunicipalities as m (m.slug)}
				<div class="compare-row" class:highlighted={municipalityStore.slug === m.slug}>
					<span class="compare-name" style="color: {m.color}">{m.name}</span>
					<span class="compare-pop">{formatNumber(m.demographics!.population)}</span>
					<div class="compare-bar-container">
						<div
							class="compare-bar"
							style="width: {(m.demographics!.population / 120000) * 100}%; background: {m.color}"
						></div>
					</div>
					<span class="compare-growth">+{m.demographics!.populationGrowth}%</span>
				</div>
			{/each}
		</div>
		<div class="source-note">Population growth 2016-2021</div>
	{/if}
</div>

<style>
	.demographics {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.view-tabs {
		display: flex;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.tab {
		padding: 4px 12px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab.active {
		background: var(--accent-primary);
		color: var(--text-inverse);
		border-color: var(--accent-primary);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		flex: 1;
		align-content: start;
	}

	.stat-card {
		padding: 10px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.stat-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 2px;
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
		line-height: 1.2;
	}

	.stat-change {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		margin-top: 2px;
	}

	.stat-change.up {
		color: var(--accent-secondary);
	}

	.stat-change.down {
		color: var(--accent-danger);
	}

	.compare-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1;
		overflow-y: auto;
	}

	.compare-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 6px;
		border-radius: 4px;
		transition: background 0.15s;
	}

	.compare-row:hover,
	.compare-row.highlighted {
		background: var(--bg-surface-hover);
	}

	.compare-name {
		font-size: 0.6875rem;
		font-weight: 600;
		width: 80px;
		flex-shrink: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.compare-pop {
		font-size: 0.6875rem;
		font-family: 'Geist Mono', monospace;
		color: var(--text-secondary);
		width: 50px;
		text-align: right;
		flex-shrink: 0;
	}

	.compare-bar-container {
		flex: 1;
		height: 6px;
		background: var(--border-primary);
		border-radius: 3px;
		overflow: hidden;
	}

	.compare-bar {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.compare-growth {
		font-size: 0.5625rem;
		color: var(--accent-secondary);
		font-family: 'Geist Mono', monospace;
		width: 36px;
		text-align: right;
		flex-shrink: 0;
	}

	.source-note {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		text-align: center;
		font-style: italic;
		padding-top: 4px;
		border-top: 1px solid var(--border-primary);
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
