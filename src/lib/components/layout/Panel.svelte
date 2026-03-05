<script lang="ts">
	import type { PanelConfig } from '$lib/types/index';
	import type { Snippet } from 'svelte';
	import { onMount, setContext, getContext } from 'svelte';
	import DataFreshness from '$lib/components/ui/DataFreshness.svelte';
	import ShareButton from '$lib/components/ui/ShareButton.svelte';
	import { urlState } from '$lib/stores/url-state.svelte';

	// Propagate collapsed state to DashboardGrid for height calculations
	const setCollapsedInGrid = getContext<((id: string, collapsed: boolean) => void) | undefined>(
		'grid:setCollapsed'
	);

	interface Props {
		config: PanelConfig;
		children?: Snippet;
	}

	let { config, children }: Props = $props();

	let collapsed = $state(false);
	let lastUpdated = $state<Date | null>(null);
	let isCached = $state(false);
	let cachedAt = $state<string | null>(null);

	// Expose setters via context so child panels can report data freshness
	setContext('panel:markUpdated', () => {
		lastUpdated = new Date();
		isCached = false;
		cachedAt = null;
	});

	setContext('panel:markCached', (timestamp?: string) => {
		isCached = true;
		cachedAt = timestamp ?? null;
	});

	onMount(() => {
		const isCollapsed = localStorage.getItem(`svit-collapsed-${config.id}`) === '1';
		collapsed = isCollapsed;
		setCollapsedInGrid?.(config.id, isCollapsed);
	});

	function toggleCollapse() {
		collapsed = !collapsed;
		setCollapsedInGrid?.(config.id, collapsed);
		if (typeof window !== 'undefined') {
			const key = `svit-collapsed-${config.id}`;
			if (collapsed) {
				localStorage.setItem(key, '1');
			} else {
				localStorage.removeItem(key);
			}
		}
	}

	const isFocused = $derived(urlState.focusedPanel === config.id);
</script>

<div class="panel" class:collapsed data-panel-id={config.id} data-tier={config.tier}>
	<div class="panel-header">
		<span class="panel-icon" aria-hidden="true">{config.icon}</span>
		<span class="panel-title">{config.title}</span>
		<DataFreshness timestamp={lastUpdated} cached={isCached} {cachedAt} />
		<button
			class="panel-action-btn"
			class:is-focused={isFocused}
			onclick={(e) => {
				e.stopPropagation();
				urlState.focusPanel(isFocused ? null : config.id);
			}}
			aria-label={isFocused ? 'Minimize panel' : 'Expand panel'}
			title={isFocused ? 'Minimize' : 'Expand'}
		>
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				{#if urlState.focusedPanel === config.id}
					<polyline points="4,1 1,1 1,4" />
					<polyline points="8,11 11,11 11,8" />
					<polyline points="8,1 11,1 11,4" />
					<polyline points="4,11 1,11 1,8" />
				{:else}
					<polyline points="8,1 11,1 11,4" />
					<polyline points="4,11 1,11 1,8" />
				{/if}
			</svg>
		</button>
		<ShareButton panelId={config.id} panelTitle={config.title} />
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

	.panel-action-btn {
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

	.panel-action-btn:hover {
		background: var(--border-primary);
		color: var(--text-primary);
	}

	.panel-action-btn.is-focused {
		background: var(--accent-primary);
		color: var(--text-inverse);
	}

	.panel-action-btn.is-focused:hover {
		opacity: 0.85;
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
