<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	interface Star {
		x: number;
		y: number;
		radius: number;
		opacity: number;
		twinkleSpeed: number;
		twinkleOffset: number;
	}

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
			const count = Math.floor((canvas.width * canvas.height) / 4000);
			stars = [];
			for (let i = 0; i < count; i++) {
				stars.push({
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					radius: Math.random() * 1.5 + 0.3,
					opacity: Math.random() * 0.6 + 0.2,
					twinkleSpeed: Math.random() * 0.02 + 0.005,
					twinkleOffset: Math.random() * Math.PI * 2
				});
			}
		}

		function drawAurora(time: number) {
			const gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
			const wave = Math.sin(time * 0.0003) * 0.02;
			gradient.addColorStop(0, 'transparent');
			gradient.addColorStop(0.3, `rgba(99, 179, 237, ${0.04 + wave})`);
			gradient.addColorStop(0.6, `rgba(104, 211, 145, ${0.03 + wave})`);
			gradient.addColorStop(0.8, `rgba(159, 122, 234, ${0.025 + wave})`);
			gradient.addColorStop(1, 'transparent');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
		}

		let shootingStarTimer = 0;
		let shootingStar: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

		function updateShootingStar(time: number) {
			if (!shootingStar && time > shootingStarTimer) {
				shootingStar = {
					x: Math.random() * canvas.width * 0.8,
					y: Math.random() * canvas.height * 0.3,
					vx: 4 + Math.random() * 3,
					vy: 2 + Math.random() * 2,
					life: 1
				};
				shootingStarTimer = time + 8000 + Math.random() * 15000;
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
				gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.life})`);
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

			// Aurora at the bottom
			drawAurora(time);

			// Stars
			for (const star of stars) {
				const flicker = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
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
