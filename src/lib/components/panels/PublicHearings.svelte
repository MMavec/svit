<script lang="ts">
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { PublicHearing } from '$lib/types/index';

	// Seed data — public hearings will come from council agenda scraping
	const seedHearings: PublicHearing[] = [
		{
			id: 'ph-vic-1',
			title: 'Rezoning Application — 1200 Douglas St',
			description:
				'Proposed rezoning from C-1 to CD-1 for 18-storey mixed-use tower with 156 residential units and ground floor commercial.',
			date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
			time: '18:30',
			location: 'City Hall Council Chambers, 1 Centennial Square',
			municipality: 'victoria',
			relatedBylaw: '24-087',
			status: 'upcoming',
			submissionUrl: 'https://pub-victoria.escribemeetings.com',
			source: 'victoria-escribemeetings'
		},
		{
			id: 'ph-vic-2',
			title: 'Short-Term Rental Regulation Bylaw',
			description:
				'New licensing and operating requirements for short-term rental properties. Public comment period open until hearing date.',
			date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
			time: '18:30',
			location: 'City Hall Council Chambers',
			municipality: 'victoria',
			relatedBylaw: '24-092',
			status: 'upcoming',
			submissionDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
			source: 'victoria-escribemeetings'
		},
		{
			id: 'ph-san-1',
			title: 'OCP Amendment — Shelbourne Valley Growth Area',
			description:
				'Proposed Official Community Plan amendment to designate Shelbourne Valley corridor as a growth area with increased density.',
			date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
			time: '19:00',
			location: 'Saanich Municipal Hall, 770 Vernon Ave',
			municipality: 'saanich',
			status: 'upcoming',
			source: 'saanich-civicweb'
		},
		{
			id: 'ph-esq-1',
			title: 'Parking Regulation Bylaw Update',
			description:
				'Proposed reduction of minimum parking requirements for new developments within 400m of transit stops.',
			date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
			time: '19:00',
			location: 'Esquimalt Municipal Hall',
			municipality: 'esquimalt',
			status: 'upcoming',
			source: 'esquimalt-legistar'
		},
		{
			id: 'ph-vic-3',
			title: 'Heritage Conservation Area — Rockland',
			description:
				'Consideration of heritage conservation area designation for the Rockland neighbourhood.',
			date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
			time: '18:30',
			location: 'City Hall Council Chambers',
			municipality: 'victoria',
			status: 'closed',
			source: 'victoria-escribemeetings'
		}
	];

	const filteredHearings = $derived(
		municipalityStore.isAllCRD
			? seedHearings
			: seedHearings.filter((h) => h.municipality === municipalityStore.slug)
	);

	const upcomingHearings = $derived(
		filteredHearings
			.filter((h) => h.status === 'upcoming' || h.status === 'open')
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	);

	const closedHearings = $derived(filteredHearings.filter((h) => h.status === 'closed'));

	function daysUntil(iso: string): string {
		const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Tomorrow';
		return `In ${days} days`;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-CA', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="public-hearings">
	{#if upcomingHearings.length > 0}
		<div class="section-label">Upcoming</div>
		<div class="hearing-list">
			{#each upcomingHearings as hearing (hearing.id)}
				<div class="hearing-item">
					<div class="hearing-urgency">
						<span class="countdown">{daysUntil(hearing.date)}</span>
					</div>
					<div class="hearing-content">
						<div class="hearing-title">{hearing.title}</div>
						{#if hearing.description}
							<div class="hearing-desc">{hearing.description}</div>
						{/if}
						<div class="hearing-meta">
							<span class="hearing-date">
								{formatDate(hearing.date)}{hearing.time ? ` at ${hearing.time}` : ''}
							</span>
							{#if hearing.location}
								<span class="hearing-location">{hearing.location}</span>
							{/if}
						</div>
						{#if hearing.submissionDeadline}
							<div class="submission-deadline">
								Submit by: {formatDate(hearing.submissionDeadline)}
							</div>
						{/if}
						<div class="hearing-actions">
							{#if hearing.submissionUrl}
								<a href={hearing.submissionUrl} target="_blank" rel="noopener" class="action-link"
									>Submit Comment</a
								>
							{/if}
							{#if hearing.relatedBylaw}
								<span class="related-bylaw">Bylaw {hearing.relatedBylaw}</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if closedHearings.length > 0}
		<div class="section-label">Recently Closed</div>
		<div class="hearing-list">
			{#each closedHearings as hearing (hearing.id)}
				<div class="hearing-item closed">
					<div class="hearing-content">
						<div class="hearing-title">{hearing.title}</div>
						<span class="hearing-date">{formatDate(hearing.date)}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if filteredHearings.length === 0}
		<div class="empty">No upcoming public hearings — check back before the next council cycle</div>
	{/if}
</div>

<style>
	.public-hearings {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
		overflow-y: auto;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-tertiary);
	}

	.hearing-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.hearing-item {
		display: flex;
		gap: 10px;
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border-left: 3px solid var(--accent-warning);
	}

	.hearing-item.closed {
		border-left-color: var(--text-tertiary);
		opacity: 0.7;
	}

	.hearing-urgency {
		display: flex;
		align-items: flex-start;
		min-width: 60px;
	}

	.countdown {
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--accent-warning);
		white-space: nowrap;
	}

	.hearing-content {
		flex: 1;
		min-width: 0;
	}

	.hearing-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.hearing-desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: 4px;
	}

	.hearing-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.hearing-date {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.hearing-location {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.submission-deadline {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--accent-danger);
		margin-top: 3px;
	}

	.hearing-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.action-link {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--accent-primary);
		text-decoration: none;
	}

	.action-link:hover {
		text-decoration: underline;
	}

	.related-bylaw {
		font-family: 'Geist Mono', monospace;
		font-size: 0.625rem;
		color: var(--text-tertiary);
		padding: 1px 6px;
		border: 1px solid var(--border-primary);
		border-radius: 4px;
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
