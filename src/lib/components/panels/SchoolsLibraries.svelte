<script lang="ts">
	import { fetchSchoolsLibraries } from '$lib/api/schools-libraries';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { SchoolLibraryItem } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { isValidHttpUrl } from '$lib/utils/sanitize';

	let items = $state<SchoolLibraryItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchSchoolsLibraries({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			items = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function typeIcon(type: SchoolLibraryItem['type']): string {
		switch (type) {
			case 'library':
				return 'L';
			case 'school':
				return 'S';
			case 'program':
				return 'P';
			case 'event':
				return 'E';
			default:
				return '?';
		}
	}

	function typeColor(type: SchoolLibraryItem['type']): string {
		switch (type) {
			case 'library':
				return '#5e548e';
			case 'school':
				return '#264653';
			case 'program':
				return '#e07a5f';
			case 'event':
				return '#c77f32';
			default:
				return '#6c757d';
		}
	}

	function typeLabel(type: SchoolLibraryItem['type']): string {
		switch (type) {
			case 'library':
				return 'Library';
			case 'school':
				return 'School District';
			case 'program':
				return 'Program';
			case 'event':
				return 'Event';
			default:
				return type;
		}
	}
</script>

<div class="schools-libraries">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if items.length === 0}
		<div class="empty" role="status">No items found</div>
	{:else}
		<div class="item-list">
			{#each items as item (item.id)}
				<div class="item-card">
					<div class="item-header">
						<span class="type-badge" style="background: {typeColor(item.type)}">
							{typeIcon(item.type)}
						</span>
						<span class="type-label">{typeLabel(item.type)}</span>
						{#if item.ageRange}
							<span class="age-badge">Ages {item.ageRange}</span>
						{/if}
						{#if item.free}
							<span class="free-badge">FREE</span>
						{/if}
					</div>
					<div class="item-name">
						{#if isValidHttpUrl(item.url)}
							<a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>
						{:else}
							{item.name}
						{/if}
					</div>
					<div class="item-desc">{item.description}</div>
					{#if item.address}
						<div class="item-address">{item.address}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.schools-libraries {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.item-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.item-card:hover {
		background: var(--bg-surface-elevated);
	}

	.item-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.type-badge {
		width: 20px;
		height: 20px;
		border-radius: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5625rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.type-label {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.age-badge {
		font-size: 0.5rem;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--bg-surface-elevated);
		color: var(--text-secondary);
		font-weight: 600;
	}

	.free-badge {
		font-size: 0.5rem;
		font-weight: 700;
		color: var(--accent-secondary);
		background: rgba(104, 211, 145, 0.15);
		padding: 1px 4px;
		border-radius: 3px;
		letter-spacing: 0.05em;
		margin-left: auto;
	}

	.item-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.item-name a {
		color: inherit;
		text-decoration: none;
	}

	.item-name a:hover {
		color: var(--accent-primary);
	}

	.item-desc {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-top: 2px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.item-address {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		margin-top: 4px;
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
