<script lang="ts">
	import { getContext, onDestroy } from 'svelte';

	interface Props {
		variant?: 'list' | 'card' | 'chart' | 'hero';
	}

	let { variant = 'list' }: Props = $props();

	// When skeleton is destroyed (loading finished), notify the parent Panel
	const markUpdated = getContext<(() => void) | undefined>('panel:markUpdated');
	onDestroy(() => {
		markUpdated?.();
	});
</script>

<div class="skeleton skeleton-{variant}" role="status" aria-label="Loading">
	{#if variant === 'list'}
		<div class="skeleton-bar" style="width: 100%"></div>
		<div class="skeleton-bar" style="width: 80%"></div>
		<div class="skeleton-bar" style="width: 60%"></div>
		<div class="skeleton-bar" style="width: 90%"></div>
	{:else if variant === 'card'}
		<div class="skeleton-card"></div>
		<div class="skeleton-card"></div>
		<div class="skeleton-card short"></div>
	{:else if variant === 'chart'}
		<div class="skeleton-chart">
			<div class="chart-bar" style="height: 40%"></div>
			<div class="chart-bar" style="height: 70%"></div>
			<div class="chart-bar" style="height: 55%"></div>
			<div class="chart-bar" style="height: 85%"></div>
			<div class="chart-bar" style="height: 45%"></div>
			<div class="chart-bar" style="height: 65%"></div>
			<div class="chart-bar" style="height: 30%"></div>
		</div>
	{:else if variant === 'hero'}
		<div class="skeleton-hero"></div>
		<div class="skeleton-row">
			<div class="skeleton-block"></div>
			<div class="skeleton-block"></div>
			<div class="skeleton-block"></div>
		</div>
	{/if}
</div>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 4px 0;
	}

	.skeleton-bar {
		height: 12px;
		border-radius: 6px;
		background: var(--bg-surface-hover);
		position: relative;
		overflow: hidden;
	}

	.skeleton-bar::after,
	.skeleton-card::after,
	.skeleton-hero::after,
	.skeleton-block::after,
	.chart-bar::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.08) 50%,
			transparent 100%
		);
		animation: shimmer 1.5s infinite;
	}

	.skeleton-card {
		height: 56px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border: 1px solid var(--border-primary);
		position: relative;
		overflow: hidden;
	}

	.skeleton-card.short {
		width: 70%;
	}

	.skeleton-chart {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		height: 100px;
		padding-top: 8px;
	}

	.chart-bar {
		flex: 1;
		border-radius: 4px 4px 0 0;
		background: var(--bg-surface-hover);
		position: relative;
		overflow: hidden;
	}

	.skeleton-hero {
		height: 80px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border: 1px solid var(--border-primary);
		position: relative;
		overflow: hidden;
	}

	.skeleton-row {
		display: flex;
		gap: 8px;
	}

	.skeleton-block {
		flex: 1;
		height: 48px;
		border-radius: 6px;
		background: var(--bg-surface-hover);
		position: relative;
		overflow: hidden;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
</style>
