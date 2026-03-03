<script lang="ts">
	import { searchStore } from '$lib/stores/search.svelte';

	let inputEl = $state<HTMLInputElement | null>(null);

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
	}

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

	function categoryColor(cat: string): string {
		switch (cat) {
			case 'Council':
				return 'var(--accent-primary)';
			case 'News':
				return 'var(--accent-warning, #f6ad55)';
			case 'Development':
				return '#fc8181';
			case 'Event':
				return '#68d391';
			case 'Safety':
				return '#e53e3e';
			default:
				return 'var(--text-tertiary)';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if searchStore.isOpen}
	<div class="overlay-backdrop" onclick={() => searchStore.close()} role="presentation">
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="overlay-container" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
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

			<div class="search-results" aria-live="polite">
				{#if searchStore.searching}
					<div class="search-status">Searching...</div>
				{:else if searchStore.query.length > 0 && searchStore.results.length === 0}
					<div class="search-status">No results for "{searchStore.query}"</div>
				{:else if searchStore.results.length > 0}
					{#each searchStore.results as result (result.id)}
						<div class="result-item">
							<span class="result-badge" style="background: {categoryColor(result.category)}">
								{categoryIcon(result.category)}
							</span>
							<div class="result-info">
								<div class="result-title">
									{#if result.url}
										<a
											href={result.url}
											target="_blank"
											rel="noopener"
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

	.result-item:hover {
		background: var(--bg-surface-hover);
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
