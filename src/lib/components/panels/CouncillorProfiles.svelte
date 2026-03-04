<script lang="ts">
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import {
		councillors,
		getCouncillorsByMunicipality,
		searchCouncillors
	} from '$lib/config/councillors';
	import { getMunicipality } from '$lib/config/municipalities';
	import { fetchNews } from '$lib/api/news';
	import { fetchSocialPosts } from '$lib/api/social';
	import { fetchMeetings } from '$lib/api/council';
	import type { Councillor } from '$lib/types/index';

	interface ActivityItem {
		type: 'news' | 'social' | 'council';
		title: string;
		url?: string;
		source: string;
		date: string;
	}

	let searchQuery = $state('');
	let selectedCouncillor = $state<Councillor | null>(null);
	let activityItems = $state<ActivityItem[]>([]);
	let activityLoading = $state(false);

	const filteredCouncillors = $derived.by(() => {
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

	async function loadActivity(councillor: Councillor) {
		activityLoading = true;
		activityItems = [];
		const lastName = councillor.lastName.toLowerCase();
		const fullName = councillor.name.toLowerCase();
		const items: ActivityItem[] = [];

		const [newsRes, socialRes, meetingsRes] = await Promise.allSettled([
			fetchNews({ municipality: councillor.municipality, limit: 50 }),
			fetchSocialPosts({ municipality: councillor.municipality, limit: 50 }),
			fetchMeetings({ municipality: councillor.municipality, limit: 30 })
		]);

		if (newsRes.status === 'fulfilled' && newsRes.value.data) {
			for (const article of newsRes.value.data) {
				const text = `${article.title} ${article.description || ''}`.toLowerCase();
				if (text.includes(lastName) || text.includes(fullName)) {
					items.push({
						type: 'news',
						title: article.title,
						url: article.url,
						source: article.source || 'News',
						date: article.published
					});
				}
			}
		}

		if (socialRes.status === 'fulfilled' && socialRes.value.data) {
			for (const post of socialRes.value.data) {
				const text = `${post.content} ${post.author || ''}`.toLowerCase();
				if (text.includes(lastName) || text.includes(fullName)) {
					items.push({
						type: 'social',
						title: post.content.slice(0, 120) + (post.content.length > 120 ? '...' : ''),
						url: post.url,
						source: post.platform,
						date: post.published
					});
				}
			}
		}

		if (meetingsRes.status === 'fulfilled' && meetingsRes.value.data) {
			for (const meeting of meetingsRes.value.data) {
				items.push({
					type: 'council',
					title: meeting.title,
					url: meeting.agendaUrl || meeting.minutesUrl,
					source: meeting.body || 'Council',
					date: meeting.date
				});
			}
		}

		items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		activityItems = items.slice(0, 10);
		activityLoading = false;
	}

	$effect(() => {
		if (selectedCouncillor) {
			loadActivity(selectedCouncillor);
		}
	});

	function activityTypeLabel(type: ActivityItem['type']): string {
		switch (type) {
			case 'news':
				return 'News';
			case 'social':
				return 'Social';
			case 'council':
				return 'Council';
		}
	}

	function activityTypeColor(type: ActivityItem['type']): string {
		switch (type) {
			case 'news':
				return 'var(--accent-primary)';
			case 'social':
				return '#a78bfa';
			case 'council':
				return 'var(--accent-secondary)';
		}
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
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
				{#if activityLoading}
					<div class="activity-loading">Scanning news, social, and council data...</div>
				{:else if activityItems.length === 0}
					<div class="activity-empty">No recent activity found for this councillor</div>
				{:else}
					<div class="activity-timeline">
						{#each activityItems as item, i (i)}
							<div class="timeline-item">
								<span class="timeline-badge" style="background: {activityTypeColor(item.type)}"
									>{activityTypeLabel(item.type)}</span
								>
								<div class="timeline-body">
									{#if item.url}
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											class="timeline-title">{item.title}</a
										>
									{:else}
										<span class="timeline-title-plain">{item.title}</span>
									{/if}
									<div class="timeline-meta">
										<span class="timeline-source">{item.source}</span>
										<span class="timeline-date">{formatDate(item.date)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Councillor list view -->
		<div class="councillor-list">
			{#each filteredCouncillors as councillor (councillor.id)}
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
				<div class="empty" role="status">No councillors match your search</div>
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
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-tertiary);
		margin-bottom: 6px;
	}

	.activity-loading,
	.activity-empty {
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
		padding: 12px;
		text-align: center;
	}

	.activity-timeline {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.timeline-item {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		padding: 6px 8px;
		border-radius: 6px;
		background: var(--bg-surface-hover);
	}

	.timeline-badge {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.timeline-body {
		flex: 1;
		min-width: 0;
	}

	.timeline-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--accent-primary);
		text-decoration: none;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.3;
	}

	.timeline-title:hover {
		text-decoration: underline;
	}

	.timeline-title-plain {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-primary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.3;
	}

	.timeline-meta {
		display: flex;
		gap: 8px;
		margin-top: 2px;
		font-size: 0.75rem;
	}

	.timeline-source {
		color: var(--text-secondary);
	}

	.timeline-date {
		color: var(--text-tertiary);
		margin-left: auto;
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
