<script lang="ts">
	import { dashboardModes } from '$lib/config/dashboard-modes';
	import { dashboardModeStore } from '$lib/stores/dashboard-mode.svelte';
	import type { DashboardMode } from '$lib/config/dashboard-modes';
</script>

<div class="mode-selector" role="radiogroup" aria-label="Dashboard mode">
	{#each dashboardModes as mode (mode.id)}
		<button
			class="mode-btn"
			class:active={dashboardModeStore.mode === mode.id}
			onclick={() => dashboardModeStore.setMode(mode.id as DashboardMode)}
			role="radio"
			aria-checked={dashboardModeStore.mode === mode.id}
			title={mode.label}
			aria-label="{mode.label} mode"
		>
			<span class="mode-icon">{mode.icon}</span>
			<span class="mode-label">{mode.label}</span>
		</button>
	{/each}
</div>

<style>
	.mode-selector {
		display: flex;
		gap: 2px;
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		padding: 2px;
	}

	.mode-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-tertiary);
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.mode-btn:hover {
		color: var(--text-primary);
		background: var(--bg-surface-hover);
	}

	.mode-btn.active {
		background: var(--accent-primary);
		color: var(--text-inverse);
	}

	.mode-icon {
		font-size: 0.75rem;
		line-height: 1;
	}

	.mode-label {
		display: none;
	}

	@media (min-width: 1024px) {
		.mode-label {
			display: inline;
		}
	}
</style>
