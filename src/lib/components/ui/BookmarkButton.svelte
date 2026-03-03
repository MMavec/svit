<script lang="ts">
	import { bookmarkStore } from '$lib/stores/bookmarks.svelte';
	import type { SavedItem } from '$lib/types/index';

	interface Props {
		itemType: SavedItem['itemType'];
		externalId: string;
		title: string;
		description?: string;
		municipality?: string;
		url?: string;
	}

	let { itemType, externalId, title, description, municipality, url }: Props = $props();

	let saved = $derived(bookmarkStore.has(externalId));

	function toggle() {
		if (saved) {
			bookmarkStore.removeByExternalId(externalId);
		} else {
			bookmarkStore.add({ itemType, externalId, title, description, municipality, url });
		}
	}
</script>

<button
	class="bookmark-btn"
	class:saved
	onclick={(e) => {
		e.stopPropagation();
		toggle();
	}}
	title={saved ? 'Remove bookmark' : 'Bookmark this item'}
	aria-label={saved ? 'Remove bookmark' : 'Bookmark this item'}
>
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#if saved}
			<polygon
				points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
				fill="currentColor"
				stroke="currentColor"
			/>
		{:else}
			<polygon
				points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
				fill="none"
				stroke="currentColor"
			/>
		{/if}
	</svg>
</button>

<style>
	.bookmark-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.bookmark-btn:hover {
		color: var(--accent-warning, #d69e2e);
		background: var(--bg-surface-hover);
	}

	.bookmark-btn.saved {
		color: var(--accent-warning, #d69e2e);
	}
</style>
