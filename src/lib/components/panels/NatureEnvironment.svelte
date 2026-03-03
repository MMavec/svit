<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchEnvironmentReadings } from '$lib/api/environment';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { EnvironmentReading } from '$lib/types/index';

	let readings = $state<EnvironmentReading[]>([]);
	let loading = $state(true);

	async function loadData() {
		loading = true;
		const result = await fetchEnvironmentReadings({
			municipality: municipalityStore.slug
		});
		readings = result.data || [];
		loading = false;
	}

	onMount(() => {
		loadData();
	});

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function statusColor(status: EnvironmentReading['status']): string {
		switch (status) {
			case 'good':
				return '#68d391';
			case 'moderate':
				return '#d69e2e';
			case 'unhealthy-sensitive':
				return '#dd6b20';
			case 'unhealthy':
				return '#e53e3e';
			case 'hazardous':
				return '#9b2c2c';
		}
	}

	function statusLabel(status: EnvironmentReading['status']): string {
		switch (status) {
			case 'good':
				return 'Good';
			case 'moderate':
				return 'Moderate';
			case 'unhealthy-sensitive':
				return 'Sensitive';
			case 'unhealthy':
				return 'Unhealthy';
			case 'hazardous':
				return 'Hazardous';
		}
	}

	function typeIcon(type: EnvironmentReading['type']): string {
		switch (type) {
			case 'air-quality':
				return 'A';
			case 'water-quality':
				return 'W';
			case 'uv-index':
				return 'U';
			case 'pollen':
				return 'P';
		}
	}

	function typeLabel(type: EnvironmentReading['type']): string {
		switch (type) {
			case 'air-quality':
				return 'Air';
			case 'water-quality':
				return 'Water';
			case 'uv-index':
				return 'UV';
			case 'pollen':
				return 'Pollen';
		}
	}

	let aqiReading = $derived(readings.find((r) => r.metric === 'Air Quality Index'));
</script>

<div class="nature">
	{#if loading}
		<div class="loading">Loading environmental data...</div>
	{:else if readings.length === 0}
		<div class="empty">No environmental data available</div>
	{:else}
		{#if aqiReading}
			<div class="aqi-hero" style="border-color: {statusColor(aqiReading.status)}">
				<div class="aqi-value" style="color: {statusColor(aqiReading.status)}">
					{aqiReading.value}
				</div>
				<div class="aqi-details">
					<span class="aqi-label">Air Quality Index</span>
					<span class="aqi-status" style="color: {statusColor(aqiReading.status)}">
						{statusLabel(aqiReading.status)}
					</span>
				</div>
			</div>
		{/if}

		<div class="reading-list">
			{#each readings.filter((r) => r.metric !== 'Air Quality Index') as reading (reading.id)}
				<div class="reading-card">
					<div class="reading-header">
						<span class="type-badge" style="background: {statusColor(reading.status)}">
							{typeIcon(reading.type)}
						</span>
						<span class="type-label">{typeLabel(reading.type)}</span>
						<span class="reading-metric">{reading.metric}</span>
					</div>
					<div class="reading-row">
						<span class="reading-value">
							{reading.value}
							<span class="reading-unit">{reading.unit}</span>
						</span>
						<span class="reading-status" style="color: {statusColor(reading.status)}">
							{statusLabel(reading.status)}
						</span>
					</div>
					<div class="reading-location">{reading.location}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.nature {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
	}

	.aqi-hero {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border-left: 3px solid;
	}

	.aqi-value {
		font-size: 1.75rem;
		font-weight: 700;
		font-family: 'Geist Mono', monospace;
		line-height: 1;
	}

	.aqi-details {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.aqi-label {
		font-size: 0.6875rem;
		color: var(--text-secondary);
	}

	.aqi-status {
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.reading-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.reading-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.reading-header {
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

	.type-label {
		font-size: 0.5625rem;
		font-weight: 700;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.reading-metric {
		font-size: 0.75rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.reading-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.reading-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: 'Geist Mono', monospace;
	}

	.reading-unit {
		font-size: 0.625rem;
		font-weight: 400;
		color: var(--text-tertiary);
	}

	.reading-status {
		font-size: 0.6875rem;
		font-weight: 600;
	}

	.reading-location {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		margin-top: 2px;
	}

	.loading,
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
