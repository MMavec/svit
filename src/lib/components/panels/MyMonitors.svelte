<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { supabase } from '$lib/supabase';
	import { apiFetch } from '$lib/api/fetcher';
	import { matchMonitors, type MonitorMatch } from '$lib/utils/monitor-matcher';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';
	import PanelError from '$lib/components/ui/PanelError.svelte';

	interface Monitor {
		id: string;
		keyword: string;
		sources: string[];
		municipality: string | null;
		created_at: string;
		matches: number;
	}

	let monitors = $state<Monitor[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showAdd = $state(false);
	let newKeyword = $state('');
	let newSources = $state<string[]>(['council', 'news', 'development']);
	let matchesByMonitor = $state<Record<string, MonitorMatch[]>>({});
	let scanning = $state(false);
	let expandedMonitor = $state<string | null>(null);

	const SOURCE_OPTIONS = [
		{ id: 'council', label: 'Council' },
		{ id: 'news', label: 'News' },
		{ id: 'development', label: 'Development' },
		{ id: 'social', label: 'Social' },
		{ id: 'safety', label: 'Safety' }
	];

	async function loadMonitors() {
		if (!supabase || !authStore.isAuthenticated) return;
		loading = true;
		error = null;
		const { data, error: dbError } = await supabase
			.from('monitors')
			.select('*')
			.eq('user_id', authStore.user!.id)
			.order('created_at', { ascending: false });
		if (dbError) {
			error = dbError.message;
		} else {
			monitors = (data || []) as Monitor[];
			scanForMatches();
		}
		loading = false;
	}

	async function addMonitor() {
		if (!supabase || !authStore.isAuthenticated || !newKeyword.trim()) return;
		const { error } = await supabase.from('monitors').insert({
			user_id: authStore.user!.id,
			keyword: newKeyword.trim(),
			sources: newSources,
			municipality: municipalityStore.slug
		});
		if (!error) {
			newKeyword = '';
			showAdd = false;
			await loadMonitors();
		}
	}

	async function deleteMonitor(id: string) {
		if (!supabase) return;
		await supabase.from('monitors').delete().eq('id', id);
		monitors = monitors.filter((m) => m.id !== id);
	}

	function toggleSource(src: string) {
		if (newSources.includes(src)) {
			newSources = newSources.filter((s) => s !== src);
		} else {
			newSources = [...newSources, src];
		}
	}

	async function scanForMatches() {
		if (monitors.length === 0) return;
		scanning = true;

		const sources: { path: string; source: string }[] = [
			{ path: '/council', source: 'council' },
			{ path: '/news', source: 'news' },
			{ path: '/development', source: 'development' },
			{ path: '/social', source: 'social' },
			{ path: '/safety', source: 'safety' }
		];

		const results = await Promise.allSettled(
			sources.map((s) =>
				apiFetch<Array<{ id: string; title?: string; description?: string; address?: string }>>(
					s.path,
					{ limit: 50 }
				)
			)
		);

		const allMatches: MonitorMatch[] = [];
		for (let i = 0; i < results.length; i++) {
			const r = results[i];
			if (r.status !== 'fulfilled' || !r.value.data) continue;
			const items = r.value.data.map((item) => ({
				id: item.id,
				title: item.title || (item as { address?: string }).address || '',
				description: item.description
			}));
			allMatches.push(...matchMonitors(monitors, items, sources[i].source));
		}

		const grouped: Record<string, MonitorMatch[]> = {};
		for (const m of allMatches) {
			if (!grouped[m.monitorId]) grouped[m.monitorId] = [];
			grouped[m.monitorId].push(m);
		}
		matchesByMonitor = grouped;
		scanning = false;
	}

	$effect(() => {
		if (authStore.isAuthenticated) {
			loadMonitors();
		}
	});
</script>

<div class="my-monitors">
	{#if !authStore.isAuthenticated}
		<div class="locked-preview">
			<div class="preview-content" aria-hidden="true">
				<div class="preview-card has-matches">
					<div class="preview-keyword">housing policy</div>
					<div class="preview-meta">council, news, development</div>
					<div class="preview-footer"><span class="preview-matches">3 matches</span></div>
				</div>
				<div class="preview-card">
					<div class="preview-keyword">bike lanes</div>
					<div class="preview-meta">council, development</div>
					<div class="preview-footer"><span class="preview-matches">1 match</span></div>
				</div>
				<div class="preview-card has-matches">
					<div class="preview-keyword">short-term rentals</div>
					<div class="preview-meta">news, council</div>
					<div class="preview-footer"><span class="preview-matches">5 matches</span></div>
				</div>
			</div>
			<div class="locked-overlay">
				<div class="lock-icon">&#128274;</div>
				<div class="lock-title">Keyword Monitors</div>
				<p class="lock-desc">
					Track topics across council meetings, news, and development applications. Get notified
					when your keywords are mentioned.
				</p>
				<button class="lock-btn" onclick={() => (authStore.showAuthModal = true)}
					>Sign In to Monitor</button
				>
			</div>
		</div>
	{:else if loading}
		<PanelSkeleton variant="list" />
	{:else if error}
		<PanelError message={error} onRetry={loadMonitors} />
	{:else}
		<div class="monitors-header">
			<span class="monitor-count">{monitors.length} monitor{monitors.length !== 1 ? 's' : ''}</span>
			<button class="add-btn" onclick={() => (showAdd = !showAdd)}>
				{showAdd ? 'Cancel' : '+ Add'}
			</button>
		</div>

		{#if showAdd}
			<div class="add-form">
				<input
					type="text"
					bind:value={newKeyword}
					placeholder="Keyword or phrase..."
					class="keyword-input"
				/>
				<div class="source-toggles">
					{#each SOURCE_OPTIONS as src (src.id)}
						<button
							class="source-chip"
							class:active={newSources.includes(src.id)}
							onclick={() => toggleSource(src.id)}
						>
							{src.label}
						</button>
					{/each}
				</div>
				<div class="add-meta">
					<span class="scope-label">
						Scope: {municipalityStore.label}
					</span>
					<button class="save-btn" onclick={addMonitor} disabled={!newKeyword.trim()}>
						Create Monitor
					</button>
				</div>
			</div>
		{/if}

		<div class="monitor-list">
			{#each monitors as monitor (monitor.id)}
				{@const monitorMatches = matchesByMonitor[monitor.id] || []}
				<div class="monitor-card" class:has-matches={monitorMatches.length > 0}>
					<button
						class="monitor-header-btn"
						onclick={() => (expandedMonitor = expandedMonitor === monitor.id ? null : monitor.id)}
					>
						<div class="monitor-keyword">{monitor.keyword}</div>
						{#if monitorMatches.length > 0}
							<span class="match-badge">{monitorMatches.length}</span>
						{/if}
					</button>
					<div class="monitor-meta">
						<span class="monitor-sources">
							{monitor.sources.join(', ')}
						</span>
						{#if monitor.municipality}
							<span class="monitor-scope">{monitor.municipality}</span>
						{:else}
							<span class="monitor-scope">All CRD</span>
						{/if}
					</div>
					{#if expandedMonitor === monitor.id && monitorMatches.length > 0}
						<div class="match-list">
							{#each monitorMatches as match (match.itemId + match.source)}
								<div class="match-item">
									<span class="match-source">{match.source}</span>
									<span class="match-title">{match.itemTitle}</span>
									<span class="match-field">({match.matchedIn})</span>
								</div>
							{/each}
						</div>
					{/if}
					<div class="monitor-footer">
						<span class="match-count">
							{#if scanning}
								scanning...
							{:else}
								{monitorMatches.length} match{monitorMatches.length !== 1 ? 'es' : ''}
							{/if}
						</span>
						<button class="delete-btn" onclick={() => deleteMonitor(monitor.id)}>Remove</button>
					</div>
				</div>
			{:else}
				<div class="empty" role="status">
					{showAdd
						? 'Create your first monitor above'
						: 'No monitors yet — tap + Add to create one'}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.my-monitors {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.locked-preview {
		position: relative;
		flex: 1;
		overflow: hidden;
	}

	.preview-content {
		filter: blur(3px);
		opacity: 0.45;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.preview-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.preview-card.has-matches {
		border-left: 3px solid var(--accent-primary);
	}

	.preview-keyword {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.preview-meta {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin-top: 2px;
	}

	.preview-footer {
		margin-top: 4px;
	}

	.preview-matches {
		font-size: 0.75rem;
		color: var(--accent-primary);
		font-family: 'Geist Mono', monospace;
	}

	.locked-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		text-align: center;
		padding: 16px;
	}

	.lock-icon {
		font-size: 1.5rem;
		opacity: 0.7;
	}

	.lock-title {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.lock-desc {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.4;
		max-width: 240px;
		margin: 0;
	}

	.lock-btn {
		margin-top: 4px;
		padding: 8px 20px;
		border-radius: 8px;
		border: none;
		background: var(--accent-primary);
		color: var(--text-inverse);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.lock-btn:hover {
		opacity: 0.85;
	}

	.monitors-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border-primary);
	}

	.monitor-count {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.add-btn {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: 6px;
		border: 1px solid var(--accent-primary);
		background: transparent;
		color: var(--accent-primary);
		cursor: pointer;
	}

	.add-form {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.keyword-input {
		padding: 8px 10px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.8125rem;
		outline: none;
	}

	.keyword-input:focus {
		border-color: var(--accent-primary);
	}

	.source-toggles {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.source-chip {
		font-size: 0.625rem;
		padding: 2px 8px;
		border-radius: 12px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
	}

	.source-chip.active {
		background: var(--accent-primary);
		color: var(--text-inverse);
		border-color: var(--accent-primary);
	}

	.add-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.scope-label {
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}

	.save-btn {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: 6px;
		border: none;
		background: var(--accent-primary);
		color: var(--text-inverse);
		cursor: pointer;
	}

	.save-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.monitor-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.monitor-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.monitor-card.has-matches {
		border-left: 3px solid var(--accent-primary);
	}

	.monitor-header-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
	}

	.monitor-keyword {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.match-badge {
		font-size: 0.5625rem;
		font-weight: 700;
		min-width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: var(--accent-primary);
		color: var(--text-inverse);
		padding: 0 4px;
	}

	.match-list {
		margin-top: 6px;
		padding: 4px 0;
		border-top: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.match-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.625rem;
	}

	.match-source {
		font-weight: 700;
		text-transform: uppercase;
		color: var(--accent-primary);
		letter-spacing: 0.03em;
		flex-shrink: 0;
	}

	.match-title {
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}

	.match-field {
		color: var(--text-tertiary);
		font-style: italic;
		flex-shrink: 0;
	}

	.monitor-meta {
		display: flex;
		gap: 8px;
		margin-top: 4px;
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}

	.monitor-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 6px;
	}

	.match-count {
		font-size: 0.625rem;
		color: var(--accent-primary);
		font-family: 'Geist Mono', monospace;
	}

	.delete-btn {
		font-size: 0.625rem;
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid var(--accent-danger);
		background: transparent;
		color: var(--accent-danger);
		cursor: pointer;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
		text-align: center;
	}
</style>
