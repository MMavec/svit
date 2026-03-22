<script lang="ts">
	import { fetchWeatherTides } from '$lib/api/weather-tides';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { WeatherTidesData } from '$lib/types/index';
	import { line, area, curveNatural, scaleLinear, scaleTime } from 'd3';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let data = $state<WeatherTidesData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Chart dimensions
	const chartWidth = 400;
	const chartHeight = 130;
	const margin = { top: 16, right: 8, bottom: 22, left: 30 };
	const innerWidth = chartWidth - margin.left - margin.right;
	const innerHeight = chartHeight - margin.top - margin.bottom;

	interface TidePoint {
		time: Date;
		height: number;
		type?: 'high' | 'low' | 'current';
	}

	/** Build a sorted array of tide points from current observation + predictions */
	function buildTidePoints(tideData: WeatherTidesData['tides']): TidePoint[] {
		const points: TidePoint[] = [];

		if (tideData.current) {
			points.push({
				time: new Date(tideData.current.time),
				height: tideData.current.height,
				type: 'current'
			});
		}

		for (const pred of tideData.predictions) {
			points.push({
				time: new Date(pred.time),
				height: pred.height,
				type: pred.type
			});
		}

		points.sort((a, b) => a.time.getTime() - b.time.getTime());
		return points;
	}

	/** Compute D3 scales, paths, and label data for the tide chart */
	let tideChart = $derived.by(() => {
		if (!data || data.tides.predictions.length === 0) return null;

		const points = buildTidePoints(data.tides);
		if (points.length < 2) return null;

		const timeExtent = [points[0].time, points[points.length - 1].time] as [Date, Date];
		const heights = points.map((p) => p.height);
		const minH = Math.min(...heights);
		const maxH = Math.max(...heights);
		const hPad = (maxH - minH) * 0.15 || 0.3;

		const xScale = scaleTime().domain(timeExtent).range([0, innerWidth]);
		const yScale = scaleLinear()
			.domain([minH - hPad, maxH + hPad])
			.range([innerHeight, 0]);

		const linePath = line<TidePoint>()
			.x((d) => xScale(d.time))
			.y((d) => yScale(d.height))
			.curve(curveNatural)(points);

		const areaPath = area<TidePoint>()
			.x((d) => xScale(d.time))
			.y0(innerHeight)
			.y1((d) => yScale(d.height))
			.curve(curveNatural)(points);

		// High/low labels
		const labels = points
			.filter((p) => p.type === 'high' || p.type === 'low')
			.map((p) => ({
				x: xScale(p.time),
				y: yScale(p.height),
				height: p.height,
				type: p.type as 'high' | 'low',
				timeLabel: formatTimeShort(p.time)
			}));

		// Current time marker
		const now = new Date();
		let nowX: number | null = null;
		if (now >= timeExtent[0] && now <= timeExtent[1]) {
			nowX = xScale(now);
		}

		// Time axis ticks (every ~6 hours)
		const totalMs = timeExtent[1].getTime() - timeExtent[0].getTime();
		const tickCount = Math.max(2, Math.min(6, Math.floor(totalMs / (6 * 3600000)) + 1));
		const timeTicks = xScale.ticks(tickCount).map((t) => ({
			x: xScale(t),
			label: formatTimeShort(t)
		}));

		// Height axis ticks
		const heightTicks = yScale.ticks(4).map((h) => ({
			y: yScale(h),
			label: `${h.toFixed(1)}m`
		}));

		return { linePath, areaPath, labels, nowX, timeTicks, heightTicks };
	});

	function formatTimeShort(d: Date): string {
		try {
			return d.toLocaleTimeString('en-CA', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
				timeZone: 'America/Vancouver'
			});
		} catch {
			return '';
		}
	}

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchWeatherTides();
		if (result.error) {
			error = result.error;
		} else {
			data = result.data || null;
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function formatTemp(temp: number): string {
		return `${Math.round(temp)}°`;
	}

	function formatTime(iso: string): string {
		try {
			return new Date(iso).toLocaleTimeString('en-CA', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
				timeZone: 'America/Vancouver'
			});
		} catch {
			return '';
		}
	}

	function tideDirection(current: number, predictions: { height: number; type: string }[]): string {
		if (predictions.length === 0) return '';
		return predictions[0].type === 'high' ? 'rising' : 'falling';
	}

	function pressureArrow(trend?: string): string {
		if (!trend) return '';
		if (trend === 'rising') return '\u2191';
		if (trend === 'falling') return '\u2193';
		return '\u2192';
	}

	function weatherIcon(code: string): string {
		const icons: Record<string, string> = {
			'00': '\u2600\uFE0F',
			'01': '\u2600\uFE0F',
			'02': '\u26C5',
			'03': '\u2601\uFE0F',
			'04': '\u2601\uFE0F',
			'05': '\u2601\uFE0F',
			'06': '\uD83C\uDF27\uFE0F',
			'07': '\uD83C\uDF27\uFE0F',
			'08': '\uD83C\uDF28\uFE0F',
			'09': '\u26C8\uFE0F',
			'10': '\u2601\uFE0F',
			'11': '\uD83C\uDF27\uFE0F',
			'12': '\uD83C\uDF27\uFE0F',
			'13': '\uD83C\uDF27\uFE0F',
			'14': '\uD83C\uDF28\uFE0F',
			'15': '\uD83C\uDF28\uFE0F',
			'16': '\u2744\uFE0F',
			'17': '\u2744\uFE0F',
			'18': '\u2744\uFE0F',
			'19': '\u26C8\uFE0F',
			'23': '\uD83C\uDF2B\uFE0F',
			'24': '\uD83C\uDF2B\uFE0F',
			'25': '\uD83C\uDF2A\uFE0F',
			'26': '\uD83C\uDF26\uFE0F',
			'27': '\uD83C\uDF25\uFE0F',
			'28': '\uD83C\uDF26\uFE0F',
			'30': '\uD83C\uDF19',
			'31': '\uD83C\uDF19',
			'32': '\uD83C\uDF19',
			'33': '\u2601\uFE0F',
			'34': '\u2601\uFE0F',
			'35': '\u2601\uFE0F',
			'36': '\uD83C\uDF27\uFE0F',
			'37': '\uD83C\uDF28\uFE0F',
			'38': '\uD83C\uDF27\uFE0F',
			'39': '\u26C8\uFE0F'
		};
		return icons[code] || '\u2601\uFE0F';
	}
</script>

<div class="weather-tides">
	{#if loading}
		<PanelSkeleton variant="hero" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if !data}
		<div class="loading">Unable to load data</div>
	{:else}
		<!-- Current Conditions -->
		{#if data.weather.current}
			<div class="current-weather">
				<div class="current-main">
					<span class="weather-emoji">{weatherIcon(data.weather.current.iconCode)}</span>
					<span class="current-temp">{formatTemp(data.weather.current.temperature)}</span>
					<span class="current-condition">{data.weather.current.condition}</span>
				</div>
				<div class="current-details">
					<span class="detail" title="Wind">
						{data.weather.current.windDirection}
						{data.weather.current.windSpeed} km/h
						{#if data.weather.current.windGust}
							(G{data.weather.current.windGust})
						{/if}
					</span>
					<span class="detail" title="Humidity">
						{data.weather.current.humidity}%
					</span>
					<span class="detail" title="Pressure">
						{pressureArrow(data.weather.current.pressureTrend)}
						{data.weather.current.pressure} hPa
					</span>
				</div>
			</div>
		{/if}

		<!-- Forecast Strip -->
		{#if data.weather.forecast.length > 0}
			<div class="forecast-strip">
				{#each data.weather.forecast.slice(0, 4) as fc (fc.period)}
					<div class="forecast-item" title={fc.summary}>
						<div class="fc-period">{fc.period}</div>
						<div class="fc-icon">{weatherIcon(fc.iconCode)}</div>
						<div class="fc-temp">
							{formatTemp(fc.temperature)}
						</div>
						<div class="fc-condition">{fc.condition}</div>
						{#if fc.pop}
							<div class="fc-pop">{fc.pop}%</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Tides -->
		<div class="tides-section">
			<div class="tides-header">
				<span class="tides-label">Tides</span>
				<span class="tides-station">{data.tides.station}</span>
			</div>

			{#if data.tides.current}
				<div class="tide-current">
					<span class="tide-now-label">Now</span>
					<span class="tide-now-value">{data.tides.current.height.toFixed(1)}m</span>
					<span class="tide-direction"
						>{tideDirection(data.tides.current.height, data.tides.predictions)}</span
					>
				</div>
			{/if}

			{#if data.tides.predictions.length > 0}
				<div class="tide-list">
					{#each data.tides.predictions.slice(0, 4) as pred (pred.time)}
						<div class="tide-row">
							<span
								class="tide-type"
								class:tide-high={pred.type === 'high'}
								class:tide-low={pred.type === 'low'}
							>
								{pred.type === 'high' ? '\u25B2' : '\u25BC'}
								{pred.type === 'high' ? 'High' : 'Low'}
							</span>
							<span class="tide-time">{formatTime(pred.time)}</span>
							<span class="tide-height">{pred.height.toFixed(1)}m</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="no-tides">Tide data unavailable</div>
			{/if}

			<!-- Tide Graph -->
			{#if tideChart}
				<div class="tide-graph">
					<svg
						viewBox="0 0 {chartWidth} {chartHeight}"
						preserveAspectRatio="xMidYMid meet"
						class="tide-svg"
					>
						<defs>
							<linearGradient id="tide-fill-gradient" x1="0" x2="0" y1="0" y2="1">
								<stop offset="0%" stop-color="var(--palette-cyan)" stop-opacity="0.35" />
								<stop offset="100%" stop-color="var(--palette-cyan)" stop-opacity="0.03" />
							</linearGradient>
						</defs>

						<g transform="translate({margin.left}, {margin.top})">
							<!-- Height axis grid lines -->
							{#each tideChart.heightTicks as tick}
								<line x1="0" x2={innerWidth} y1={tick.y} y2={tick.y} class="grid-line" />
								<text
									x="-4"
									y={tick.y}
									class="axis-label axis-label-y"
									text-anchor="end"
									dominant-baseline="middle"
								>
									{tick.label}
								</text>
							{/each}

							<!-- Filled area under the curve -->
							{#if tideChart.areaPath}
								<path d={tideChart.areaPath} class="tide-area" />
							{/if}

							<!-- Tide curve line -->
							{#if tideChart.linePath}
								<path d={tideChart.linePath} class="tide-line" />
							{/if}

							<!-- Current time marker -->
							{#if tideChart.nowX !== null}
								<line
									x1={tideChart.nowX}
									x2={tideChart.nowX}
									y1="0"
									y2={innerHeight}
									class="now-line"
								/>
							{/if}

							<!-- High/low point markers and labels -->
							{#each tideChart.labels as label}
								<circle
									cx={label.x}
									cy={label.y}
									r="3"
									class="tide-point"
									class:tide-point-high={label.type === 'high'}
									class:tide-point-low={label.type === 'low'}
								/>
								<text
									x={label.x}
									y={label.type === 'high' ? label.y - 7 : label.y + 12}
									class="tide-point-label"
									text-anchor="middle"
								>
									{label.height.toFixed(1)}m
								</text>
							{/each}

							<!-- Time axis labels -->
							{#each tideChart.timeTicks as tick}
								<text
									x={tick.x}
									y={innerHeight + 14}
									class="axis-label axis-label-x"
									text-anchor="middle"
								>
									{tick.label}
								</text>
							{/each}
						</g>
					</svg>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.weather-tides {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
	}

	/* Current Conditions */
	.current-weather {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.current-main {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.weather-emoji {
		font-size: 1.5rem;
		line-height: 1;
	}

	.current-temp {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		font-family: 'Geist Mono', monospace;
	}

	.current-condition {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		flex: 1;
	}

	.current-details {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.detail {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		font-family: 'Geist Mono', monospace;
	}

	/* Forecast Strip */
	.forecast-strip {
		display: flex;
		gap: 2px;
		overflow-x: auto;
	}

	.forecast-item {
		flex: 1;
		min-width: 0;
		padding: 6px 4px;
		border-radius: 6px;
		background: var(--bg-surface-hover);
		text-align: center;
		cursor: default;
	}

	.forecast-item:hover {
		background: var(--bg-surface-elevated);
	}

	.fc-period {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fc-icon {
		font-size: 1rem;
		line-height: 1.2;
		margin: 2px 0;
	}

	.fc-temp {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
	}

	.fc-condition {
		font-size: 0.5625rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fc-pop {
		font-size: 0.5625rem;
		color: var(--accent-primary);
		font-family: 'Geist Mono', monospace;
	}

	/* Tides */
	.tides-section {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.tides-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.tides-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.tides-station {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.tide-current {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border-primary);
	}

	.tide-now-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
	}

	.tide-now-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
	}

	.tide-direction {
		font-size: 0.6875rem;
		color: var(--accent-secondary);
		font-style: italic;
	}

	.tide-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1;
	}

	.tide-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 3px 0;
	}

	.tide-type {
		font-size: 0.6875rem;
		font-weight: 600;
		width: 52px;
	}

	.tide-high {
		color: var(--accent-primary);
	}

	.tide-low {
		color: var(--accent-warning);
	}

	.tide-time {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-family: 'Geist Mono', monospace;
		flex: 1;
	}

	.tide-height {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
	}

	.no-tides {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-style: italic;
		text-align: center;
		padding: 8px 0;
	}

	/* Tide Graph */
	.tide-graph {
		margin-top: 6px;
		border-top: 1px solid var(--border-primary);
		padding-top: 4px;
	}

	.tide-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.tide-svg .grid-line {
		stroke: var(--border-primary);
		stroke-width: 0.5;
		stroke-dasharray: 2 3;
	}

	.tide-svg .tide-area {
		fill: url(#tide-fill-gradient);
	}

	.tide-svg .tide-line {
		fill: none;
		stroke: var(--palette-cyan);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.tide-svg .now-line {
		stroke: var(--accent-primary);
		stroke-width: 1;
		stroke-dasharray: 4 3;
		opacity: 0.7;
	}

	.tide-svg .tide-point {
		stroke-width: 1.5;
	}

	.tide-svg .tide-point-high {
		fill: var(--accent-primary);
		stroke: var(--accent-primary);
	}

	.tide-svg .tide-point-low {
		fill: var(--accent-warning);
		stroke: var(--accent-warning);
	}

	.tide-svg .tide-point-label {
		font-size: 8px;
		font-family: 'Geist Mono', monospace;
		fill: var(--text-secondary);
		font-weight: 600;
	}

	.tide-svg .axis-label {
		font-size: 7px;
		font-family: 'Geist Mono', monospace;
		fill: var(--text-tertiary);
	}

	.tide-svg .axis-label-y {
		font-size: 7px;
	}

	.tide-svg .axis-label-x {
		font-size: 7px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
