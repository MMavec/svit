<script lang="ts">
	import { fetchParks } from '$lib/api/parks';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { ParkFacility } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { isValidHttpUrl } from '$lib/utils/sanitize';

	let facilities = $state<ParkFacility[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeFilter = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchParks({
			municipality: municipalityStore.slug,
			type: activeFilter || undefined
		});
		if (result.error) {
			error = result.error;
		} else {
			facilities = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		const _filter = activeFilter;
		loadData();
	});

	const filters = [
		{ label: 'All', value: null },
		{ label: 'Pools', value: 'pool' },
		{ label: 'Parks', value: 'park' },
		{ label: 'Playgrounds', value: 'playground' },
		{ label: 'Beaches', value: 'beach' },
		{ label: 'Trails', value: 'trail' }
	];

	function typeIcon(type: ParkFacility['type']): string {
		switch (type) {
			case 'park':
				return 'P';
			case 'playground':
				return 'Y';
			case 'splash-pad':
				return 'S';
			case 'pool':
				return 'W';
			case 'rec-centre':
				return 'R';
			case 'sports-field':
				return 'F';
			case 'trail':
				return 'T';
			case 'beach':
				return 'B';
			default:
				return '?';
		}
	}

	function typeColor(type: ParkFacility['type']): string {
		switch (type) {
			case 'park':
				return '#2d6a4f';
			case 'playground':
				return '#e07a5f';
			case 'splash-pad':
				return '#457b9d';
			case 'pool':
				return '#264653';
			case 'rec-centre':
				return '#5e548e';
			case 'sports-field':
				return '#6b8f3c';
			case 'trail':
				return '#588157';
			case 'beach':
				return '#c77f32';
			default:
				return '#6c757d';
		}
	}

	function typeLabel(type: ParkFacility['type']): string {
		switch (type) {
			case 'park':
				return 'Park';
			case 'playground':
				return 'Playground';
			case 'splash-pad':
				return 'Splash Pad';
			case 'pool':
				return 'Pool';
			case 'rec-centre':
				return 'Rec Centre';
			case 'sports-field':
				return 'Sports';
			case 'trail':
				return 'Trail';
			case 'beach':
				return 'Beach';
			default:
				return type;
		}
	}
</script>

<div class="parks">
	<div class="filters">
		{#each filters as filter (filter.label)}
			<button
				class="filter-btn"
				class:active={activeFilter === filter.value}
				onclick={() => {
					activeFilter = filter.value;
				}}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if facilities.length === 0}
		<div class="empty" role="status">No facilities found</div>
	{:else}
		<div class="facility-list">
			{#each facilities as facility (facility.id)}
				<div class="facility-card">
					<div class="facility-header">
						<span class="type-badge" style="background: {typeColor(facility.type)}">
							{typeIcon(facility.type)}
						</span>
						<span class="type-label">{typeLabel(facility.type)}</span>
						{#if facility.amenities && facility.amenities.length > 0}
							<span class="amenity-count">{facility.amenities.length} amenities</span>
						{/if}
					</div>
					<div class="facility-name">
						{#if isValidHttpUrl(facility.url)}
							<a href={facility.url} target="_blank" rel="noopener noreferrer">{facility.name}</a>
						{:else}
							{facility.name}
						{/if}
					</div>
					<div class="facility-desc">{facility.description}</div>
					{#if facility.amenities && facility.amenities.length > 0}
						<div class="amenity-tags">
							{#each facility.amenities.slice(0, 4) as amenity (amenity)}
								<span class="amenity-tag">{amenity}</span>
							{/each}
							{#if facility.amenities.length > 4}
								<span class="amenity-tag more">+{facility.amenities.length - 4}</span>
							{/if}
						</div>
					{/if}
					{#if facility.address}
						<div class="facility-address">{facility.address}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.parks {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 6px;
	}

	.filters {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 3px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-subtle);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.625rem;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}

	.filter-btn:hover {
		background: var(--bg-surface-hover);
	}

	.filter-btn.active {
		background: var(--accent-primary);
		color: #fff;
		border-color: var(--accent-primary);
	}

	.facility-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.facility-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.facility-card:hover {
		background: var(--bg-surface-elevated);
	}

	.facility-header {
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

	.amenity-count {
		font-size: 0.5rem;
		color: var(--text-tertiary);
		margin-left: auto;
	}

	.facility-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.facility-name a {
		color: inherit;
		text-decoration: none;
	}

	.facility-name a:hover {
		color: var(--accent-primary);
	}

	.facility-desc {
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

	.amenity-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		margin-top: 4px;
	}

	.amenity-tag {
		font-size: 0.5rem;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--bg-surface-elevated);
		color: var(--text-tertiary);
	}

	.amenity-tag.more {
		color: var(--accent-primary);
		font-weight: 600;
	}

	.facility-address {
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
