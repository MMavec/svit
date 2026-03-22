<script lang="ts">
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import {
		councillors,
		getCouncillorsByMunicipality,
		searchCouncillors
	} from '$lib/config/councillors';
	import { getMunicipality } from '$lib/config/municipalities';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
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

	type ActivityFilter = 'all' | 'council' | 'social' | 'news';

	let searchQuery = $state('');
	let selectedCouncillor = $state<Councillor | null>(null);
	let activityItems = $state<ActivityItem[]>([]);
	let activityLoading = $state(false);
	let activeFilter = $state<ActivityFilter>('all');

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

	const filteredActivityItems = $derived.by(() => {
		if (activeFilter === 'all') return activityItems;
		return activityItems.filter((item) => item.type === activeFilter);
	});

	function getMunicipalityColor(slug: string): string {
		return getMunicipality(slug)?.color || 'var(--accent-primary)';
	}

	function getMunicipalityName(slug: string): string {
		return getMunicipality(slug)?.abbreviation || slug;
	}

	function selectCouncillor(c: Councillor) {
		selectedCouncillor = selectedCouncillor?.id === c.id ? null : c;
		activeFilter = 'all';
	}

	function socialProfileCount(councillor: Councillor): number {
		if (!councillor.social) return 0;
		const s = councillor.social;
		let count = 0;
		if (s.twitter) count++;
		if (s.facebook) count++;
		if (s.instagram) count++;
		if (s.bluesky) count++;
		if (s.website) count++;
		return count;
	}

	function showMunicipalityOnMap(councillor: Councillor) {
		const muni = getMunicipality(councillor.municipality);
		if (!muni) return;
		const bbox = muni.bbox;
		const lng = (bbox[0] + bbox[2]) / 2;
		const lat = (bbox[1] + bbox[3]) / 2;
		const roleName = councillor.role === 'mayor' ? 'Mayor' : 'Councillor';
		mapFocusStore.focus({
			coordinates: [lng, lat],
			title: muni.name,
			description: `${roleName} ${councillor.name}`,
			color: muni.color,
			zoom: 13
		});
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
			placeholder="Search councillors and mayors..."
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

			{#if selectedCouncillor.social}
				<div class="social-links">
					{#if selectedCouncillor.social.twitter}
						<a
							href="https://twitter.com/{selectedCouncillor.social.twitter}"
							target="_blank"
							rel="noopener noreferrer"
							class="social-link twitter"
							title="Twitter/X">X</a
						>
					{/if}
					{#if selectedCouncillor.social.facebook}
						<a
							href="https://facebook.com/{selectedCouncillor.social.facebook}"
							target="_blank"
							rel="noopener noreferrer"
							class="social-link facebook"
							title="Facebook">FB</a
						>
					{/if}
					{#if selectedCouncillor.social.instagram}
						<a
							href="https://instagram.com/{selectedCouncillor.social.instagram}"
							target="_blank"
							rel="noopener noreferrer"
							class="social-link instagram"
							title="Instagram">IG</a
						>
					{/if}
					{#if selectedCouncillor.social.bluesky}
						<a
							href="https://bsky.app/profile/{selectedCouncillor.social.bluesky}"
							target="_blank"
							rel="noopener noreferrer"
							class="social-link bluesky"
							title="Bluesky">BS</a
						>
					{/if}
					{#if selectedCouncillor.social.website}
						<a
							href={selectedCouncillor.social.website}
							target="_blank"
							rel="noopener noreferrer"
							class="social-link website"
							title="Website">WEB</a
						>
					{/if}
				</div>
			{/if}

			<div class="profile-actions">
				{#if selectedCouncillor.email}
					<a href="mailto:{selectedCouncillor.email}" class="detail-value"
						>{selectedCouncillor.email}</a
					>
				{/if}
				<button
					class="map-btn"
					onclick={() => showMunicipalityOnMap(selectedCouncillor!)}
					title="Show on map"
					aria-label="Show {getMunicipality(selectedCouncillor.municipality)?.name ||
						selectedCouncillor.municipality} on map"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					Map
				</button>
			</div>

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
				<div class="filter-chips">
					<button
						class="filter-chip"
						class:active={activeFilter === 'all'}
						onclick={() => (activeFilter = 'all')}>All</button
					>
					<button
						class="filter-chip"
						class:active={activeFilter === 'council'}
						style="--chip-color: {activityTypeColor('council')}"
						onclick={() => (activeFilter = 'council')}>Council</button
					>
					<button
						class="filter-chip"
						class:active={activeFilter === 'social'}
						style="--chip-color: {activityTypeColor('social')}"
						onclick={() => (activeFilter = 'social')}>Social</button
					>
					<button
						class="filter-chip"
						class:active={activeFilter === 'news'}
						style="--chip-color: {activityTypeColor('news')}"
						onclick={() => (activeFilter = 'news')}>News</button
					>
				</div>
				{#if activityLoading}
					<div class="activity-loading">Scanning news, social, and council data...</div>
				{:else if filteredActivityItems.length === 0}
					<div class="activity-empty">
						{#if activeFilter !== 'all' && activityItems.length > 0}
							No {activeFilter} activity found
						{:else}
							No recent activity found
						{/if}
					</div>
				{:else}
					<div class="activity-timeline">
						{#each filteredActivityItems as item, i (i)}
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
						<span class="councillor-name">
							{councillor.name}
							{#if socialProfileCount(councillor) > 0}
								<span
									class="social-indicator"
									title="{socialProfileCount(councillor)} social {socialProfileCount(councillor) ===
									1
										? 'profile'
										: 'profiles'}"
								>
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
										<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
										<path d="M13.73 21a2 2 0 0 1-3.46 0" />
									</svg>
									{socialProfileCount(councillor)}
								</span>
							{/if}
						</span>
						<span class="councillor-role">
							{councillor.role === 'mayor' ? 'Mayor' : 'Cllr'},
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
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.social-indicator {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 0.5625rem;
		font-weight: 500;
		color: var(--text-tertiary);
		opacity: 0.7;
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

	/* === Social Links === */
	.social-links {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.social-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 0.625rem;
		font-weight: 700;
		text-decoration: none;
		letter-spacing: 0.03em;
		color: #fff;
		transition: opacity 0.15s;
	}

	.social-link:hover {
		opacity: 0.85;
	}

	.social-link.twitter {
		background: #1da1f2;
	}

	.social-link.facebook {
		background: #1877f2;
	}

	.social-link.instagram {
		background: #e4405f;
	}

	.social-link.bluesky {
		background: #0085ff;
	}

	.social-link.website {
		background: var(--text-secondary);
	}

	/* === Profile Actions (email + map) === */
	.profile-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 0;
		border-bottom: 1px solid var(--border-primary);
	}

	.map-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		border-radius: 5px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
		margin-left: auto;
	}

	.map-btn:hover {
		color: var(--accent-primary);
		border-color: var(--accent-primary);
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

	/* === Filter Chips === */
	.filter-chips {
		display: flex;
		gap: 4px;
		margin-bottom: 8px;
	}

	.filter-chip {
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 0.625rem;
		font-weight: 600;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.filter-chip:hover {
		background: var(--bg-surface-hover);
	}

	.filter-chip.active {
		background: var(--chip-color, var(--text-secondary));
		color: #fff;
		border-color: var(--chip-color, var(--text-secondary));
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
