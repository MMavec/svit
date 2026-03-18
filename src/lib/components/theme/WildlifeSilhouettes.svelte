<script lang="ts">
	import { skyPulseStore } from '$lib/stores/sky-pulse.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	// Simple, evocative SVG path data for CRD wildlife
	const SILHOUETTES: Record<string, { viewBox: string; d: string; width: number; height: number }> =
		{
			bird: {
				viewBox: '0 0 48 18',
				d: 'M24 11 C19 11 12 3 2 7 C10 5 18 10 24 10 C30 10 38 5 46 7 C36 3 29 11 24 11Z',
				width: 48,
				height: 18
			},
			'marine-mammal': {
				viewBox: '0 0 64 28',
				d: 'M4 18 Q14 6 32 8 Q44 10 56 18 Q44 22 30 20 Q14 20 4 18Z M36 8 L38 2 Q39 6 38 9',
				width: 64,
				height: 28
			},
			mammal: {
				viewBox: '0 0 52 36',
				d: 'M12 30 L12 22 Q12 16 16 14 Q18 12 18 8 L16 4 L18 8 L20 3 L19 9 Q20 12 22 14 L36 16 Q42 18 42 24 L42 30 M14 22 L14 30 M40 24 L40 30',
				width: 52,
				height: 36
			}
		};

	// Fallback to bird for unknown categories
	function getSilhouette(category: string) {
		return SILHOUETTES[category] ?? SILHOUETTES.bird;
	}

	interface ActiveSilhouette {
		id: number;
		category: string;
		commonName: string;
		silhouette: (typeof SILHOUETTES)[string];
		y: number;
		duration: number;
		delay: number;
		direction: 'ltr' | 'rtl';
		scale: number;
	}

	let activeSilhouettes = $state<ActiveSilhouette[]>([]);
	let nextId = 0;
	let lastHash = '';
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	// Animation config per category
	function getAnimConfig(category: string) {
		switch (category) {
			case 'bird':
				return {
					yMin: 3,
					yMax: 25,
					durationMin: 18,
					durationMax: 28,
					scaleMin: 0.6,
					scaleMax: 1.2
				};
			case 'marine-mammal':
				return {
					yMin: 75,
					yMax: 88,
					durationMin: 22,
					durationMax: 35,
					scaleMin: 0.8,
					scaleMax: 1.4
				};
			case 'mammal':
				return {
					yMin: 82,
					yMax: 92,
					durationMin: 25,
					durationMax: 40,
					scaleMin: 0.5,
					scaleMax: 0.9
				};
			default:
				return {
					yMin: 10,
					yMax: 40,
					durationMin: 20,
					durationMax: 30,
					scaleMin: 0.6,
					scaleMax: 1.0
				};
		}
	}

	// Watch for new sightings
	$effect(() => {
		if (!mounted) return;

		const sightings = skyPulseStore.recentSightings;
		const hash = sightings.map((s) => `${s.category}:${s.commonName}`).join(',');
		if (hash === lastHash || hash === '') return;
		lastHash = hash;

		// Clear previous silhouettes before spawning new ones
		activeSilhouettes = [];

		// Spawn silhouettes staggered over time (max 3)
		const toSpawn = sightings.slice(0, 3);
		toSpawn.forEach((s, i) => {
			const config = getAnimConfig(s.category);
			const id = nextId++;
			const duration =
				config.durationMin + Math.random() * (config.durationMax - config.durationMin);
			const delay = i * 10 + Math.random() * 8; // stagger 10-18s apart

			const entry: ActiveSilhouette = {
				id,
				category: s.category,
				commonName: s.commonName,
				silhouette: getSilhouette(s.category),
				y: config.yMin + Math.random() * (config.yMax - config.yMin),
				duration,
				delay,
				direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
				scale: config.scaleMin + Math.random() * (config.scaleMax - config.scaleMin)
			};

			activeSilhouettes = [...activeSilhouettes, entry];

			// Remove after animation completes
			setTimeout(
				() => {
					activeSilhouettes = activeSilhouettes.filter((a) => a.id !== id);
				},
				(delay + duration) * 1000 + 500
			);
		});
	});

	let isDark = $derived(theme.value === 'dark');
</script>

<div class="wildlife-silhouettes" aria-hidden="true">
	{#each activeSilhouettes as sil (sil.id)}
		<svg
			class="silhouette"
			class:ltr={sil.direction === 'ltr'}
			class:rtl={sil.direction === 'rtl'}
			viewBox={sil.silhouette.viewBox}
			style="
				top: {sil.y}%;
				width: {sil.silhouette.width * sil.scale}px;
				height: {sil.silhouette.height * sil.scale}px;
				animation-duration: {sil.duration}s;
				animation-delay: {sil.delay}s;
				--sil-color: {isDark ? 'rgba(220, 230, 255, 0.12)' : 'rgba(40, 50, 60, 0.08)'};
			"
		>
			<title>{sil.commonName}</title>
			<path
				d={sil.silhouette.d}
				fill="var(--sil-color)"
				stroke="var(--sil-color)"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		</svg>
	{/each}
</div>

<style>
	.wildlife-silhouettes {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.silhouette {
		position: absolute;
		opacity: 0;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}

	.silhouette.ltr {
		left: -80px;
		animation-name: drift-ltr;
	}

	.silhouette.rtl {
		right: -80px;
		animation-name: drift-rtl;
		transform: scaleX(-1);
	}

	@keyframes drift-ltr {
		0% {
			transform: translateX(0);
			opacity: 0;
		}
		5% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			transform: translateX(calc(100vw + 160px));
			opacity: 0;
		}
	}

	@keyframes drift-rtl {
		0% {
			transform: scaleX(-1) translateX(0);
			opacity: 0;
		}
		5% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			transform: scaleX(-1) translateX(calc(100vw + 160px));
			opacity: 0;
		}
	}
</style>
