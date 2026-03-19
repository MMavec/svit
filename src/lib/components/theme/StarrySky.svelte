<script lang="ts">
	import { onMount } from 'svelte';
	import { skyPulseStore } from '$lib/stores/sky-pulse.svelte';

	let canvas: HTMLCanvasElement;

	interface Star {
		x: number;
		y: number;
		radius: number;
		opacity: number;
		twinkleSpeed: number;
		twinkleOffset: number;
		activityThreshold: number; // 0 = always visible, >0 = needs civic activity
	}

	// Aurora color palettes keyed by dominant data category
	const AURORA_COLORS: Record<string, number[][]> = {
		political: [
			[80, 200, 120],
			[104, 211, 145],
			[130, 160, 234]
		],
		safety: [
			[237, 150, 99],
			[237, 120, 99],
			[200, 100, 120]
		],
		nature: [
			[99, 180, 237],
			[99, 140, 220],
			[140, 99, 234]
		],
		community: [
			[99, 200, 220],
			[99, 211, 180],
			[120, 200, 160]
		],
		neutral: [
			[99, 179, 237],
			[104, 211, 145],
			[159, 122, 234]
		]
	};

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		let animId: number;
		let stars: Star[] = [];

		function resize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			generateStars();
		}

		function generateStars() {
			// Generate 50% more stars than the base density. Extra stars appear as
			// civic activity rises, creating a denser starfield when the community
			// is buzzing.
			const baseCount = Math.floor((canvas.width * canvas.height) / 4000);
			const maxCount = Math.floor(baseCount * 2);
			stars = [];
			for (let i = 0; i < maxCount; i++) {
				stars.push({
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					radius: Math.random() * 1.5 + 0.3,
					opacity: Math.random() * 0.6 + 0.2,
					twinkleSpeed: Math.random() * 0.02 + 0.005,
					twinkleOffset: Math.random() * Math.PI * 2,
					// First `baseCount` stars always visible; extras need civic activity
					activityThreshold: i < baseCount ? 0 : (i - baseCount) / (maxCount - baseCount)
				});
			}
		}

		function drawAurora(time: number) {
			const activity = skyPulseStore.civicActivity;
			const category = skyPulseStore.dominantCategory;
			const colors = AURORA_COLORS[category] ?? AURORA_COLORS.neutral;

			const gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
			const wave = Math.sin(time * 0.0003) * 0.03;
			// Boost aurora brightness with civic activity: 1.5x (quiet) to 5x (buzzing)
			const boost = 1.5 + activity * 3.5;

			gradient.addColorStop(0, 'transparent');
			gradient.addColorStop(
				0.3,
				`rgba(${colors[0][0]}, ${colors[0][1]}, ${colors[0][2]}, ${(0.06 + wave) * boost})`
			);
			gradient.addColorStop(
				0.6,
				`rgba(${colors[1][0]}, ${colors[1][1]}, ${colors[1][2]}, ${(0.05 + wave) * boost})`
			);
			gradient.addColorStop(
				0.8,
				`rgba(${colors[2][0]}, ${colors[2][1]}, ${colors[2][2]}, ${(0.04 + wave) * boost})`
			);
			gradient.addColorStop(1, 'transparent');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
		}

		function drawTideLine(time: number) {
			if (!skyPulseStore.initialized) return;
			const tide = skyPulseStore.tideHeight;

			// Tide line at bottom: 2% of viewport (low tide) to 8% (high tide)
			const tideLineHeight = canvas.height * (0.02 + tide * 0.06);
			const baseY = canvas.height - tideLineHeight;

			ctx.beginPath();
			ctx.moveTo(0, canvas.height);

			// Gentle wave undulation
			for (let x = 0; x <= canvas.width; x += 4) {
				const wave1 = Math.sin(x * 0.008 + time * 0.0008) * 3;
				const wave2 = Math.sin(x * 0.015 + time * 0.0012) * 2;
				ctx.lineTo(x, baseY + wave1 + wave2);
			}

			ctx.lineTo(canvas.width, canvas.height);
			ctx.closePath();

			const gradient = ctx.createLinearGradient(0, baseY, 0, canvas.height);
			gradient.addColorStop(0, 'rgba(99, 179, 237, 0.15)');
			gradient.addColorStop(0.5, 'rgba(99, 179, 237, 0.08)');
			gradient.addColorStop(1, 'rgba(99, 179, 237, 0.03)');
			ctx.fillStyle = gradient;
			ctx.fill();
		}

		// --- Shooting star state ---
		let shootingStarTimer = 0;
		let shootingStar: {
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
			color: string;
		} | null = null;

		function getShootingStarColor(): string {
			const sev = skyPulseStore.alertSeverity;
			switch (sev) {
				case 'emergency':
					return '255, 100, 100';
				case 'warning':
					return '255, 180, 80';
				case 'watch':
					return '255, 230, 150';
				default:
					return '220, 230, 255';
			}
		}

		function updateShootingStar(time: number) {
			if (!shootingStar && time > shootingStarTimer) {
				// Interval: 20s (calm) down to 4s (high alert)
				const alertLvl = skyPulseStore.alertLevel;
				const maxInterval = 20000;
				const minInterval = 4000;
				const interval = maxInterval - (maxInterval - minInterval) * alertLvl;

				shootingStar = {
					x: Math.random() * canvas.width * 0.8,
					y: Math.random() * canvas.height * 0.3,
					vx: 4 + Math.random() * 3,
					vy: 2 + Math.random() * 2,
					life: 1,
					color: getShootingStarColor()
				};
				shootingStarTimer = time + interval * (0.5 + Math.random() * 0.5);
			}
			if (shootingStar) {
				shootingStar.x += shootingStar.vx;
				shootingStar.y += shootingStar.vy;
				shootingStar.life -= 0.02;
				if (shootingStar.life <= 0) {
					shootingStar = null;
					return;
				}
				ctx.beginPath();
				const gradient = ctx.createLinearGradient(
					shootingStar.x,
					shootingStar.y,
					shootingStar.x - shootingStar.vx * 8,
					shootingStar.y - shootingStar.vy * 8
				);
				gradient.addColorStop(0, `rgba(${shootingStar.color}, ${shootingStar.life})`);
				gradient.addColorStop(1, 'transparent');
				ctx.strokeStyle = gradient;
				ctx.lineWidth = 1.5;
				ctx.moveTo(shootingStar.x, shootingStar.y);
				ctx.lineTo(shootingStar.x - shootingStar.vx * 8, shootingStar.y - shootingStar.vy * 8);
				ctx.stroke();
			}
		}

		function animate(time: number) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Tide line (behind aurora, at the very bottom)
			drawTideLine(time);

			// Aurora borealis
			drawAurora(time);

			// Stars — density scales with civic activity
			const activity = skyPulseStore.civicActivity;
			const speedMul = 1 + activity * 0.8;

			for (const star of stars) {
				if (star.activityThreshold > activity) continue;

				const flicker = Math.sin(time * star.twinkleSpeed * speedMul + star.twinkleOffset);
				const alpha = star.opacity + flicker * 0.2;
				ctx.beginPath();
				ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(220, 230, 255, ${Math.max(0.05, alpha)})`;
				ctx.fill();
			}

			// Shooting star
			updateShootingStar(time);

			animId = requestAnimationFrame(animate);
		}

		resize();
		animId = requestAnimationFrame(animate);
		window.addEventListener('resize', resize);

		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas bind:this={canvas} class="starry-sky" aria-hidden="true"></canvas>

<style>
	.starry-sky {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}
</style>
