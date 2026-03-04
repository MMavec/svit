<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchSafetyAlerts } from '$lib/api/safety';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { refreshStore, REFRESH_INTERVALS } from '$lib/stores/refresh.svelte';
	import { isValidHttpUrl } from '$lib/utils/sanitize';
	import type { SafetyAlert } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { safetyAlertColor } from '$lib/utils/color-maps';

	let alerts = $state<SafetyAlert[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	async function loadAlerts() {
		loading = true;
		error = null;
		const result = await fetchSafetyAlerts({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			alerts = result.data || [];
		}
		loading = false;
	}

	function startRefreshTimer() {
		stopRefreshTimer();
		if (refreshStore.enabled) {
			refreshTimer = setInterval(loadAlerts, REFRESH_INTERVALS['safety-emergency']);
		}
	}

	function stopRefreshTimer() {
		if (refreshTimer) clearInterval(refreshTimer);
	}

	onMount(() => {
		startRefreshTimer();
	});

	onDestroy(() => {
		stopRefreshTimer();
	});

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadAlerts();
	});

	$effect(() => {
		const _enabled = refreshStore.enabled;
		startRefreshTimer();
	});

	let filterType = $state<string | null>(null);

	const filteredAlerts = $derived(
		filterType ? alerts.filter((a) => a.type === filterType) : alerts
	);

	const alertTypes = $derived([...new Set(alerts.map((a) => a.type))]);

	function typeIcon(type: SafetyAlert['type']): string {
		switch (type) {
			case 'weather':
				return 'W';
			case 'wildfire':
				return 'F';
			case 'road-incident':
				return 'R';
			case 'earthquake':
				return 'E';
			case 'tsunami':
				return 'T';
			default:
				return '!';
		}
	}

	function typeLabel(type: SafetyAlert['type']): string {
		switch (type) {
			case 'weather':
				return 'Weather';
			case 'wildfire':
				return 'Wildfire';
			case 'road-incident':
				return 'Road';
			case 'earthquake':
				return 'Earthquake';
			case 'tsunami':
				return 'Tsunami';
			default:
				return 'Alert';
		}
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<div class="safety">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadAlerts} />
	{:else if alerts.length === 0}
		<div class="all-clear" role="status">
			<div class="check-icon">&#10003;</div>
			<div class="clear-text">No active alerts</div>
			<div class="clear-sub">All clear in the CRD</div>
		</div>
	{:else}
		{#if alertTypes.length > 1}
			<div class="filter-chips">
				<button class="chip" class:active={filterType === null} onclick={() => (filterType = null)}
					>All ({alerts.length})</button
				>
				{#each alertTypes as type (type)}
					<button
						class="chip"
						class:active={filterType === type}
						onclick={() => (filterType = filterType === type ? null : type)}
					>
						{typeLabel(type)} ({alerts.filter((a) => a.type === type).length})
					</button>
				{/each}
			</div>
		{/if}
		<div class="alert-list">
			{#each filteredAlerts as alert (alert.id)}
				<div class="alert-card" style="border-left: 3px solid {safetyAlertColor(alert.severity)}">
					<div class="alert-header">
						<span class="type-badge" style="background: {safetyAlertColor(alert.severity)}">
							{typeIcon(alert.type)}
						</span>
						<span class="severity-label" style="color: {safetyAlertColor(alert.severity)}">
							{alert.severity.toUpperCase()}
						</span>
						<span class="type-label">{typeLabel(alert.type)}</span>
						<span class="alert-time">{timeAgo(alert.issued)}</span>
					</div>
					<div class="alert-title">{alert.title}</div>
					{#if alert.description}
						<div class="alert-desc">{alert.description}</div>
					{/if}
					<div class="alert-footer">
						<span class="source-agency">{alert.sourceAgency}</span>
						{#if isValidHttpUrl(alert.url)}
							<a href={alert.url} target="_blank" rel="noopener noreferrer" class="more-link">
								More info
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.safety {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.all-clear {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		gap: 4px;
	}

	.check-icon {
		font-size: 2rem;
		color: var(--accent-secondary);
		line-height: 1;
	}

	.clear-text {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--accent-secondary);
	}

	.clear-sub {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.filter-chips {
		display: flex;
		gap: 4px;
		padding-bottom: 6px;
		flex-wrap: wrap;
	}

	.chip {
		padding: 2px 8px;
		font-size: 0.625rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.chip.active {
		background: var(--accent-primary);
		color: var(--text-inverse);
		border-color: var(--accent-primary);
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
		padding-left: 10px;
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

	.type-badge {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5625rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.severity-label {
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.type-label {
		font-size: 0.6875rem;
		color: var(--text-secondary);
	}

	.alert-time {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		margin-left: auto;
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
	}

	.source-agency {
		color: var(--text-tertiary);
		font-style: italic;
	}

	.more-link {
		color: var(--accent-primary);
		text-decoration: none;
		font-weight: 500;
	}

	.more-link:hover {
		text-decoration: underline;
	}
</style>
