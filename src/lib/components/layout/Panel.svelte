<script lang="ts">
	import type { PanelConfig } from '$lib/types/index';
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import DataFreshness from '$lib/components/ui/DataFreshness.svelte';

	interface Props {
		config: PanelConfig;
		children?: Snippet;
	}

	let { config, children }: Props = $props();

	let collapsed = $state(false);
	let lastUpdated = $state<Date | null>(null);

	// Expose a setter via context so child panels can report data freshness
	setContext('panel:markUpdated', () => {
		lastUpdated = new Date();
	});

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
		<span class="panel-icon" aria-hidden="true">{config.icon}</span>
		<span class="panel-title">{config.title}</span>
		<DataFreshness timestamp={lastUpdated} />
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
			{#if children}
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
</style>
