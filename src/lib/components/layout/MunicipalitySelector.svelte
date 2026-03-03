<script lang="ts">
	import { municipalities } from '$lib/config/municipalities';
	import { municipalityStore } from '$lib/stores/municipality.svelte';

	let open = $state(false);

	function select(slug: string | null) {
		municipalityStore.select(slug);
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="municipality-selector">
	<button
		class="selector-trigger"
		onclick={() => (open = !open)}
		aria-expanded={open}
		aria-haspopup="listbox"
	>
		{#if municipalityStore.current}
			<span class="dot" style="background:{municipalityStore.color}"></span>
		{/if}
		<span class="label">{municipalityStore.label}</span>
		<svg
			class="chevron"
			class:open
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<polyline points="3,4.5 6,7.5 9,4.5" />
		</svg>
	</button>

	{#if open}
		<div class="backdrop" role="presentation" onclick={() => (open = false)}></div>
		<div class="dropdown" role="listbox" aria-label="Select municipality">
			<button
				class="option"
				class:selected={municipalityStore.isAllCRD}
				onclick={() => select(null)}
				role="option"
				aria-selected={municipalityStore.isAllCRD}
			>
				<span class="dot all"></span>
				<span>All CRD</span>
			</button>
			{#each municipalities as m (m.slug)}
				<button
					class="option"
					class:selected={municipalityStore.slug === m.slug}
					onclick={() => select(m.slug)}
					role="option"
					aria-selected={municipalityStore.slug === m.slug}
				>
					<span class="dot" style="background:{m.color}"></span>
					<span>{m.name}</span>
					<span class="abbr">{m.abbreviation}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.municipality-selector {
		position: relative;
	}

	.selector-trigger {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		border-radius: 8px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}

	.selector-trigger:hover {
		border-color: var(--border-hover);
		background: var(--bg-surface-hover);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot.all {
		background: linear-gradient(135deg, #63b3ed, #68d391, #f6ad55);
	}

	.chevron {
		transition: transform 0.2s ease;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		min-width: 220px;
		max-height: 400px;
		overflow-y: auto;
		background: var(--bg-surface-elevated);
		backdrop-filter: var(--panel-backdrop);
		-webkit-backdrop-filter: var(--panel-backdrop);
		border: 1px solid var(--border-primary);
		border-radius: 10px;
		box-shadow: var(--panel-shadow);
		z-index: 100;
		padding: 4px;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-primary);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.15s ease;
		text-align: left;
	}

	.option:hover {
		background: var(--bg-surface-hover);
	}

	.option.selected {
		background: var(--bg-surface-hover);
		font-weight: 600;
	}

	.abbr {
		margin-left: auto;
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		font-family: 'Geist Mono', monospace;
	}
</style>
