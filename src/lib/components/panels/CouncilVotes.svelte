<script lang="ts">
	import { fetchCouncilVotes } from '$lib/api/council-votes';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { CouncilVote, CouncillorScore } from '$lib/types/index';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	let votes = $state<CouncilVote[]>([]);
	let scorecard = $state<CouncillorScore[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let note = $state<string | null>(null);
	let latestMeeting = $state<string | null>(null);
	let activeCouncillor = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		const result = await fetchCouncilVotes({ splitOnly: true, limit: 120 });
		if (result.error) error = result.error;
		else {
			votes = result.data || [];
			const meta = result.meta as Record<string, unknown> | undefined;
			scorecard = (meta?.scorecard as CouncillorScore[]) || [];
			note = (meta?.note as string) || null;
			latestMeeting = (meta?.latestMeeting as string) || null;
		}
		loading = false;
	}

	$effect(() => {
		const _slug = municipalityStore.slug;
		activeCouncillor = null;
		load();
	});

	const rankedScore = $derived([...scorecard].sort((a, b) => b.dissents - a.dissents));
	const maxDissents = $derived(Math.max(1, ...scorecard.map((s) => s.dissents)));

	const displayed = $derived(
		activeCouncillor ? votes.filter((v) => v.opposed.includes(activeCouncillor as string)) : votes
	);

	function fmtDate(d: string): string {
		// d is YYYY/MM/DD
		const parts = d.split('/');
		if (parts.length !== 3) return d;
		const date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
		if (isNaN(date.getTime())) return d;
		return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="votes">
	{#if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={load} />
	{:else}
		<div class="scorecard" role="group" aria-label="Filter by councillor (dissent count)">
			{#each rankedScore as s (s.name)}
				<button
					class="score-chip"
					class:active={activeCouncillor === s.name}
					aria-pressed={activeCouncillor === s.name}
					title="{s.name}: opposed the majority on {s.dissents} of {s.votesRecorded} recorded votes"
					onclick={() => (activeCouncillor = activeCouncillor === s.name ? null : s.name)}
				>
					<span class="score-name">{s.name}</span>
					<span class="score-bar">
						<span class="score-fill" style="width: {(s.dissents / maxDissents) * 100}%"></span>
					</span>
					<span class="score-num">{s.dissents}</span>
				</button>
			{/each}
		</div>

		<div class="caption">
			<span>
				{#if activeCouncillor}
					Split votes where <strong>{activeCouncillor}</strong> opposed the majority
				{:else}
					Split council votes (who dissented). Bars above = times each member opposed.
				{/if}
			</span>
			{#if latestMeeting}
				<span class="as-of" title="Most recent meeting with adopted (published) minutes"
					>through {fmtDate(latestMeeting)}</span
				>
			{/if}
		</div>

		<div class="list">
			{#each displayed as v (v.id)}
				<div class="vote" class:defeated={!v.carried}>
					<div class="vote-head">
						<span class="result" class:carried={v.carried} class:lost={!v.carried}>{v.result}</span>
						<span class="date">{fmtDate(v.meetingDate)}</span>
					</div>
					<div class="motion">
						{#if v.itemCode}<span class="item-code">{v.itemCode}</span>{/if}
						{v.motion}
					</div>
					<div class="opposed-row">
						<span class="opp-label">Opposed</span>
						{#each v.opposed as name, i (name + '-' + i)}
							<span class="opp-name" class:highlight={name === activeCouncillor}>{name}</span>
						{/each}
						{#if v.conflict.length > 0}
							<span class="conflict">conflict: {v.conflict.join(', ')}</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="empty" role="status">
					{#if activeCouncillor}
						{activeCouncillor} did not oppose the majority on any recorded split vote.
					{:else}
						No split votes on record.
					{/if}
				</div>
			{/each}
		</div>

		{#if note}<div class="footnote">{note}</div>{/if}
	{/if}
</div>

<style>
	.votes {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}
	.scorecard {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-primary);
	}
	.score-chip {
		display: grid;
		grid-template-columns: 74px 1fr 24px;
		align-items: center;
		gap: 8px;
		padding: 2px 4px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;
	}
	.score-chip:hover {
		background: var(--bg-surface-hover);
	}
	.score-chip.active {
		border-color: var(--accent-primary);
		background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
	}
	.score-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.score-bar {
		height: 8px;
		background: var(--bg-surface-hover);
		border-radius: 4px;
		overflow: hidden;
	}
	.score-fill {
		display: block;
		height: 100%;
		border-radius: 4px;
		background: var(--accent-danger);
		min-width: 2px;
	}
	.score-num {
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--text-secondary);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.caption {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}
	.as-of {
		flex-shrink: 0;
		font-family: var(--font-mono, monospace);
		font-size: 0.625rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}
	.list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		flex: 1;
	}
	.vote {
		position: relative;
		padding: 9px 2px 10px 15px;
		border-bottom: 1px solid var(--border-primary);
		--row-accent: var(--accent-secondary);
	}
	.vote.defeated {
		--row-accent: var(--accent-danger);
	}
	.vote::before {
		content: '';
		position: absolute;
		left: 2px;
		top: 14px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--row-accent);
	}
	.vote:last-child {
		border-bottom: none;
	}
	.vote-head {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
	}
	.result {
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 1px 7px;
		border-radius: 8px;
	}
	.result.carried {
		background: color-mix(in srgb, var(--accent-secondary) 18%, transparent);
		color: var(--accent-secondary);
	}
	.result.lost {
		background: color-mix(in srgb, var(--accent-danger) 18%, transparent);
		color: var(--accent-danger);
	}
	.date {
		margin-left: auto;
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-family: var(--font-mono, monospace);
	}
	.motion {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
		margin-bottom: 4px;
	}
	.item-code {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--accent-primary);
		margin-right: 4px;
	}
	.opposed-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
	}
	.opp-label {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--accent-danger);
	}
	.opp-name {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		padding: 0 5px;
		border-radius: 8px;
		background: var(--bg-surface-active, var(--bg-panel));
	}
	.opp-name.highlight {
		background: var(--accent-danger);
		color: #fff;
		font-weight: 600;
	}
	.conflict {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-style: italic;
	}
	.empty {
		padding: 16px 8px;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
	}
	.footnote {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
		line-height: 1.4;
		padding-top: 4px;
		border-top: 1px solid var(--border-primary);
	}
</style>
