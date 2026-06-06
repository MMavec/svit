<script lang="ts">
	import { fetchDevelopments } from '$lib/api/development';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { DevelopmentApplication } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import BookmarkButton from '$lib/components/ui/BookmarkButton.svelte';

	type Category = 'rezoning' | 'permit' | 'variance' | 'heritage' | 'other';

	let applications = $state<DevelopmentApplication[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let query = $state('');
	let activeCategory = $state<Category | null>(null);
	let flaggedOnly = $state(false);

	const CATEGORY_LABELS: Record<Category, string> = {
		rezoning: 'Rezoning',
		permit: 'Dev Permits',
		variance: 'Variances',
		heritage: 'Heritage',
		other: 'Other'
	};

	// NOTE: do NOT pass `flagged` here. Reading a $state inside the $effect's synchronous path
	// would make toggling it refetch (and surface transient network errors). All filtering is
	// client-side over the loaded set, which already carries a `flagged` boolean per application.
	async function loadDevelopments() {
		loading = true;
		error = null;
		const result = await fetchDevelopments({ municipality: municipalityStore.slug });
		if (result.error) {
			error = result.error;
		} else {
			applications = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		query = '';
		activeCategory = null;
		flaggedOnly = false;
		loadDevelopments();
	});

	function categoryOf(appType?: string): Category {
		const t = (appType || '').toLowerCase();
		if (t.includes('rezon')) return 'rezoning';
		if (t.includes('heritage')) return 'heritage';
		if (t.includes('variance') || t.includes('board of')) return 'variance';
		if (t.includes('permit')) return 'permit';
		return 'other';
	}

	const flaggedCount = $derived(applications.filter((a) => a.flagged).length);

	const categoryCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const a of applications) {
			const c = categoryOf(a.appType);
			counts[c] = (counts[c] ?? 0) + 1;
		}
		return counts;
	});

	const presentCategories = $derived(
		(Object.keys(CATEGORY_LABELS) as Category[]).filter((c) => (categoryCounts[c] ?? 0) > 0)
	);

	const displayed = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return applications.filter((a) => {
			if (flaggedOnly && !a.flagged) return false;
			if (activeCategory && categoryOf(a.appType) !== activeCategory) return false;
			if (q) {
				const hay = `${a.address} ${a.description} ${a.appType ?? ''}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	});

	function toggleCategory(c: Category) {
		activeCategory = activeCategory === c ? null : c;
	}

	function focusOnMap(a: DevelopmentApplication) {
		if (!a.coordinates) return;
		mapFocusStore.focus({
			coordinates: a.coordinates,
			title: a.address,
			description: a.appType || a.description,
			color: '#3182ce',
			zoom: 16
		});
	}

	function formatDate(iso?: string): string {
		if (!iso) return '';
		const d = new Date(`${iso}T00:00:00`);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="dev-watch">
	<div class="search-row">
		<input
			class="search"
			type="search"
			placeholder="Search address or application…"
			bind:value={query}
			aria-label="Search development applications"
		/>
		<button
			class="flag-toggle"
			class:active={flaggedOnly}
			aria-pressed={flaggedOnly}
			onclick={() => (flaggedOnly = !flaggedOnly)}
			title="Show only significant applications (rezonings, heritage, on-hold, large projects)"
		>
			Flagged
			{#if flaggedCount > 0}<span class="flag-count">{flaggedCount}</span>{/if}
		</button>
	</div>

	{#if loading}
		<PanelSkeleton variant="card" />
	{:else if error}
		<PanelError message={error} onRetry={loadDevelopments} />
	{:else}
		{#if presentCategories.length > 0}
			<div class="chips" role="group" aria-label="Filter by application type">
				{#each presentCategories as c (c)}
					<button
						class="chip"
						class:active={activeCategory === c}
						aria-pressed={activeCategory === c}
						onclick={() => toggleCategory(c)}
					>
						{CATEGORY_LABELS[c]}
						<span class="chip-count">{categoryCounts[c]}</span>
					</button>
				{/each}
			</div>
		{/if}

		<div class="summary">
			{displayed.length} of {applications.length} application{applications.length === 1 ? '' : 's'}
		</div>

		<div class="dev-list">
			{#each displayed as app (app.id)}
				<div
					class="dev-item"
					class:flagged={app.flagged}
					class:clickable={!!app.coordinates}
					role="button"
					tabindex="0"
					aria-label={app.coordinates ? `Show ${app.address} on map` : app.address}
					onclick={() => focusOnMap(app)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							focusOnMap(app);
						}
					}}
				>
					<div class="dev-header">
						<span class="addr">{app.address}</span>
						{#if app.flagged}<span class="flag-badge" title={app.flagReasons?.join(', ')}>!</span
							>{/if}
						<BookmarkButton
							itemType="development"
							externalId={app.id}
							title={app.address}
							description={app.description}
							municipality={app.municipality}
						/>
					</div>

					<div class="desc">{app.description}</div>

					<div class="meta">
						{#if app.appType}<span class="app-type">{app.appType}</span>{/if}
						{#if app.neighbourhood}<span class="bit">{app.neighbourhood}</span>{/if}
						{#if app.submittedDate}<span class="bit date">{formatDate(app.submittedDate)}</span
							>{/if}
						{#if app.documentUrl}
							<a
								class="track"
								href={app.documentUrl}
								target="_blank"
								rel="noopener noreferrer"
								onclick={(e) => e.stopPropagation()}>Track ↗</a
							>
						{/if}
					</div>

					{#if app.flagReasons && app.flagReasons.length > 0}
						<div class="flag-reasons">
							{#each app.flagReasons as reason, i (reason + '-' + i)}
								<span class="flag-reason">{reason}</span>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="empty" role="status">
					{#if query || activeCategory || flaggedOnly}
						No applications match this filter.
					{:else}
						No active development applications in this area.
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.dev-watch {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.search-row {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.search {
		flex: 1;
		min-width: 0;
		padding: 5px 10px;
		font-size: 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--bg-surface-hover);
		color: var(--text-primary);
	}

	.search:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.flag-toggle {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		font-size: 0.6875rem;
		font-weight: 600;
		border: 1px solid var(--accent-danger);
		border-radius: 6px;
		background: transparent;
		color: var(--accent-danger);
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.flag-toggle.active {
		background: var(--accent-danger);
		color: #fff;
	}

	.flag-count {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0 5px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		color: var(--text-secondary);
	}

	.flag-toggle.active .flag-count {
		background: rgba(255, 255, 255, 0.25);
		color: #fff;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 8px;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.chip:hover {
		border-color: var(--accent-primary);
		color: var(--text-primary);
	}

	.chip.active {
		border-color: var(--accent-primary);
		background: color-mix(in srgb, var(--accent-primary) 16%, transparent);
		color: var(--text-primary);
	}

	.chip-count {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.summary {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.dev-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.dev-item {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border-left: 3px solid var(--border-primary);
		text-align: left;
	}

	.dev-item.flagged {
		border-left-color: var(--accent-danger);
	}

	.dev-item.clickable {
		cursor: pointer;
		transition: background 0.15s;
	}

	.dev-item.clickable:hover {
		background: var(--bg-surface-active, var(--bg-surface-hover));
	}

	.dev-item:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 1px;
	}

	.dev-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.addr {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.flag-badge {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 900;
		border-radius: 50%;
		background: var(--accent-danger);
		color: #fff;
		flex-shrink: 0;
	}

	.desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.3;
		margin-bottom: 5px;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
	}

	.app-type {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 1px 7px;
		border: 1px solid var(--accent-primary);
		border-radius: 10px;
		color: var(--accent-primary);
	}

	.bit {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.bit.date {
		font-family: var(--font-mono, monospace);
	}

	.track {
		margin-left: auto;
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--accent-secondary);
		text-decoration: none;
		white-space: nowrap;
	}

	.track:hover {
		text-decoration: underline;
	}

	.flag-reasons {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 5px;
	}

	.flag-reason {
		font-size: 0.5625rem;
		font-weight: 600;
		padding: 1px 6px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--accent-danger) 14%, transparent);
		color: var(--accent-danger);
	}

	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
