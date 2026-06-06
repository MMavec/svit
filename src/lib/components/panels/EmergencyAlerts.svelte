<script lang="ts">
	import { fetchEmergencyAlerts } from '$lib/api/emergency-alerts';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { EmergencyAlert } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { emergencySeverityColor } from '$lib/utils/color-maps';

	let alerts = $state<EmergencyAlert[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let note = $state<string | null>(null);

	const CATEGORY_LABELS: Record<EmergencyAlert['category'], string> = {
		evacuation: 'Evacuation',
		marine: 'Marine',
		flood: 'Flood',
		other: 'Alert'
	};

	async function load() {
		loading = true;
		error = null;
		const result = await fetchEmergencyAlerts();
		if (result.error) error = result.error;
		else {
			alerts = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			note = (meta?.note as string) || null;
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		load();
	});

	function timeAgo(iso?: string): string {
		if (!iso) return '';
		const then = new Date(iso).getTime();
		if (isNaN(then)) return '';
		const days = Math.round((Date.now() - then) / 86400000);
		if (days < 1) return 'today';
		if (days === 1) return 'yesterday';
		return `${days}d ago`;
	}
</script>

<div class="tile">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else if alerts.length === 0}
		<div class="all-clear" role="status">
			<span class="check" aria-hidden="true">&#10003;</span>
			<div class="clear-text">
				{note || 'No active evacuation or marine warnings for the region.'}
			</div>
		</div>
	{:else}
		<div class="list">
			{#each alerts as a (a.id)}
				<div class="item" style="--c: {emergencySeverityColor(a.severity)}">
					<div class="head">
						<span class="status" style="background: {emergencySeverityColor(a.severity)}">
							{a.status}
						</span>
						<span class="cat">{CATEGORY_LABELS[a.category]}</span>
						{#if a.updated}<span class="upd">{timeAgo(a.updated)}</span>{/if}
					</div>
					<div class="title">{a.title}</div>
					<div class="meta">
						{#if a.area}<span class="bit">{a.area}</span>{/if}
						{#if a.agency}<span class="bit">· {a.agency}</span>{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}
	.all-clear {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex: 1;
		text-align: center;
		padding: 16px;
	}
	.check {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent-secondary) 18%, transparent);
		color: var(--accent-secondary);
		font-size: 1.25rem;
		font-weight: 800;
	}
	.clear-text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.4;
		max-width: 250px;
	}
	.list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		flex: 1;
	}
	.item {
		position: relative;
		padding: 9px 2px 10px 15px;
		border-bottom: 1px solid var(--border-primary);
	}
	.item::before {
		content: '';
		position: absolute;
		left: 2px;
		top: 14px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--c);
	}
	.item:last-child {
		border-bottom: none;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
	}
	.status {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 1px 6px;
		border-radius: 8px;
		color: #fff;
	}
	.cat {
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}
	.upd {
		margin-left: auto;
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-family: var(--font-mono, monospace);
	}
	.title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 2px;
	}
	.bit {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}
</style>
