<script lang="ts">
	import { onMount } from 'svelte';

	interface Cloud {
		x: number;
		y: number;
		speed: number;
		scale: number;
		opacity: number;
	}

	let clouds = $state<Cloud[]>([]);
	let containerWidth = $state(1200);

	onMount(() => {
		containerWidth = window.innerWidth;
		generateClouds();

		function handleResize() {
			containerWidth = window.innerWidth;
		}
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function generateClouds() {
		const count = 5 + Math.floor(Math.random() * 3);
		clouds = Array.from({ length: count }, (_, i) => ({
			x: Math.random() * 120 - 10,
			y: 5 + Math.random() * 35 + i * 5,
			speed: 12 + Math.random() * 25,
			scale: 0.6 + Math.random() * 0.8,
			opacity: 0.5 + Math.random() * 0.4
		}));
	}
</script>

<div class="cloudy-sky" aria-hidden="true">
	<!-- Sun -->
	<div class="sun"></div>

	<!-- Clouds -->
	{#each clouds as cloud, i}
		<svg
			class="cloud"
			viewBox="0 0 200 80"
			style="
				top: {cloud.y}%;
				left: -{cloud.scale * 200}px;
				width: {cloud.scale * 200}px;
				opacity: {cloud.opacity};
				animation: drift-{i} {cloud.speed}s linear infinite;
				animation-delay: -{(cloud.x / 120) * cloud.speed}s;
			"
		>
			<ellipse cx="70" cy="50" rx="50" ry="25" fill="rgba(255,255,255,0.9)" />
			<ellipse cx="100" cy="38" rx="45" ry="28" fill="rgba(255,255,255,0.95)" />
			<ellipse cx="130" cy="50" rx="40" ry="22" fill="rgba(255,255,255,0.9)" />
			<ellipse cx="90" cy="55" rx="55" ry="20" fill="rgba(255,255,255,0.85)" />
		</svg>
	{/each}
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
		width: 80px;
		height: 80px;
		background: radial-gradient(circle, #fff7b0 0%, #ffe066 30%, rgba(255, 200, 50, 0.3) 60%, transparent 70%);
		border-radius: 50%;
		box-shadow:
			0 0 60px rgba(255, 220, 80, 0.4),
			0 0 120px rgba(255, 200, 50, 0.2);
	}

	.cloud {
		position: absolute;
		height: auto;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.05));
	}

	/* Generate drift keyframes for each cloud */
	@keyframes drift-0 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
	@keyframes drift-1 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
	@keyframes drift-2 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
	@keyframes drift-3 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
	@keyframes drift-4 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
	@keyframes drift-5 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
	@keyframes drift-6 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
	@keyframes drift-7 {
		from { transform: translateX(-200px); }
		to { transform: translateX(calc(100vw + 200px)); }
	}
</style>
