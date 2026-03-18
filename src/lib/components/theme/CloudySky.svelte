<script lang="ts">
	import { onMount } from 'svelte';
	import { skyPulseStore } from '$lib/stores/sky-pulse.svelte';

	interface Cloud {
		x: number;
		y: number;
		baseSpeed: number;
		scale: number;
		baseOpacity: number;
		disruptionThreshold: number; // 0 = always visible, >0 = needs transit disruption
	}

	let clouds = $state<Cloud[]>([]);
	const BASE_COUNT = 5;
	const MAX_COUNT = 9;

	onMount(() => {
		generateClouds();
	});

	function generateClouds() {
		clouds = Array.from({ length: MAX_COUNT }, (_, i) => ({
			x: Math.random() * 120 - 10,
			y: 5 + Math.random() * 35 + i * 4,
			baseSpeed: 15 + Math.random() * 22,
			scale: 0.6 + Math.random() * 0.8,
			baseOpacity: 0.5 + Math.random() * 0.4,
			// First BASE_COUNT always visible; extras appear with transit disruptions
			disruptionThreshold: i < BASE_COUNT ? 0 : (i - BASE_COUNT) / (MAX_COUNT - BASE_COUNT)
		}));
	}

	// Derived: cloud speed multiplier (transit disruptions = faster winds)
	let speedMultiplier = $derived(1 + skyPulseStore.transitDisruptions * 0.6);

	// Derived: cloud opacity boost (poor air quality = denser clouds)
	// airQuality: 1 = excellent (normal opacity), 0 = hazardous (more opaque)
	let opacityBoost = $derived(1 + (1 - skyPulseStore.airQuality) * 0.3);

	// Derived: sun size (temperature-driven glow)
	// 0°C = 60px, 25°C+ = 120px
	let sunSize = $derived(Math.max(60, Math.min(120, 60 + (skyPulseStore.temperature / 25) * 60)));
	let sunGlowInner = $derived(Math.max(40, Math.min(80, sunSize * 0.75)));
	let sunGlowOuter = $derived(Math.max(80, Math.min(160, sunSize * 1.5)));

	// Derived: which clouds are visible based on transit disruption level
	let visibleClouds = $derived(
		clouds.filter((c) => c.disruptionThreshold <= skyPulseStore.transitDisruptions)
	);

	// Derived: show rain overlay for weather warnings/emergencies
	let showRain = $derived(
		skyPulseStore.alertSeverity === 'warning' || skyPulseStore.alertSeverity === 'emergency'
	);
</script>

<div class="cloudy-sky" aria-hidden="true">
	<!-- Sun with temperature-driven glow -->
	<div
		class="sun"
		style="
			width: {sunSize}px;
			height: {sunSize}px;
			box-shadow: 0 0 {sunGlowInner}px rgba(255, 220, 80, 0.4),
				0 0 {sunGlowOuter}px rgba(255, 200, 50, 0.2);
		"
	></div>

	<!-- Clouds: count driven by transit disruptions, speed by wind, opacity by air quality -->
	{#each visibleClouds as cloud, i (i)}
		<svg
			class="cloud"
			viewBox="0 0 200 80"
			style="
				top: {cloud.y}%;
				left: -{cloud.scale * 200}px;
				width: {cloud.scale * 200}px;
				opacity: {Math.min(0.95, cloud.baseOpacity * opacityBoost)};
				animation: drift-{i} {cloud.baseSpeed / speedMultiplier}s linear infinite;
				animation-delay: -{(cloud.x / 120) * (cloud.baseSpeed / speedMultiplier)}s;
			"
		>
			<ellipse cx="70" cy="50" rx="50" ry="25" fill="rgba(255,255,255,0.9)" />
			<ellipse cx="100" cy="38" rx="45" ry="28" fill="rgba(255,255,255,0.95)" />
			<ellipse cx="130" cy="50" rx="40" ry="22" fill="rgba(255,255,255,0.9)" />
			<ellipse cx="90" cy="55" rx="55" ry="20" fill="rgba(255,255,255,0.85)" />
		</svg>
	{/each}

	<!-- Rain overlay for weather warnings -->
	{#if showRain}
		<div class="rain-overlay"></div>
	{/if}
</div>

<style>
	.cloudy-sky {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.sun {
		position: absolute;
		top: 8%;
		right: 12%;
		background: radial-gradient(
			circle,
			#fff7b0 0%,
			#ffe066 30%,
			rgba(255, 200, 50, 0.3) 60%,
			transparent 70%
		);
		border-radius: 50%;
		transition:
			width 2s ease,
			height 2s ease,
			box-shadow 2s ease;
	}

	.cloud {
		position: absolute;
		height: auto;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.05));
		transition: opacity 3s ease;
	}

	.rain-overlay {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			180deg,
			transparent 0px,
			transparent 18px,
			rgba(120, 160, 200, 0.04) 18px,
			rgba(120, 160, 200, 0.04) 19px
		);
		animation: rain-fall 0.6s linear infinite;
		opacity: 0.7;
	}

	@keyframes rain-fall {
		from {
			transform: translateY(-20px);
		}
		to {
			transform: translateY(0px);
		}
	}

	/* Drift keyframes for each cloud slot */
	@keyframes drift-0 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-1 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-2 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-3 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-4 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-5 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-6 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-7 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
	@keyframes drift-8 {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(calc(100vw + 200px));
		}
	}
</style>
