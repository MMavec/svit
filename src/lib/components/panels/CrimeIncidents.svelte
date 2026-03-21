<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchCrimeIncidents } from '$lib/api/crime';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { refreshStore, REFRESH_INTERVALS } from '$lib/stores/refresh.svelte';
	import type { CrimeIncident } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { crimeTypeColor, crimeSeverityColor } from '$lib/utils/color-maps';

	let incidents = $state<CrimeIncident[]>([]);
	let hourlyDistribution = $state<number[]>(new Array(24).fill(0));
	let typeCounts = $state<Record<string, number>>({});
	let loading = $state(true);
	let error = $state<string | null>(null);
	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	// UI state
	let filterType = $state<string | null>(null);
	let showClock = $state(true);

	async function loadIncidents() {
		loading = true;
		error = null;
		const result = await fetchCrimeIncidents({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			incidents = result.data || [];
			// Use server-computed distributions if available
			const meta = result.meta as Record<string, unknown> | undefined;
			if (meta?.hourlyDistribution) {
				hourlyDistribution = meta.hourlyDistribution as number[];
			}
			if (meta?.typeCounts) {
				typeCounts = meta.typeCounts as Record<string, number>;
			}
		}
		loading = false;
	}

	function startRefreshTimer() {
		stopRefreshTimer();
		if (refreshStore.enabled) {
			refreshTimer = setInterval(loadIncidents, REFRESH_INTERVALS['crime-incidents']);
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
		loadIncidents();
	});

	$effect(() => {
		const _enabled = refreshStore.enabled;
		startRefreshTimer();
	});

	const filteredIncidents = $derived(
		filterType ? incidents.filter((i) => i.type === filterType) : incidents
	);

	const activeTypes = $derived([...new Set(incidents.map((i) => i.type))]);

	const maxHourly = $derived(Math.max(...hourlyDistribution, 1));

	// Build SVG 24h clock paths
	const clockSegments = $derived.by(() => {
		const cx = 50;
		const cy = 50;
		const r = 40;
		const innerR = 18;
		const segments: { path: string; hour: number; count: number; intensity: number }[] = [];

		for (let h = 0; h < 24; h++) {
			const count = hourlyDistribution[h];
			const intensity = count / maxHourly;
			// Each segment spans 15 degrees (360/24)
			const startAngle = (h * 15 - 90) * (Math.PI / 180);
			const endAngle = ((h + 1) * 15 - 90) * (Math.PI / 180);

			const x1 = cx + innerR * Math.cos(startAngle);
			const y1 = cy + innerR * Math.sin(startAngle);
			const x2 = cx + r * Math.cos(startAngle);
			const y2 = cy + r * Math.sin(startAngle);
			const x3 = cx + r * Math.cos(endAngle);
			const y3 = cy + r * Math.sin(endAngle);
			const x4 = cx + innerR * Math.cos(endAngle);
			const y4 = cy + innerR * Math.sin(endAngle);

			const path = `M ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`;
			segments.push({ path, hour: h, count, intensity });
		}

		return segments;
	});

	// Category breakdown as percentage bars
	const typeBreakdown = $derived.by(() => {
		const total = incidents.length || 1;
		return Object.entries(typeCounts)
			.sort(([, a], [, b]) => b - a)
			.map(([type, count]) => ({
				type: type as CrimeIncident['type'],
				count,
				percent: Math.round((count / total) * 100)
			}));
	});

	function typeLabel(type: CrimeIncident['type']): string {
		switch (type) {
			case 'property':
				return 'Property';
			case 'person':
				return 'Person';
			case 'traffic':
				return 'Traffic';
			case 'drug':
				return 'Drug';
			case 'disorder':
				return 'Disorder';
			case 'fraud':
				return 'Fraud';
			default:
				return 'Other';
		}
	}

	function typeIcon(type: CrimeIncident['type']): string {
		switch (type) {
			case 'property':
				return 'P';
			case 'person':
				return 'V';
			case 'traffic':
				return 'T';
			case 'drug':
				return 'D';
			case 'disorder':
				return 'X';
			case 'fraud':
				return 'F';
			default:
				return '?';
		}
	}

	function statusLabel(status: CrimeIncident['status']): string {
		switch (status) {
			case 'reported':
				return 'Reported';
			case 'under-investigation':
				return 'Investigating';
			case 'resolved':
				return 'Resolved';
			case 'cleared':
				return 'Cleared';
			default:
				return status;
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

	function formatHour(h: number): string {
		if (h === 0) return '12a';
		if (h === 12) return '12p';
		return h < 12 ? `${h}a` : `${h - 12}p`;
	}
</script>

<div class="crime">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadIncidents} />
	{:else if incidents.length === 0}
		<div class="all-clear" role="status">
			<div class="check-icon">&#10003;</div>
			<div class="clear-text">No recent incidents</div>
			<div class="clear-sub">The CRD is looking peaceful today.</div>
		</div>
	{:else}
		<!-- Visualizations: 24h clock + category breakdown -->
		<div class="viz-row">
			<!-- 24-Hour Clock -->
			{#if showClock}
				<div class="clock-container">
					<svg
						viewBox="0 0 100 100"
						class="clock-svg"
						role="img"
						aria-label="24-hour incident distribution clock"
					>
						<!-- Hour segments -->
						{#each clockSegments as seg (seg.hour)}
							<path
								d={seg.path}
								class="clock-segment"
								style="opacity: {0.08 + seg.intensity * 0.85}"
								role="presentation"
							>
								<title
									>{formatHour(seg.hour)}: {seg.count} incident{seg.count !== 1 ? 's' : ''}</title
								>
							</path>
						{/each}
						<!-- Hour markers -->
						{#each [0, 6, 12, 18] as h (h)}
							{@const angle = (h * 15 - 90) * (Math.PI / 180)}
							<text
								x={50 + 46 * Math.cos(angle)}
								y={50 + 46 * Math.sin(angle)}
								class="clock-label"
								text-anchor="middle"
								dominant-baseline="central"
							>
								{h === 0 ? '12a' : h === 6 ? '6a' : h === 12 ? '12p' : '6p'}
							</text>
						{/each}
						<!-- Center text -->
						<text
							x="50"
							y="47"
							class="clock-center"
							text-anchor="middle"
							dominant-baseline="central"
						>
							{incidents.length}
						</text>
						<text
							x="50"
							y="55"
							class="clock-center-sub"
							text-anchor="middle"
							dominant-baseline="central"
						>
							incidents
						</text>
					</svg>
				</div>
			{/if}

			<!-- Category Breakdown -->
			<div class="breakdown">
				<div class="breakdown-bar">
					{#each typeBreakdown as tb (tb.type)}
						<div
							class="bar-segment"
							style="width: {Math.max(tb.percent, 3)}%; background: {crimeTypeColor(tb.type)}"
							title="{typeLabel(tb.type)}: {tb.count} ({tb.percent}%)"
							role="presentation"
						></div>
					{/each}
				</div>
				<div class="breakdown-legend">
					{#each typeBreakdown as tb (tb.type)}
						<button
							class="legend-item"
							class:active={filterType === tb.type}
							onclick={() => (filterType = filterType === tb.type ? null : tb.type)}
						>
							<span class="legend-dot" style="background: {crimeTypeColor(tb.type)}"></span>
							<span class="legend-label">{typeLabel(tb.type)}</span>
							<span class="legend-count">{tb.count}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Filter chips (shown when multiple types) -->
		{#if activeTypes.length > 1}
			<div class="filter-chips">
				<button class="chip" class:active={filterType === null} onclick={() => (filterType = null)}>
					All ({incidents.length})
				</button>
				{#each activeTypes as type (type)}
					<button
						class="chip"
						class:active={filterType === type}
						style="--chip-color: {crimeTypeColor(type)}"
						onclick={() => (filterType = filterType === type ? null : type)}
					>
						{typeLabel(type)} ({incidents.filter((i) => i.type === type).length})
					</button>
				{/each}
			</div>
		{/if}

		<!-- Incident list -->
		<div class="incident-list">
			{#each filteredIncidents as incident (incident.id)}
				<div
					class="incident-card"
					style="border-left: 3px solid {crimeSeverityColor(incident.severity)}"
				>
					<div class="incident-header">
						<span class="type-badge" style="background: {crimeTypeColor(incident.type)}">
							{typeIcon(incident.type)}
						</span>
						<span class="severity-label" style="color: {crimeSeverityColor(incident.severity)}">
							{incident.severity.toUpperCase()}
						</span>
						<span class="type-label">{typeLabel(incident.type)}</span>
						<span class="incident-time">{timeAgo(incident.reportedAt)}</span>
					</div>
					<div class="incident-title">{incident.title}</div>
					{#if incident.description}
						<div class="incident-desc">{incident.description}</div>
					{/if}
					<div class="incident-footer">
						<span class="source-agency">{incident.sourceAgency}</span>
						{#if incident.location}
							<span class="location">{incident.location}</span>
						{/if}
						<span
							class="status-badge"
							class:resolved={incident.status === 'resolved' || incident.status === 'cleared'}
						>
							{statusLabel(incident.status)}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.crime {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 6px;
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
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		text-align: center;
		max-width: 220px;
	}

	/* Visualization row */
	.viz-row {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		padding-bottom: 4px;
	}

	/* 24-hour clock */
	.clock-container {
		width: 90px;
		height: 90px;
		flex-shrink: 0;
	}

	.clock-svg {
		width: 100%;
		height: 100%;
	}

	.clock-segment {
		fill: var(--status-critical);
		stroke: var(--bg-surface);
		stroke-width: 0.5;
		transition: opacity 0.3s;
	}

	.clock-segment:hover {
		filter: brightness(1.3);
	}

	.clock-label {
		font-size: 4.5px;
		fill: var(--text-tertiary);
		font-weight: 500;
	}

	.clock-center {
		font-size: 10px;
		font-weight: 700;
		fill: var(--text-primary);
	}

	.clock-center-sub {
		font-size: 4px;
		fill: var(--text-tertiary);
		font-weight: 400;
	}

	/* Category breakdown */
	.breakdown {
		flex: 1;
		min-width: 0;
	}

	.breakdown-bar {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		gap: 1px;
		margin-bottom: 6px;
	}

	.bar-segment {
		height: 100%;
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.breakdown-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 6px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 3px;
		font-size: 0.6875rem;
		color: var(--text-secondary);
		background: none;
		border: none;
		padding: 1px 3px;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.15s;
	}

	.legend-item:hover {
		background: var(--bg-surface-hover);
	}

	.legend-item.active {
		background: var(--bg-surface-elevated);
		font-weight: 600;
	}

	.legend-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-label {
		white-space: nowrap;
	}

	.legend-count {
		color: var(--text-tertiary);
		font-size: 0.625rem;
	}

	/* Filter chips */
	.filter-chips {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.chip {
		padding: 2px 8px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.chip.active {
		background: var(--chip-color, var(--accent-primary));
		color: var(--text-inverse);
		border-color: var(--chip-color, var(--accent-primary));
	}

	/* Incident list */
	.incident-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.incident-card {
		padding: 8px;
		padding-left: 10px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.incident-card:hover {
		background: var(--bg-surface-elevated);
	}

	.incident-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.type-badge {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6875rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.severity-label {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.type-label {
		font-size: 0.6875rem;
		color: var(--text-secondary);
	}

	.incident-time {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin-left: auto;
	}

	.incident-title {
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

	.incident-desc {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-top: 2px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.incident-footer {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
		font-size: 0.75rem;
	}

	.source-agency {
		color: var(--text-tertiary);
		font-style: italic;
	}

	.location {
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 120px;
	}

	.status-badge {
		margin-left: auto;
		padding: 1px 6px;
		border-radius: 8px;
		font-size: 0.6875rem;
		font-weight: 500;
		background: var(--bg-surface-elevated);
		color: var(--text-secondary);
	}

	.status-badge.resolved {
		color: var(--accent-secondary);
	}
</style>
