<script lang="ts">
	import MunicipalitySelector from './MunicipalitySelector.svelte';
	import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
	import { refreshStore } from '$lib/stores/refresh.svelte';
	import { layoutStore } from '$lib/stores/layout.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { bookmarkStore } from '$lib/stores/bookmarks.svelte';

	let showBookmarks = $state(false);
	let bookmarkCount = $derived(bookmarkStore.items.length);

	function closeBookmarks(e: MouseEvent) {
		if (!(e.target as HTMLElement).closest('.bookmarks-flyout, .bookmark-header-btn')) {
			showBookmarks = false;
		}
	}
</script>

<svelte:window onclick={closeBookmarks} />

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
		<button
			class="header-btn"
			class:active={refreshStore.enabled}
			onclick={() => refreshStore.toggle()}
			aria-label={refreshStore.enabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
			title={refreshStore.enabled ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="23 4 23 10 17 10" />
				<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
			</svg>
		</button>
		<button
			class="header-btn"
			onclick={() => layoutStore.reset()}
			aria-label="Reset layout"
			title="Reset panel layout"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="3" y="3" width="7" height="7" />
				<rect x="14" y="3" width="7" height="7" />
				<rect x="14" y="14" width="7" height="7" />
				<rect x="3" y="14" width="7" height="7" />
			</svg>
		</button>
		<div class="bookmark-wrapper">
			<button
				class="header-btn bookmark-header-btn"
				class:active={showBookmarks || bookmarkCount > 0}
				onclick={() => (showBookmarks = !showBookmarks)}
				title="Bookmarks"
				aria-label="Bookmarks ({bookmarkCount})"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill={bookmarkCount > 0 ? 'currentColor' : 'none'}
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polygon
						points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
					/>
				</svg>
				{#if bookmarkCount > 0}
					<span class="bookmark-badge">{bookmarkCount}</span>
				{/if}
			</button>
			{#if showBookmarks}
				<div class="bookmarks-flyout">
					<div class="flyout-header">
						<span class="flyout-title">Bookmarks</span>
						<span class="flyout-count">{bookmarkCount}</span>
					</div>
					{#if bookmarkStore.items.length === 0}
						<div class="flyout-empty">No bookmarks yet</div>
					{:else}
						<div class="flyout-list">
							{#each bookmarkStore.items as item (item.id)}
								<div class="flyout-item">
									<div class="flyout-item-info">
										<span class="flyout-item-type">{item.itemType}</span>
										<span class="flyout-item-title">{item.title}</span>
									</div>
									<button
										class="flyout-remove"
										onclick={(e) => {
											e.stopPropagation();
											bookmarkStore.remove(item.id);
										}}
										title="Remove"
									>
										&times;
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
		<ThemeToggle />
		{#if authStore.isAuthenticated}
			<button class="header-btn user-btn" onclick={() => authStore.signOut()} title="Sign out">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</button>
		{:else}
			<button
				class="header-btn sign-in-btn"
				onclick={() => (authStore.showAuthModal = true)}
				title="Sign in for campaign tools"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
					<polyline points="10 17 15 12 10 7" />
					<line x1="15" y1="12" x2="3" y2="12" />
				</svg>
			</button>
		{/if}
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
		gap: 8px;
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

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}

	.header-btn:hover {
		border-color: var(--border-hover);
		color: var(--accent-primary);
		background: var(--bg-surface-hover);
	}

	.header-btn.active {
		color: var(--accent-secondary);
		border-color: var(--accent-secondary);
	}

	.user-btn {
		color: var(--accent-secondary);
		border-color: var(--accent-secondary);
	}

	.sign-in-btn:hover {
		color: var(--accent-secondary);
		border-color: var(--accent-secondary);
	}

	.bookmark-wrapper {
		position: relative;
	}

	.bookmark-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		font-size: 0.5rem;
		font-weight: 700;
		min-width: 14px;
		height: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 7px;
		background: var(--accent-warning, #d69e2e);
		color: #fff;
		pointer-events: none;
	}

	.bookmarks-flyout {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 280px;
		max-height: 360px;
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		border-radius: 10px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		z-index: 100;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.flyout-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		border-bottom: 1px solid var(--border-primary);
	}

	.flyout-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.flyout-count {
		font-size: 0.625rem;
		font-family: 'Geist Mono', monospace;
		color: var(--text-tertiary);
	}

	.flyout-empty {
		padding: 20px;
		text-align: center;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.flyout-list {
		overflow-y: auto;
		flex: 1;
	}

	.flyout-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-bottom: 1px solid var(--border-primary);
	}

	.flyout-item:last-child {
		border-bottom: none;
	}

	.flyout-item:hover {
		background: var(--bg-surface-hover);
	}

	.flyout-item-info {
		flex: 1;
		min-width: 0;
	}

	.flyout-item-type {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--accent-primary);
		letter-spacing: 0.05em;
		display: block;
	}

	.flyout-item-title {
		font-size: 0.6875rem;
		color: var(--text-primary);
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.flyout-remove {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: 4px;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.flyout-remove:hover {
		color: var(--accent-danger);
		background: var(--bg-surface-hover);
	}

	@media (min-width: 768px) {
		.logo-sub {
			display: inline;
		}
	}

	@media (max-width: 600px) {
		.app-header {
			padding: 8px 12px;
		}

		.header-right {
			gap: 4px;
		}

		.header-btn {
			width: 32px;
			height: 32px;
		}
	}
</style>
