<script lang="ts">
	import { fetchMeetings } from '$lib/api/council';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { Meeting } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import { isValidHttpUrl } from '$lib/utils/sanitize';
	import PanelError from '$lib/components/ui/PanelError.svelte';
	import BookmarkButton from '$lib/components/ui/BookmarkButton.svelte';

	let meetings = $state<Meeting[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let viewMode = $state<'upcoming' | 'calendar'>('upcoming');

	async function loadMeetings() {
		loading = true;
		error = null;
		const result = await fetchMeetings({
			municipality: municipalityStore.slug
		});
		if (result.error) {
			error = result.error;
		} else {
			meetings = result.data;
		}
		loading = false;
	}

	// Reload when municipality changes (also handles initial load)
	$effect(() => {
		// Access the slug to establish dependency
		const _slug = municipalityStore.slug;
		loadMeetings();
	});

	const upcomingMeetings = $derived(
		meetings.filter((m) => m.status === 'scheduled' || m.status === 'in-progress')
	);

	const pastMeetings = $derived(meetings.filter((m) => m.status === 'completed'));

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-CA', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function statusBadgeClass(status: Meeting['status']): string {
		switch (status) {
			case 'in-progress':
				return 'badge-live';
			case 'scheduled':
				return 'badge-upcoming';
			case 'completed':
				return 'badge-past';
			case 'cancelled':
				return 'badge-cancelled';
		}
	}
</script>

<div class="council-watch">
	<div class="view-tabs">
		<button
			class="tab"
			class:active={viewMode === 'upcoming'}
			onclick={() => (viewMode = 'upcoming')}>Upcoming</button
		>
		<button
			class="tab"
			class:active={viewMode === 'calendar'}
			onclick={() => (viewMode = 'calendar')}>Recent</button
		>
	</div>

	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadMeetings} />
	{:else}
		<div class="meeting-list">
			{#each viewMode === 'upcoming' ? upcomingMeetings : pastMeetings as meeting (meeting.id)}
				<div class="meeting-item">
					<div class="meeting-date-col">
						<span class="meeting-day">{new Date(meeting.date).getDate()}</span>
						<span class="meeting-month"
							>{new Date(meeting.date).toLocaleDateString('en-CA', { month: 'short' })}</span
						>
					</div>
					<div class="meeting-info">
						<div class="meeting-title">{meeting.title}</div>
						<div class="meeting-meta">
							<span class="badge {statusBadgeClass(meeting.status)}"
								>{meeting.status === 'in-progress' ? 'LIVE' : meeting.status}</span
							>
							<span class="meeting-time"
								>{formatDate(meeting.date)}{meeting.time ? ` at ${meeting.time}` : ''}</span
							>
						</div>
						{#if meeting.location}
							<div class="meeting-location">{meeting.location}</div>
						{/if}
					</div>
					<BookmarkButton
						itemType="meeting"
						externalId={meeting.id}
						title={meeting.title}
						description={meeting.body}
						municipality={meeting.municipality}
						url={meeting.agendaUrl}
					/>
					<div class="meeting-actions">
						{#if isValidHttpUrl(meeting.agendaUrl)}
							<a
								href={meeting.agendaUrl}
								target="_blank"
								rel="noopener"
								class="action-link"
								title="View agenda">Agenda</a
							>
						{/if}
						{#if isValidHttpUrl(meeting.minutesUrl)}
							<a
								href={meeting.minutesUrl}
								target="_blank"
								rel="noopener"
								class="action-link"
								title="View minutes">Minutes</a
							>
						{/if}
					</div>
				</div>
			{:else}
				<div class="empty" role="status">
					No {viewMode === 'upcoming' ? 'upcoming' : 'recent'} meetings
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.council-watch {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.view-tabs {
		display: flex;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}

	.tab {
		padding: 4px 12px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab.active {
		background: var(--accent-primary);
		color: var(--text-inverse);
		border-color: var(--accent-primary);
	}

	.meeting-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.meeting-item {
		display: flex;
		gap: 10px;
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.2s;
	}

	.meeting-item:hover {
		background: var(--bg-surface-elevated);
	}

	.meeting-date-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 36px;
		padding: 2px 0;
	}

	.meeting-day {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--accent-primary);
		line-height: 1;
	}

	.meeting-month {
		font-size: 0.625rem;
		text-transform: uppercase;
		color: var(--text-tertiary);
		letter-spacing: 0.5px;
	}

	.meeting-info {
		flex: 1;
		min-width: 0;
	}

	.meeting-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meeting-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 2px;
	}

	.badge {
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.badge-live {
		background: var(--status-critical);
		color: white;
		animation: pulse-live 2s infinite;
	}

	.badge-upcoming {
		background: var(--accent-primary);
		color: var(--text-inverse);
	}

	.badge-past {
		background: var(--border-primary);
		color: var(--text-tertiary);
	}

	.badge-cancelled {
		background: var(--accent-danger);
		color: white;
	}

	.meeting-time {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}

	.meeting-location {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		margin-top: 1px;
	}

	.meeting-actions {
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: flex-end;
	}

	.action-link {
		font-size: 0.6875rem;
		color: var(--accent-primary);
		text-decoration: none;
	}

	.action-link:hover {
		text-decoration: underline;
	}

	.loading,
	.error-msg,
	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.error-msg {
		color: var(--accent-danger);
	}

	@keyframes pulse-live {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
