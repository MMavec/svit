<script lang="ts">
	import type { PanelConfig } from '$lib/types/index';
	import type { Snippet } from 'svelte';

	interface Props {
		config: PanelConfig;
		children?: Snippet;
	}

	let { config, children }: Props = $props();
</script>

<div class="panel" data-panel-id={config.id} data-tier={config.tier}>
	<div class="panel-header">
		<span class="panel-icon">{config.icon}</span>
		<span class="panel-title">{config.title}</span>
		<span class="panel-tier">T{config.tier}</span>
	</div>
	<div class="panel-body">
		{#if children}
			{@render children()}
		{:else}
			<div class="panel-placeholder">Coming soon...</div>
		{/if}
	</div>
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
</style>
