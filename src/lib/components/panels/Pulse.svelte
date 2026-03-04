<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { line, curveBasis, scaleLinear } from 'd3';
	import { fetchMeetings } from '$lib/api/council';
	import { fetchDevelopments } from '$lib/api/development';
	import { fetchNews } from '$lib/api/news';
	import { fetchSocialPosts } from '$lib/api/social';
	import { fetchConstruction } from '$lib/api/construction';
	import { fetchTransitAlerts } from '$lib/api/transit';
	import { fetchSafetyAlerts } from '$lib/api/safety';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	interface Metric {
		id: string;
		icon: string;
		label: string;
		count: number;
		sparkline: number[];
		color: string;
	}

	let metrics = $state<Metric[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let totalActivity = $derived(metrics.reduce((sum, m) => sum + m.count, 0));

	async function loadMetrics() {
		loading = true;
		error = null;
		const slug = municipalityStore.slug;

		const [council, dev, news, social, construction, transit, safety] = await Promise.allSettled([
			fetchMeetings({ municipality: slug, limit: 100 }),
			fetchDevelopments({ municipality: slug, limit: 100 }),
			fetchNews({ municipality: slug, limit: 100 }),
			fetchSocialPosts({ municipality: slug, limit: 100 }),
			fetchConstruction({ municipality: slug, limit: 100 }),
			fetchTransitAlerts({ limit: 50 }),
			fetchSafetyAlerts({ municipality: slug, limit: 50 })
		]);

		const results = [council, dev, news, social, construction, transit, safety];
		const allFailed = results.every((r) => r.status === 'rejected');
		if (allFailed) {
			error = 'Unable to load activity data';
			loading = false;
			return;
		}

		const councilData = council.status === 'fulfilled' ? council.value.data || [] : [];
		const devData = dev.status === 'fulfilled' ? dev.value.data || [] : [];
		const newsData = news.status === 'fulfilled' ? news.value.data || [] : [];
		const socialData = social.status === 'fulfilled' ? social.value.data || [] : [];
		const conData = construction.status === 'fulfilled' ? construction.value.data || [] : [];
		const transitData = transit.status === 'fulfilled' ? transit.value.data || [] : [];
		const safetyData = safety.status === 'fulfilled' ? safety.value.data || [] : [];

		metrics = [
			{
				id: 'council',
				icon: '\u{1F3DB}',
				label: 'Council',
				count: councilData.length,
				sparkline: buildSparkline(councilData, (m: { date?: string }) => m.date),
				color: 'var(--accent-primary)'
			},
			{
				id: 'development',
				icon: '\u{1F3D7}',
				label: 'Development',
				count: devData.length,
				sparkline: buildSparkline(devData, (d: { submittedDate?: string }) => d.submittedDate),
				color: 'var(--accent-danger)'
			},
			{
				id: 'news',
				icon: '\u{1F4F0}',
				label: 'News',
				count: newsData.length,
				sparkline: buildSparkline(newsData, (n: { published?: string }) => n.published),
				color: 'var(--accent-warning)'
			},
			{
				id: 'social',
				icon: '\u{1F4AC}',
				label: 'Social',
				count: socialData.length,
				sparkline: buildSparkline(socialData, (s: { published?: string }) => s.published),
				color: 'var(--palette-lilac)'
			},
			{
				id: 'construction',
				icon: '\u{1F6A7}',
				label: 'Roads',
				count: conData.length,
				sparkline: buildSparkline(conData, (c: { updated?: string }) => c.updated),
				color: 'var(--accent-warning)'
			},
			{
				id: 'transit',
				icon: '\u{1F68C}',
				label: 'Transit',
				count: transitData.length,
				sparkline: [transitData.length],
				color: 'var(--accent-secondary)'
			},
			{
				id: 'safety',
				icon: '\u{1F6A8}',
				label: 'Safety',
				count: safetyData.length,
				sparkline: [safetyData.length],
				color: 'var(--status-critical)'
			}
		];

		loading = false;
	}

	/** Build a 7-bucket sparkline from timestamped items */
	function buildSparkline<T>(items: T[], getDate: (item: T) => string | undefined): number[] {
		const now = Date.now();
		const buckets = new Array(7).fill(0);
		const dayMs = 24 * 60 * 60 * 1000;

		for (const item of items) {
			const dateStr = getDate(item);
			if (!dateStr) continue;
			const diff = now - new Date(dateStr).getTime();
			const bucket = Math.floor(diff / dayMs);
			if (bucket >= 0 && bucket < 7) {
				buckets[6 - bucket]++;
			}
		}

		return buckets;
	}

	/** Generate SVG path for a sparkline */
	function sparklinePath(data: number[], width: number, height: number): string {
		if (data.length < 2) return '';
		const x = scaleLinear()
			.domain([0, data.length - 1])
			.range([0, width]);
		const maxVal = Math.max(...data, 1);
		const y = scaleLinear()
			.domain([0, maxVal])
			.range([height - 2, 2]);
		const l = line<number>()
			.x((_, i) => x(i))
			.y((d) => y(d))
			.curve(curveBasis);
		return l(data) || '';
	}

	/** Pre-computed sparkline SVG paths keyed by metric ID */
	const sparklinePaths = $derived(
		Object.fromEntries(
			metrics
				.filter((m) => m.sparkline.length >= 2)
				.map((m) => [m.id, sparklinePath(m.sparkline, 100, 28)])
		)
	);

	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	function startRefreshTimer() {
		if (refreshTimer) clearInterval(refreshTimer);
		refreshTimer = setInterval(loadMetrics, 5 * 60 * 1000);
	}

	onDestroy(() => {
		if (refreshTimer) clearInterval(refreshTimer);
	});

	onMount(() => {
		startRefreshTimer();
	});

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadMetrics();
	});
</script>

<div class="pulse">
	{#if loading}
		<PanelSkeleton variant="chart" />
	{:else if error}
		<PanelError message={error} onRetry={loadMetrics} />
	{:else}
		<div class="pulse-header">
			<span class="total-count">{totalActivity}</span>
			<span class="total-label">active items</span>
		</div>
		<div class="metric-list">
			{#each metrics as metric (metric.id)}
				<div class="metric-row">
					<span class="metric-icon">{metric.icon}</span>
					<span class="metric-label">{metric.label}</span>
					<div class="sparkline-container">
						{#if sparklinePaths[metric.id]}
							<svg
								width="100"
								height="28"
								viewBox="0 0 100 28"
								class="sparkline"
								role="img"
								aria-label="{metric.label} trend over 7 days"
							>
								<path
									d={sparklinePaths[metric.id]}
									fill="none"
									stroke={metric.color}
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
						{/if}
					</div>
					<span class="metric-count" style="color: {metric.color}">
						{metric.count}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.pulse {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
	}

	.pulse-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border-primary);
	}

	.total-count {
		font-size: 2.5rem;
		font-weight: 700;
		font-family: 'Geist Mono', monospace;
		color: var(--text-primary);
		line-height: 1;
	}

	.total-label {
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}

	.metric-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		overflow-y: auto;
	}

	.metric-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 8px;
		border-radius: 6px;
		transition: background 0.15s;
	}

	.metric-row:hover {
		background: var(--bg-surface-hover);
	}

	.metric-icon {
		font-size: 1.25rem;
		width: 28px;
		text-align: center;
		flex-shrink: 0;
	}

	.metric-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		width: 90px;
		flex-shrink: 0;
	}

	.sparkline-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.sparkline {
		display: block;
	}

	.metric-count {
		font-size: 1.125rem;
		font-weight: 700;
		font-family: 'Geist Mono', monospace;
		width: 40px;
		text-align: right;
		flex-shrink: 0;
	}
</style>
