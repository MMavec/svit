<script lang="ts">
	import ShareDrawer from './ShareDrawer.svelte';

	interface Props {
		panelId?: string;
		panelTitle?: string;
	}

	let { panelId, panelTitle }: Props = $props();

	let showDrawer = $state(false);
</script>

<button
	class="share-btn"
	onclick={(e) => {
		e.stopPropagation();
		showDrawer = true;
	}}
	aria-label="Share"
	title="Share"
>
	<svg
		width="12"
		height="12"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="18" cy="5" r="3" />
		<circle cx="6" cy="12" r="3" />
		<circle cx="18" cy="19" r="3" />
		<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
		<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
	</svg>
</button>

{#if showDrawer}
	<ShareDrawer {panelId} {panelTitle} onclose={() => (showDrawer = false)} />
{/if}

<style>
	.share-btn {
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

	.share-btn:hover {
		background: var(--border-primary);
		color: var(--text-primary);
	}
</style>
