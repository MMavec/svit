<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchDevelopments } from '$lib/api/development';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { DevelopmentApplication } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import BookmarkButton from '$lib/components/ui/BookmarkButton.svelte';

	let applications = $state<DevelopmentApplication[]>([]);
	let loading = $state(true);
	let showFlaggedOnly = $state(false);

	async function loadDevelopments() {
		loading = true;
		const result = await fetchDevelopments({
			municipality: municipalityStore.slug,
			flagged: showFlaggedOnly || undefined
		});
		applications = result.data || [];
		loading = false;
	}

	onMount(() => {
		loadDevelopments();
	});

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadDevelopments();
	});

	const flaggedCount = $derived(applications.filter((a) => a.flagged).length);

	const displayed = $derived(
		showFlaggedOnly ? applications.filter((a) => a.flagged) : applications
	);

	function statusColor(status: DevelopmentApplication['status']): string {
		switch (status) {
			case 'proposed':
				return 'var(--accent-info)';
			case 'under-review':
				return 'var(--accent-warning)';
			case 'approved':
				return 'var(--accent-secondary)';
			case 'under-construction':
				return '#dd6b20';
			case 'complete':
				return '#38a169';
			case 'denied':
				return 'var(--accent-danger)';
			case 'withdrawn':
				return 'var(--text-tertiary)';
			default:
				return 'var(--text-tertiary)';
		}
	}

	function typeIcon(type: DevelopmentApplication['type']): string {
		switch (type) {
			case 'residential':
				return 'R';
			case 'commercial':
				return 'C';
			case 'mixed-use':
				return 'M';
			case 'institutional':
				return 'I';
			case 'industrial':
				return 'W';
			default:
				return '?';
		}
	}
</script>

<div class="dev-watch">
	<div class="dev-controls">
		<button
			class="flag-toggle"
			class:active={showFlaggedOnly}
			onclick={() => {
				showFlaggedOnly = !showFlaggedOnly;
			}}
		>
			Flagged Only
			{#if flaggedCount > 0}
				<span class="flag-count">{flaggedCount}</span>
			{/if}
		</button>
	</div>

	{#if loading}
		<PanelSkeleton variant="card" />
	{:else}
		<div class="dev-list">
			{#each displayed as app (app.id)}
				<div class="dev-item" class:flagged={app.flagged}>
					<div class="dev-header">
						<span class="type-badge" title={app.type}>{typeIcon(app.type)}</span>
						<span class="dev-address">{app.address}</span>
						{#if app.flagged}
							<span class="flag-badge" title={app.flagReasons?.join(', ')}>!</span>
						{/if}
						<BookmarkButton
							itemType="development"
							externalId={app.id}
							title={app.address}
							description={app.description}
							municipality={app.municipality}
						/>
					</div>

					<div class="dev-desc">{app.description}</div>

					<div class="dev-stats">
						{#if app.storeys}
							<span class="stat" class:stat-flagged={app.storeys >= 4}>
								{app.storeys} storeys
							</span>
						{/if}
						{#if app.units}
							<span class="stat" class:stat-flagged={app.units >= 100}>
								{app.units} units
							</span>
						{/if}
						<span
							class="status-pill"
							style="color: {statusColor(app.status)}; border-color: {statusColor(app.status)}"
						>
							{app.status.replace('-', ' ')}
						</span>
					</div>

					{#if app.flagReasons && app.flagReasons.length > 0}
						<div class="flag-reasons">
							{#each app.flagReasons as reason, i (i)}
								<span class="flag-reason">{reason}</span>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="empty">No development applications found</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.dev-watch {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.dev-controls {
		display: flex;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.flag-toggle {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 12px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--accent-danger);
		border-radius: 6px;
		background: transparent;
		color: var(--accent-danger);
		cursor: pointer;
		transition: all 0.2s;
	}

	.flag-toggle.active {
		background: var(--accent-danger);
		color: white;
	}

	.flag-count {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0 4px;
		border-radius: 8px;
		background: var(--accent-danger);
		color: white;
	}

	.flag-toggle.active .flag-count {
		background: rgba(255, 255, 255, 0.3);
	}

	.dev-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.dev-item {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border-left: 3px solid var(--border-primary);
	}

	.dev-item.flagged {
		border-left-color: var(--accent-danger);
		background: var(--bg-surface-hover);
	}

	.dev-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.type-badge {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: 700;
		border-radius: 4px;
		background: var(--accent-primary);
		color: var(--text-inverse);
	}

	.dev-address {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.flag-badge {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 900;
		border-radius: 50%;
		background: var(--accent-danger);
		color: white;
	}

	.dev-desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: 4px;
	}

	.dev-stats {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.stat {
		font-family: 'Geist Mono', monospace;
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.stat-flagged {
		color: var(--accent-danger);
		font-weight: 700;
	}

	.status-pill {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 1px 6px;
		border: 1px solid;
		border-radius: 4px;
		text-transform: capitalize;
		margin-left: auto;
	}

	.flag-reasons {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 4px;
	}

	.flag-reason {
		font-size: 0.625rem;
		padding: 1px 6px;
		border-radius: 4px;
		background: rgba(197, 48, 48, 0.15);
		color: var(--accent-danger);
		font-weight: 500;
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
