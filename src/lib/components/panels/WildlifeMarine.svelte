<script lang="ts">
	import { fetchWildlifeSightings } from '$lib/api/wildlife';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { WildlifeSighting } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { wildlifeCategoryColor } from '$lib/utils/color-maps';

	let sightings = $state<WildlifeSighting[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchWildlifeSightings({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			sightings = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function categoryIcon(cat: WildlifeSighting['category']): string {
		switch (cat) {
			case 'bird':
				return 'B';
			case 'marine-mammal':
				return 'M';
			case 'mammal':
				return 'M';
			case 'fish':
				return 'F';
			case 'invertebrate':
				return 'I';
			case 'reptile':
				return 'R';
			case 'plant':
				return 'P';
			default:
				return 'O';
		}
	}

	function categoryLabel(cat: WildlifeSighting['category']): string {
		switch (cat) {
			case 'bird':
				return 'Bird';
			case 'marine-mammal':
				return 'Marine';
			case 'mammal':
				return 'Mammal';
			case 'fish':
				return 'Fish';
			case 'invertebrate':
				return 'Invert.';
			case 'reptile':
				return 'Reptile';
			case 'plant':
				return 'Plant';
			default:
				return 'Other';
		}
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	function isMarine(cat: WildlifeSighting['category']): boolean {
		return cat === 'marine-mammal';
	}

	function showOnMap(sighting: WildlifeSighting) {
		if (!sighting.coordinates) return;
		mapFocusStore.focus({
			coordinates: sighting.coordinates,
			title: sighting.commonName,
			description: sighting.location || sighting.species,
			color: '#805ad5',
			zoom: 13
		});
		// Scroll to the map at the top of the page
		const mapEl = document.querySelector('.hero-map');
		if (mapEl) {
			mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<div class="wildlife">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if sightings.length === 0}
		<div class="empty" role="status">No recent sightings</div>
	{:else}
		<div class="sighting-list">
			{#each sightings as sighting (sighting.id)}
				<div class="sighting-card" class:marine-card={isMarine(sighting.category)}>
					{#if isMarine(sighting.category)}
						<div class="marine-alert-label">
							<span class="marine-alert-badge">Whale Alert</span>
							<span class="marine-wave-indicator"></span>
						</div>
					{/if}
					<div class="sighting-header">
						<span class="cat-badge" style="background: {wildlifeCategoryColor(sighting.category)}">
							{categoryIcon(sighting.category)}
						</span>
						<span class="cat-label" style="color: {wildlifeCategoryColor(sighting.category)}">
							{categoryLabel(sighting.category)}
						</span>
						<span class="sighting-time">{timeAgo(sighting.observedAt)}</span>
						{#if sighting.coordinates}
							<button
								class="show-on-map-btn"
								onclick={() => showOnMap(sighting)}
								title="Show on map"
								aria-label="Show {sighting.commonName} on map"
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
							</button>
						{/if}
					</div>
					<div class="sighting-name">{sighting.commonName}</div>
					<div class="sighting-species">{sighting.species}</div>
					{#if isMarine(sighting.category) && sighting.location}
						<div class="marine-location">
							<svg
								width="10"
								height="10"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
							{sighting.location}
						</div>
					{/if}
					<div class="sighting-footer">
						{#if !isMarine(sighting.category) && sighting.location}
							<span class="sighting-location">{sighting.location}</span>
						{/if}
						{#if sighting.observer}
							<span class="sighting-observer">@{sighting.observer}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wildlife {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.sighting-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.sighting-card {
		padding: 8px;
		padding-left: 10px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.sighting-card:hover {
		background: var(--bg-surface-elevated);
	}

	.sighting-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
	}

	.cat-badge {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5625rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.cat-label {
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.sighting-time {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		margin-left: auto;
	}

	.sighting-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.sighting-species {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.sighting-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 3px;
		font-size: 0.625rem;
	}

	.sighting-location {
		color: var(--text-secondary);
	}

	.sighting-observer {
		color: var(--accent-primary);
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

	/* Marine mammal card enhancements */
	.marine-card {
		border-left: 3px solid #805ad5;
	}

	.marine-alert-label {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.marine-alert-badge {
		display: inline-block;
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 3px;
		background: #805ad5;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.marine-wave-indicator {
		display: inline-block;
		width: 24px;
		height: 3px;
		border-radius: 2px;
		background: linear-gradient(90deg, #805ad5 0%, #63b3ed 50%, #805ad5 100%);
		opacity: 0.6;
	}

	.marine-location {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #805ad5;
		margin-top: 3px;
	}

	.marine-location svg {
		flex-shrink: 0;
		stroke: #805ad5;
	}

	/* Show on map button */
	.show-on-map-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-tertiary);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
	}

	.show-on-map-btn:hover {
		color: #805ad5;
		border-color: #805ad5;
		background: var(--bg-surface-hover);
	}
</style>
