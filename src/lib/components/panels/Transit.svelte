<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchTransitAlerts } from '$lib/api/transit';
	import { refreshStore, REFRESH_INTERVALS } from '$lib/stores/refresh.svelte';
	import type { TransitAlert } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';

	let alerts = $state<TransitAlert[]>([]);
	let loading = $state(true);
	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	async function loadAlerts() {
		loading = true;
		const result = await fetchTransitAlerts();
		alerts = result.data || [];
		loading = false;
	}

	function startRefreshTimer() {
		if (refreshTimer) clearInterval(refreshTimer);
		if (refreshStore.enabled) {
			refreshTimer = setInterval(loadAlerts, REFRESH_INTERVALS['transit']);
		}
	}

	onMount(() => {
		loadAlerts();
		startRefreshTimer();
	});

	onDestroy(() => {
		if (refreshTimer) clearInterval(refreshTimer);
	});

	$effect(() => {
		const _enabled = refreshStore.enabled;
		startRefreshTimer();
	});

	function severityColor(severity: TransitAlert['severity']): string {
		switch (severity) {
			case 'SEVERE':
				return 'var(--accent-danger, #e53e3e)';
			case 'WARNING':
				return 'var(--accent-warning, #f6ad55)';
			case 'INFO':
				return 'var(--accent-primary, #63b3ed)';
			default:
				return 'var(--text-tertiary)';
		}
	}

	function effectLabel(effect: string): string {
		return effect
			.replace(/_/g, ' ')
			.toLowerCase()
			.replace(/^\w/, (c) => c.toUpperCase());
	}

	function causeLabel(cause: string): string {
		return cause
			.replace(/_/g, ' ')
			.toLowerCase()
			.replace(/^\w/, (c) => c.toUpperCase());
	}

	function formatDate(iso?: string): string {
		if (!iso) return '';
		try {
			return new Date(iso).toLocaleDateString('en-CA', {
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return '';
		}
	}
</script>

<div class="transit">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else}
		<div class="alert-list">
			{#each alerts as alert (alert.id)}
				<div class="alert-card">
					<div class="alert-header">
						<span class="severity-dot" style="background: {severityColor(alert.severity)}"></span>
						<span class="effect-label">{effectLabel(alert.effect)}</span>
						{#if alert.routeIds && alert.routeIds.length > 0}
							<div class="route-badges">
								{#each alert.routeIds.slice(0, 4) as route (route)}
									<span class="route-badge">{route}</span>
								{/each}
							</div>
						{/if}
					</div>
					<div class="alert-title">{alert.headerText}</div>
					{#if alert.descriptionText}
						<div class="alert-desc">{alert.descriptionText}</div>
					{/if}
					<div class="alert-footer">
						<span class="cause">{causeLabel(alert.cause)}</span>
						{#if alert.activePeriodStart}
							<span class="period">
								{formatDate(alert.activePeriodStart)}
								{#if alert.activePeriodEnd}
									— {formatDate(alert.activePeriodEnd)}
								{/if}
							</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="empty">No transit alerts</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.transit {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.alert-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.alert-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.alert-card:hover {
		background: var(--bg-surface-elevated);
	}

	.alert-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.severity-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.effect-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.route-badges {
		display: flex;
		gap: 3px;
		margin-left: auto;
	}

	.route-badge {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--accent-primary);
		color: var(--text-inverse);
		font-family: 'Geist Mono', monospace;
	}

	.alert-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.alert-desc {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-top: 2px;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.alert-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 4px;
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}

	.cause {
		font-style: italic;
	}

	.period {
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
