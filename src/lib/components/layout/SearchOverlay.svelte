<script lang="ts">
	import { searchStore } from '$lib/stores/search.svelte';
	import { searchCategoryColor } from '$lib/utils/color-maps';
	import { isValidHttpUrl } from '$lib/utils/sanitize';

	let inputEl = $state<HTMLInputElement | null>(null);
	let activeIndex = $state(-1);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			searchStore.close();
		}
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			if (searchStore.isOpen) {
				searchStore.close();
			} else {
				searchStore.open();
			}
		}
		if (searchStore.isOpen && searchStore.results.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				activeIndex = Math.min(activeIndex + 1, searchStore.results.length - 1);
				scrollActiveIntoView();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				activeIndex = Math.max(activeIndex - 1, -1);
				if (activeIndex === -1) inputEl?.focus();
				else scrollActiveIntoView();
			} else if (e.key === 'Enter' && activeIndex >= 0) {
				const result = searchStore.results[activeIndex];
				if (result?.url && isValidHttpUrl(result.url)) {
					window.open(result.url, '_blank', 'noopener,noreferrer');
					searchStore.close();
				}
			}
		}
	}

	function scrollActiveIntoView() {
		requestAnimationFrame(() => {
			const items = document.querySelectorAll('.result-item');
			items[activeIndex]?.scrollIntoView({ block: 'nearest' });
		});
	}

	// Reset active index when results change
	$effect(() => {
		const _results = searchStore.results;
		activeIndex = -1;
	});

	$effect(() => {
		if (searchStore.isOpen && inputEl) {
			inputEl.focus();
		}
	});

	function categoryIcon(cat: string): string {
		switch (cat) {
			case 'Council':
				return 'C';
			case 'News':
				return 'N';
			case 'Development':
				return 'D';
			case 'Event':
				return 'E';
			case 'Safety':
				return 'S';
			default:
				return '?';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if searchStore.isOpen}
	<div class="overlay-backdrop" onclick={() => searchStore.close()} role="presentation">
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="overlay-container"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-label="Search"
		>
			<div class="search-input-row">
				<svg
					class="search-icon"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					bind:this={inputEl}
					type="text"
					class="search-input"
					placeholder="Search council, news, development, events, safety..."
					aria-label="Search all panels"
					value={searchStore.query}
					oninput={(e) => (searchStore.query = e.currentTarget.value)}
				/>
				<kbd class="esc-hint">ESC</kbd>
			</div>

			<div class="search-results" role="listbox" aria-label="Search results">
				<div class="visually-hidden" role="status" aria-live="polite">
					{#if searchStore.searching}
						Searching...
					{:else if searchStore.query.length > 0 && searchStore.results.length === 0}
						No results found
					{:else if searchStore.results.length > 0}
						{searchStore.results.length} result{searchStore.results.length === 1 ? '' : 's'} found
					{/if}
				</div>
				{#if searchStore.searching}
					<div class="search-status">Searching...</div>
				{:else if searchStore.query.length > 0 && searchStore.results.length === 0}
					<div class="search-status">No results for "{searchStore.query}"</div>
				{:else if searchStore.results.length > 0}
					{#each searchStore.results as result, i (result.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="result-item"
							class:active={activeIndex === i}
							role="option"
							aria-selected={activeIndex === i}
							onclick={() => {
								if (result.url && isValidHttpUrl(result.url)) {
									window.open(result.url, '_blank', 'noopener,noreferrer');
									searchStore.close();
								}
							}}
						>
							<span
								class="result-badge"
								style="background: {searchCategoryColor(result.category)}"
								role="img"
								aria-label={result.category}
							>
								{categoryIcon(result.category)}
							</span>
							<div class="result-info">
								<div class="result-title">
									{#if isValidHttpUrl(result.url)}
										<a
											href={result.url}
											target="_blank"
											rel="noopener noreferrer"
											onclick={() => searchStore.close()}
										>
											{result.title}
										</a>
									{:else}
										{result.title}
									{/if}
								</div>
								{#if result.description}
									<div class="result-desc">{result.description}</div>
								{/if}
								<div class="result-meta">
									<span class="result-category">{result.category}</span>
									{#if result.municipality}
										<span class="result-municipality">{result.municipality}</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="search-hint">Type to search across all panels</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 200;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 15vh;
	}

	.overlay-container {
		width: 100%;
		max-width: 540px;
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
		overflow: hidden;
	}

	.search-input-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border-primary);
	}

	.search-icon {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-size: 1rem;
		outline: none;
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--text-tertiary);
	}

	.esc-hint {
		font-size: 0.5625rem;
		padding: 2px 6px;
		border: 1px solid var(--border-primary);
		border-radius: 4px;
		color: var(--text-tertiary);
		background: var(--bg-surface-hover);
		font-family: 'Geist Mono', monospace;
	}

	.search-results {
		max-height: 400px;
		overflow-y: auto;
	}

	.search-status,
	.search-hint {
		padding: 24px;
		text-align: center;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.result-item {
		display: flex;
		gap: 10px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--border-primary);
		transition: background 0.1s;
	}

	.result-item:last-child {
		border-bottom: none;
	}

	.result-item:hover,
	.result-item.active {
		background: var(--bg-surface-hover);
	}

	.result-item.active {
		outline: 2px solid var(--accent-primary);
		outline-offset: -2px;
	}

	.result-badge {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.result-title a {
		color: inherit;
		text-decoration: none;
	}

	.result-title a:hover {
		text-decoration: underline;
	}

	.result-desc {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-meta {
		display: flex;
		gap: 8px;
		margin-top: 4px;
		font-size: 0.5625rem;
	}

	.result-category {
		font-weight: 700;
		text-transform: uppercase;
		color: var(--accent-primary);
		letter-spacing: 0.05em;
	}

	.result-municipality {
		color: var(--text-tertiary);
	}
</style>
