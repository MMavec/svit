<script lang="ts">
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { Bylaw } from '$lib/types/index';

	// Seed data — bylaws will come from council meeting agenda parsing
	const seedBylaws: Bylaw[] = [
		{
			id: 'vic-bylaw-1',
			number: '24-087',
			title: 'Zoning Regulation Bylaw Amendment (Missing Middle Housing)',
			description: 'Allows multiplex housing in all residential zones',
			status: 'public-hearing',
			municipality: 'victoria',
			introducedDate: '2026-01-15',
			lastActionDate: '2026-02-28',
			type: 'zoning',
			source: 'victoria-escribemeetings'
		},
		{
			id: 'vic-bylaw-2',
			number: '24-092',
			title: 'Short-Term Rental Regulation Bylaw',
			description: 'New licensing requirements for Airbnb and VRBO operators',
			status: 'second-reading',
			municipality: 'victoria',
			introducedDate: '2026-02-01',
			lastActionDate: '2026-02-20',
			type: 'regulatory',
			source: 'victoria-escribemeetings'
		},
		{
			id: 'vic-bylaw-3',
			number: '24-078',
			title: 'Tax Rate Bylaw 2026',
			description: 'Annual property tax rates for fiscal year 2026',
			status: 'adopted',
			municipality: 'victoria',
			introducedDate: '2025-12-10',
			lastActionDate: '2026-01-30',
			type: 'tax',
			source: 'victoria-escribemeetings'
		},
		{
			id: 'san-bylaw-1',
			number: 'S-2026-003',
			title: 'Official Community Plan Amendment (Shelbourne Valley)',
			description: 'Designates Shelbourne Valley corridor as a growth area',
			status: 'first-reading',
			municipality: 'saanich',
			introducedDate: '2026-02-10',
			type: 'zoning',
			source: 'saanich-civicweb'
		},
		{
			id: 'esq-bylaw-1',
			number: 'E-2026-01',
			title: 'Parking Regulation Bylaw Update',
			description: 'Reduces minimum parking requirements for new developments near transit',
			status: 'proposed',
			municipality: 'esquimalt',
			introducedDate: '2026-02-25',
			type: 'regulatory',
			source: 'esquimalt-legistar'
		},
		{
			id: 'lan-bylaw-1',
			number: 'L-2026-007',
			title: 'Affordable Housing Reserve Fund Bylaw',
			description:
				'Establishes dedicated fund for affordable housing from development cost charges',
			status: 'third-reading',
			municipality: 'langford',
			introducedDate: '2026-01-20',
			lastActionDate: '2026-02-18',
			type: 'regulatory',
			source: 'langford-escribemeetings'
		}
	];

	const statusOrder: Bylaw['status'][] = [
		'proposed',
		'first-reading',
		'second-reading',
		'public-hearing',
		'third-reading',
		'adopted',
		'defeated',
		'withdrawn'
	];

	const statusLabels: Record<Bylaw['status'], string> = {
		proposed: 'Proposed',
		'first-reading': '1st Reading',
		'second-reading': '2nd Reading',
		'public-hearing': 'Public Hearing',
		'third-reading': '3rd Reading',
		adopted: 'Adopted',
		defeated: 'Defeated',
		withdrawn: 'Withdrawn'
	};

	const statusColors: Record<Bylaw['status'], string> = {
		proposed: 'var(--text-tertiary)',
		'first-reading': 'var(--accent-info)',
		'second-reading': 'var(--accent-primary)',
		'public-hearing': 'var(--accent-warning)',
		'third-reading': 'var(--accent-secondary)',
		adopted: 'var(--palette-green)',
		defeated: 'var(--accent-danger)',
		withdrawn: 'var(--text-tertiary)'
	};

	const filteredBylaws = $derived(
		municipalityStore.isAllCRD
			? seedBylaws
			: seedBylaws.filter((b) => b.municipality === municipalityStore.slug)
	);

	// Group by active pipeline vs completed
	const activeBylaws = $derived(
		filteredBylaws
			.filter((b) => !['adopted', 'defeated', 'withdrawn'].includes(b.status))
			.sort((a, b) => statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status))
	);

	const completedBylaws = $derived(
		filteredBylaws.filter((b) => ['adopted', 'defeated', 'withdrawn'].includes(b.status))
	);

	function pipelineProgress(status: Bylaw['status']): number {
		const activeStatuses = statusOrder.slice(0, 5); // proposed through third-reading
		const idx = activeStatuses.indexOf(status);
		return idx >= 0 ? ((idx + 1) / activeStatuses.length) * 100 : 100;
	}
</script>

<div class="bylaw-tracker">
	<div class="section-label">Active Pipeline</div>
	<div class="bylaw-list">
		{#each activeBylaws as bylaw (bylaw.id)}
			<div class="bylaw-item">
				<div class="bylaw-header">
					{#if bylaw.number}
						<span class="bylaw-number">{bylaw.number}</span>
					{/if}
					<span class="bylaw-title">{bylaw.title}</span>
				</div>
				<div class="pipeline-bar">
					<div
						class="pipeline-fill"
						style="width: {pipelineProgress(bylaw.status)}%; background: {statusColors[
							bylaw.status
						]}"
					></div>
				</div>
				<div class="bylaw-meta">
					<span
						class="status-badge"
						style="color: {statusColors[bylaw.status]}; border-color: {statusColors[bylaw.status]}"
					>
						{statusLabels[bylaw.status]}
					</span>
					{#if bylaw.type}
						<span class="bylaw-type">{bylaw.type}</span>
					{/if}
					{#if bylaw.lastActionDate}
						<span class="bylaw-date"
							>{new Date(bylaw.lastActionDate).toLocaleDateString('en-CA', {
								month: 'short',
								day: 'numeric'
							})}</span
						>
					{/if}
				</div>
			</div>
		{:else}
			<div class="empty" role="status">No active bylaws</div>
		{/each}
	</div>

	{#if completedBylaws.length > 0}
		<div class="section-label">Recently Completed</div>
		<div class="bylaw-list completed">
			{#each completedBylaws as bylaw (bylaw.id)}
				<div class="bylaw-item compact">
					<span class="bylaw-title">{bylaw.number ? `${bylaw.number}: ` : ''}{bylaw.title}</span>
					<span
						class="status-badge"
						style="color: {statusColors[bylaw.status]}; border-color: {statusColors[bylaw.status]}"
					>
						{statusLabels[bylaw.status]}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.bylaw-tracker {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
		overflow-y: auto;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-tertiary);
	}

	.bylaw-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.bylaw-item {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.bylaw-item.compact {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 6px 8px;
	}

	.bylaw-header {
		display: flex;
		align-items: baseline;
		gap: 6px;
		margin-bottom: 4px;
	}

	.bylaw-number {
		font-family: 'Geist Mono', monospace;
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--accent-primary);
		white-space: nowrap;
	}

	.bylaw-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.compact .bylaw-title {
		font-size: 0.75rem;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		flex: 1;
	}

	.pipeline-bar {
		height: 3px;
		background: var(--border-primary);
		border-radius: 2px;
		overflow: hidden;
		margin: 4px 0;
	}

	.pipeline-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.5s ease;
	}

	.bylaw-meta {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 1px 6px;
		border: 1px solid;
		border-radius: 4px;
		white-space: nowrap;
	}

	.bylaw-type {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		text-transform: capitalize;
	}

	.bylaw-date {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		margin-left: auto;
	}

	.empty {
		text-align: center;
		color: var(--text-tertiary);
		font-style: italic;
		font-size: 0.8125rem;
		padding: 16px;
	}
</style>
