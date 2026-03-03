<script lang="ts">
	import MunicipalitySelector from './MunicipalitySelector.svelte';
	import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
</script>

<header class="app-header">
	<div class="header-left">
		<h1 class="logo">
			<span class="logo-icon">◈</span>
			<span class="logo-text">SVIT</span>
			<span class="logo-sub">South Vancouver Island Tracker</span>
		</h1>
	</div>

	<div class="header-center">
		<MunicipalitySelector />
	</div>

	<div class="header-right">
		<ThemeToggle />
	</div>
</header>

<style>
	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--bg-surface);
		backdrop-filter: var(--panel-backdrop);
		-webkit-backdrop-filter: var(--panel-backdrop);
		border-bottom: 1px solid var(--border-primary);
	}

	.header-left,
	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.header-center {
		display: flex;
		align-items: center;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.logo-icon {
		color: var(--accent-primary);
		font-size: 1.25rem;
	}

	.logo-text {
		font-family: 'Geist Mono', monospace;
		letter-spacing: 2px;
	}

	.logo-sub {
		font-size: 0.6875rem;
		font-weight: 400;
		color: var(--text-tertiary);
		display: none;
	}

	@media (min-width: 768px) {
		.logo-sub {
			display: inline;
		}
	}
</style>
