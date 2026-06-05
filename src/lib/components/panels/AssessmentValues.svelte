<script lang="ts">
	import { fetchAssessment } from '$lib/api/assessment';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { AssessmentArea } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	type Metric = 'residential' | 'business';

	let areas = $state<AssessmentArea[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let live = $state(true);
	let note = $state<string | null>(null);
	let taxYear = $state(2026);
	let metric = $state<Metric>('residential');

	async function load() {
		loading = true;
		error = null;
		const result = await fetchAssessment({ municipality: municipalityStore.slug });
		if (result.error) {
			error = result.error;
		} else {
			areas = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			live = meta?.live !== false;
			note = (meta?.note as string) || null;
			taxYear = (meta?.taxYear as number) || 2026;
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		load();
	});

	function valueOf(a: AssessmentArea): number | undefined {
		return metric === 'business' ? a.businessMedian : a.residentialMedian;
	}

	const ranked = $derived(
		[...areas]
			.filter((a) => valueOf(a) !== undefined)
			.sort((a, b) => (valueOf(b) ?? 0) - (valueOf(a) ?? 0))
	);

	const maxVal = $derived(Math.max(1, ...ranked.map((a) => valueOf(a) ?? 0)));

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
</script>

<div class="assess">
	<div class="controls" role="group" aria-label="Property class">
		<button
			class="seg"
			class:active={metric === 'residential'}
			onclick={() => (metric = 'residential')}
		>
			Residential
		</button>
		<button class="seg" class:active={metric === 'business'} onclick={() => (metric = 'business')}>
			Business
		</button>
		<span class="year">{taxYear} roll</span>
	</div>

	{#if loading}
		<PanelSkeleton variant="chart" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		{#if note}
			<div class="note" class:warn={!live} role="note">{note}</div>
		{/if}

		<div class="list">
			{#each ranked as a (a.id)}
				{@const v = valueOf(a) ?? 0}
				<div
					class="row"
					title={metric === 'residential' && a.landMedian && a.improvementMedian
						? `Land ${moneyFull.format(a.landMedian)} · Building ${moneyFull.format(a.improvementMedian)}`
						: a.neighbourhood}
				>
					<div class="row-head">
						<span class="hood">{a.neighbourhood}</span>
						<span class="amount">{moneyFull.format(v)}</span>
					</div>
					<div class="track">
						<span class="fill" style="width: {(v / maxVal) * 100}%"></span>
					</div>
					{#if metric === 'residential' && a.landMedian && a.improvementMedian}
						<div class="split">
							<span class="split-bit">Land {moneyFmt.format(a.landMedian)}</span>
							<span class="split-bit">Building {moneyFmt.format(a.improvementMedian)}</span>
						</div>
					{/if}
				</div>
			{:else}
				<div class="empty" role="status">
					{#if note && !live}{note}{:else}No assessment data for this area.{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.assess {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.seg {
		padding: 3px 10px;
		font-size: 0.6875rem;
		font-weight: 600;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.seg.active {
		border-color: var(--accent-primary);
		background: color-mix(in srgb, var(--accent-primary) 16%, transparent);
		color: var(--text-primary);
	}

	.year {
		margin-left: auto;
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-family: var(--font-mono, monospace);
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
		gap: 8px;
		overflow-y: auto;
		flex: 1;
	}

	.row-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 3px;
	}

	.hood {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.amount {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.track {
		height: 8px;
		background: var(--bg-surface-hover);
		border-radius: 4px;
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: 4px;
		min-width: 2px;
		background: var(--accent-primary);
	}

	.split {
		display: flex;
		gap: 10px;
		margin-top: 3px;
	}

	.split-bit {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
