<script lang="ts">
	import { fetchFamilyActivities } from '$lib/api/family-activities';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { FamilyActivity } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import { isValidHttpUrl } from '$lib/utils/sanitize';

	let activities = $state<FamilyActivity[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = null;
		const result = await fetchFamilyActivities({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			activities = result.data || [];
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		loadData();
	});

	function categoryIcon(cat: FamilyActivity['category']): string {
		switch (cat) {
			case 'swimming':
				return 'S';
			case 'playground':
				return 'P';
			case 'library':
				return 'L';
			case 'arts':
				return 'A';
			case 'sports':
				return 'G';
			case 'nature':
				return 'N';
			case 'education':
				return 'E';
			case 'outdoor':
				return 'O';
			case 'indoor':
				return 'I';
			default:
				return '?';
		}
	}

	function categoryColor(cat: FamilyActivity['category']): string {
		switch (cat) {
			case 'swimming':
				return '#457b9d';
			case 'playground':
				return '#e07a5f';
			case 'library':
				return '#5e548e';
			case 'arts':
				return '#c77f32';
			case 'sports':
				return '#2d6a4f';
			case 'nature':
				return '#6b8f3c';
			case 'education':
				return '#264653';
			case 'outdoor':
				return '#588157';
			case 'indoor':
				return '#bc4749';
			default:
				return '#6c757d';
		}
	}
</script>

<div class="family-activities">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadData} />
	{:else if activities.length === 0}
		<div class="empty" role="status">No family activities found</div>
	{:else}
		<div class="activity-list">
			{#each activities as activity (activity.id)}
				<div class="activity-card">
					<div class="activity-header">
						<span class="cat-badge" style="background: {categoryColor(activity.category)}">
							{categoryIcon(activity.category)}
						</span>
						{#if activity.ageRange}
							<span class="age-badge">{activity.ageRange}</span>
						{/if}
						{#if activity.free}
							<span class="free-badge">FREE</span>
						{/if}
						{#if activity.recurring}
							<span class="recurring-badge">Recurring</span>
						{/if}
					</div>
					<div class="activity-title">
						{#if isValidHttpUrl(activity.url)}
							<a href={activity.url} target="_blank" rel="noopener noreferrer">{activity.title}</a>
						{:else}
							{activity.title}
						{/if}
					</div>
					{#if activity.description}
						<div class="activity-desc">{activity.description}</div>
					{/if}
					<div class="activity-footer">
						<span class="activity-location">{activity.location}</span>
						{#if activity.time}
							<span class="activity-time">{activity.time}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.family-activities {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.activity-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.activity-card:hover {
		background: var(--bg-surface-elevated);
	}

	.activity-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.cat-badge {
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
	}

	.recurring-badge {
		font-size: 0.5rem;
		color: var(--accent-primary);
		font-weight: 600;
		margin-left: auto;
	}

	.activity-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.activity-title a {
		color: inherit;
		text-decoration: none;
	}

	.activity-title a:hover {
		color: var(--accent-primary);
	}

	.activity-desc {
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

	.activity-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 4px;
		font-size: 0.625rem;
	}

	.activity-location {
		color: var(--text-tertiary);
	}

	.activity-time {
		color: var(--text-tertiary);
		font-family: 'Geist Mono', monospace;
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
