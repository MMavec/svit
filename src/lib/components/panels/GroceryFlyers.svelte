<script lang="ts">
	import { fetchFlyers } from '$lib/api/flyers';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { GroceryFlyer } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let flyers = $state<GroceryFlyer[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchFlyers({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			flyers = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function formatDateRange(from: string, to: string): string {
		const f = new Date(from);
		const t = new Date(to);
		const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return `${f.toLocaleDateString('en-CA', opts)} – ${t.toLocaleDateString('en-CA', opts)}`;
	}

	function storeIcon(slug: string): string {
		switch (slug) {
			case 'thrifty-foods':
				return 'T';
			case 'save-on-foods':
				return 'S';
			case 'fairway-market':
				return 'F';
			case 'country-grocer':
				return 'C';
			case 'red-barn-market':
				return 'R';
			case 'peppers-foods':
				return 'P';
			default:
				return slug.charAt(0).toUpperCase();
		}
	}

	function storeColor(slug: string): string {
		switch (slug) {
			case 'thrifty-foods':
				return '#e63946';
			case 'save-on-foods':
				return '#2d6a4f';
			case 'fairway-market':
				return '#457b9d';
			case 'country-grocer':
				return '#6b705c';
			case 'red-barn-market':
				return '#bc4749';
			case 'peppers-foods':
				return '#e07a5f';
			default:
				return '#6c757d';
		}
	}
</script>

<div class="flyers">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if flyers.length === 0}
		<div class="empty" role="status">No flyers available right now</div>
	{:else}
		<div class="flyer-list">
			{#each flyers as flyer (flyer.id)}
				<a href={flyer.flyerUrl} target="_blank" rel="noopener noreferrer" class="flyer-card">
					<span class="store-badge" style="background: {storeColor(flyer.storeSlug)}">
						{storeIcon(flyer.storeSlug)}
					</span>
					<div class="flyer-info">
						<div class="store-name">{flyer.store}</div>
						<div class="flyer-title">{flyer.title}</div>
						<div class="flyer-dates">{formatDateRange(flyer.validFrom, flyer.validTo)}</div>
					</div>
					<span class="view-icon" aria-hidden="true">&#8599;</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.flyers {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.flyer-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
		flex: 1;
	}

	.flyer-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.flyer-card:hover {
		background: var(--bg-surface-elevated);
	}

	.store-badge {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.flyer-info {
		flex: 1;
		min-width: 0;
	}

	.store-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.flyer-title {
		font-size: 0.6875rem;
		color: var(--text-secondary);
	}

	.flyer-dates {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-family: 'Geist Mono', monospace;
		margin-top: 2px;
	}

	.view-icon {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
