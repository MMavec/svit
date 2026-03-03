<script lang="ts">
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import {
		councillors,
		getCouncillorsByMunicipality,
		searchCouncillors
	} from '$lib/config/councillors';
	import { getMunicipality } from '$lib/config/municipalities';
	import type { Councillor } from '$lib/types/index';

	let searchQuery = $state('');
	let selectedCouncillor = $state<Councillor | null>(null);

	const filteredCouncillors = $derived(() => {
		let list: Councillor[];
		if (searchQuery.trim()) {
			list = searchCouncillors(searchQuery);
		} else if (municipalityStore.isAllCRD) {
			list = councillors.filter((c) => c.active);
		} else {
			list = getCouncillorsByMunicipality(municipalityStore.slug!);
		}

		// Group: mayors first, then councillors
		return list.sort((a, b) => {
			if (a.role === 'mayor' && b.role !== 'mayor') return -1;
			if (b.role === 'mayor' && a.role !== 'mayor') return 1;
			return a.lastName.localeCompare(b.lastName);
		});
	});

	function getMunicipalityColor(slug: string): string {
		return getMunicipality(slug)?.color || 'var(--accent-primary)';
	}

	function getMunicipalityName(slug: string): string {
		return getMunicipality(slug)?.abbreviation || slug;
	}

	function selectCouncillor(c: Councillor) {
		selectedCouncillor = selectedCouncillor?.id === c.id ? null : c;
	}
</script>

<div class="councillor-profiles">
	<div class="search-bar">
		<input
			type="text"
			placeholder="Search councillors..."
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>

	{#if selectedCouncillor}
		<!-- Councillor drilldown view -->
		<div class="drilldown">
			<button class="back-btn" onclick={() => (selectedCouncillor = null)}> &larr; Back </button>
			<div class="profile-header">
				<div class="profile-avatar">
					{selectedCouncillor.firstName.charAt(0)}{selectedCouncillor.lastName.charAt(0)}
				</div>
				<div class="profile-info">
					<div class="profile-name">{selectedCouncillor.name}</div>
					<div class="profile-role">
						<span
							class="role-badge"
							style="background: {getMunicipalityColor(selectedCouncillor.municipality)}"
						>
							{selectedCouncillor.role === 'mayor' ? 'Mayor' : 'Councillor'}
						</span>
						<span class="muni-name">
							{getMunicipality(selectedCouncillor.municipality)?.name ||
								selectedCouncillor.municipality}
						</span>
					</div>
				</div>
			</div>

			{#if selectedCouncillor.email}
				<div class="profile-detail">
					<span class="detail-label">Email</span>
					<a href="mailto:{selectedCouncillor.email}" class="detail-value"
						>{selectedCouncillor.email}</a
					>
				</div>
			{/if}

			{#if selectedCouncillor.committees && selectedCouncillor.committees.length > 0}
				<div class="profile-detail">
					<span class="detail-label">Committees</span>
					<div class="committee-list">
						{#each selectedCouncillor.committees as committee (committee)}
							<span class="committee-badge">{committee}</span>
						{/each}
					</div>
				</div>
			{/if}

			<div class="activity-section">
				<div class="section-label">Activity Timeline</div>
				<div class="activity-placeholder">
					Activity data will populate from council meeting minutes, social media feeds, and news
					mentions.
				</div>
			</div>
		</div>
	{:else}
		<!-- Councillor list view -->
		<div class="councillor-list">
			{#each filteredCouncillors() as councillor (councillor.id)}
				<button class="councillor-item" onclick={() => selectCouncillor(councillor)}>
					<div
						class="councillor-avatar"
						style="background: {getMunicipalityColor(councillor.municipality)}"
					>
						{councillor.firstName.charAt(0)}{councillor.lastName.charAt(0)}
					</div>
					<div class="councillor-info">
						<span class="councillor-name">{councillor.name}</span>
						<span class="councillor-role">
							{councillor.role === 'mayor' ? 'Mayor' : 'Cllr'} —
							{getMunicipalityName(councillor.municipality)}
						</span>
					</div>
				</button>
			{:else}
				<div class="empty">No councillors found</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.councillor-profiles {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.search-bar {
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.search-input {
		width: 100%;
		padding: 6px 10px;
		font-size: 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--bg-surface);
		color: var(--text-primary);
		outline: none;
	}

	.search-input:focus {
		border-color: var(--accent-primary);
	}

	.search-input::placeholder {
		color: var(--text-tertiary);
	}

	.councillor-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
		flex: 1;
	}

	.councillor-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: 8px;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		color: inherit;
		transition: background 0.2s;
		width: 100%;
	}

	.councillor-item:hover {
		background: var(--bg-surface-hover);
	}

	.councillor-avatar,
	.profile-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6875rem;
		font-weight: 700;
		color: white;
		flex-shrink: 0;
	}

	.profile-avatar {
		width: 48px;
		height: 48px;
		font-size: 0.875rem;
		background: var(--accent-primary);
	}

	.councillor-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.councillor-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.councillor-role {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	/* === Drilldown === */
	.drilldown {
		display: flex;
		flex-direction: column;
		gap: 10px;
		overflow-y: auto;
		flex: 1;
	}

	.back-btn {
		align-self: flex-start;
		padding: 2px 8px;
		font-size: 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.back-btn:hover {
		background: var(--bg-surface-hover);
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.profile-info {
		flex: 1;
	}

	.profile-name {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.profile-role {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 2px;
	}

	.role-badge {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 4px;
		color: white;
		text-transform: uppercase;
	}

	.muni-name {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.profile-detail {
		padding: 6px 0;
		border-bottom: 1px solid var(--border-primary);
	}

	.detail-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-tertiary);
		display: block;
		margin-bottom: 2px;
	}

	.detail-value {
		font-size: 0.8125rem;
		color: var(--accent-primary);
		text-decoration: none;
	}

	.detail-value:hover {
		text-decoration: underline;
	}

	.committee-list {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.committee-badge {
		font-size: 0.6875rem;
		padding: 2px 8px;
		border-radius: 4px;
		background: var(--bg-surface-hover);
		color: var(--text-secondary);
	}

	.activity-section {
		margin-top: 4px;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-tertiary);
		margin-bottom: 6px;
	}

	.activity-placeholder {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-style: italic;
		padding: 12px;
		text-align: center;
		border: 1px dashed var(--border-primary);
		border-radius: 8px;
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
