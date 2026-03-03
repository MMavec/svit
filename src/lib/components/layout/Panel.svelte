<script lang="ts">
	import type { PanelConfig } from '$lib/types/index';
	import type { Snippet } from 'svelte';

	interface Props {
		config: PanelConfig;
		children?: Snippet;
	}

	let { config, children }: Props = $props();

	let collapsed = $state(false);
	let hasError = $state(false);
	let errorMessage = $state('');

	$effect.pre(() => {
		if (typeof window !== 'undefined') {
			collapsed = localStorage.getItem(`svit-collapsed-${config.id}`) === '1';
		}
	});

	function toggleCollapse() {
		collapsed = !collapsed;
		if (typeof window !== 'undefined') {
			const key = `svit-collapsed-${config.id}`;
			if (collapsed) {
				localStorage.setItem(key, '1');
			} else {
				localStorage.removeItem(key);
			}
		}
	}
</script>

<div class="panel" class:collapsed data-panel-id={config.id} data-tier={config.tier}>
	<div class="panel-header">
		<span class="panel-icon">{config.icon}</span>
		<span class="panel-title">{config.title}</span>
		<span class="panel-tier">T{config.tier}</span>
		<button
			class="collapse-btn"
			onclick={(e) => {
				e.stopPropagation();
				toggleCollapse();
			}}
			aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
			title={collapsed ? 'Expand' : 'Collapse'}
		>
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				{#if collapsed}
					<polyline points="3,4.5 6,7.5 9,4.5" />
				{:else}
					<polyline points="3,7.5 6,4.5 9,7.5" />
				{/if}
			</svg>
		</button>
	</div>
	{#if !collapsed}
		<div class="panel-body">
			{#if hasError}
				<div class="panel-error">
					<span class="error-icon">!</span>
					<p>{errorMessage || 'Something went wrong'}</p>
					<button
						class="retry-btn"
						onclick={() => {
							hasError = false;
							errorMessage = '';
						}}>Retry</button
					>
				</div>
			{:else if children}
				{@render children()}
			{:else}
				<div class="panel-placeholder">Coming soon...</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.panel-title {
		flex: 1;
	}

	.panel-tier {
		font-size: 0.625rem;
		font-weight: 500;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--border-primary);
		color: var(--text-tertiary);
		letter-spacing: 0.5px;
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 4px;
		border: none;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.collapse-btn:hover {
		background: var(--border-primary);
		color: var(--text-primary);
	}

	.panel.collapsed {
		min-height: auto;
	}

	.panel.collapsed .panel-header {
		border-bottom: none;
	}

	.panel-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px 8px;
		text-align: center;
		color: var(--text-tertiary);
		font-size: 0.8125rem;
	}

	.error-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(252, 129, 129, 0.15);
		color: var(--accent-danger);
		font-weight: 700;
		font-size: 0.875rem;
	}

	.panel-error p {
		margin: 0;
		line-height: 1.4;
	}

	.retry-btn {
		padding: 4px 14px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--accent-primary);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.retry-btn:hover {
		background: var(--bg-surface-hover);
		border-color: var(--accent-primary);
	}
</style>
