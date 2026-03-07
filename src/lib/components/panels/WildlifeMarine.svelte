<script lang="ts">
	import { fetchWildlifeSightings } from '$lib/api/wildlife';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
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
				<div class="sighting-card">
					<div class="sighting-header">
						<span class="cat-badge" style="background: {wildlifeCategoryColor(sighting.category)}">
							{categoryIcon(sighting.category)}
						</span>
						<span class="cat-label" style="color: {wildlifeCategoryColor(sighting.category)}">
							{categoryLabel(sighting.category)}
						</span>
						<span class="sighting-time">{timeAgo(sighting.observedAt)}</span>
					</div>
					<div class="sighting-name">{sighting.commonName}</div>
					<div class="sighting-species">{sighting.species}</div>
					<div class="sighting-footer">
						{#if sighting.location}
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
</style>
