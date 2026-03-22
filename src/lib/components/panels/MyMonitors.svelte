<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { apiFetch } from '$lib/api/fetcher';
	import { matchMonitors, type MonitorMatch } from '$lib/utils/monitor-matcher';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';

	const STORAGE_KEY = 'svit-monitors';

	interface Monitor {
		id: string;
		keyword: string;
		sources: string[];
		municipality: string | null;
		createdAt: string;
	}

	interface SuggestedTopic {
		keyword: string;
		sources: string[];
	}

	const SUGGESTED_TOPICS: SuggestedTopic[] = [
		{ keyword: 'housing policy', sources: ['council', 'news', 'development'] },
		{ keyword: 'bike lanes', sources: ['council', 'news', 'development'] },
		{ keyword: 'short-term rentals', sources: ['news', 'council'] },
		{ keyword: 'transit changes', sources: ['transit', 'council', 'news'] },
		{ keyword: 'climate action', sources: ['council', 'news'] },
		{ keyword: 'property taxes', sources: ['council', 'budget'] }
	];

	const DEFAULT_ACTIVATED = ['housing policy', 'bike lanes', 'transit changes'];

	const SOURCE_OPTIONS = [
		{ id: 'council', label: 'Council' },
		{ id: 'news', label: 'News' },
		{ id: 'development', label: 'Development' },
		{ id: 'social', label: 'Social' },
		{ id: 'safety', label: 'Safety' },
		{ id: 'transit', label: 'Transit' },
		{ id: 'budget', label: 'Budget' }
	];

	let monitors = $state<Monitor[]>([]);
	let scanning = $state(false);
	let initialLoad = $state(true);
	let showAdd = $state(false);
	let newKeyword = $state('');
	let newSources = $state<string[]>(['council', 'news', 'development']);
	let matchesByMonitor = $state<Record<string, MonitorMatch[]>>({});
	let expandedMonitor = $state<string | null>(null);

	// Derived: which suggested keywords are already active monitors
	let activeKeywords = $derived(new Set(monitors.map((m) => m.keyword.toLowerCase())));

	function loadFromStorage(): Monitor[] {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				return JSON.parse(raw) as Monitor[];
			}
		} catch {
			// Corrupted data, start fresh
		}
		return [];
	}

	function saveToStorage() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(monitors));
		} catch {
			// Storage full or unavailable
		}
	}

	function generateId(): string {
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			return crypto.randomUUID();
		}
		return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
	}

	function initMonitors() {
		const stored = loadFromStorage();
		if (stored.length > 0) {
			monitors = stored;
		} else {
			// First visit: pre-activate default topics
			monitors = DEFAULT_ACTIVATED.map((keyword) => {
				const suggested = SUGGESTED_TOPICS.find((s) => s.keyword === keyword);
				return {
					id: generateId(),
					keyword,
					sources: suggested?.sources || ['council', 'news'],
					municipality: null,
					createdAt: new Date().toISOString()
				};
			});
			saveToStorage();
		}
		initialLoad = false;
		scanForMatches();
	}

	function toggleSuggested(topic: SuggestedTopic) {
		const existing = monitors.find((m) => m.keyword.toLowerCase() === topic.keyword.toLowerCase());
		if (existing) {
			monitors = monitors.filter((m) => m.id !== existing.id);
		} else {
			monitors = [
				...monitors,
				{
					id: generateId(),
					keyword: topic.keyword,
					sources: [...topic.sources],
					municipality: null,
					createdAt: new Date().toISOString()
				}
			];
		}
		saveToStorage();
		scanForMatches();
	}

	function addMonitor() {
		if (!newKeyword.trim()) return;
		monitors = [
			...monitors,
			{
				id: generateId(),
				keyword: newKeyword.trim(),
				sources: [...newSources],
				municipality: municipalityStore.slug,
				createdAt: new Date().toISOString()
			}
		];
		newKeyword = '';
		showAdd = false;
		saveToStorage();
		scanForMatches();
	}

	function deleteMonitor(id: string) {
		monitors = monitors.filter((m) => m.id !== id);
		saveToStorage();
	}

	function toggleSource(src: string) {
		if (newSources.includes(src)) {
			newSources = newSources.filter((s) => s !== src);
		} else {
			newSources = [...newSources, src];
		}
	}

	async function scanForMatches() {
		if (monitors.length === 0) {
			matchesByMonitor = {};
			return;
		}
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

	// Initialize on mount
	$effect(() => {
		initMonitors();
	});
</script>

<div class="topic-watch">
	{#if initialLoad}
		<PanelSkeleton variant="list" />
	{:else}
		<!-- Suggested topics -->
		<div class="section-label">Trending topics</div>
		<div class="suggested-topics">
			{#each SUGGESTED_TOPICS as topic (topic.keyword)}
				<button
					class="topic-chip"
					class:active={activeKeywords.has(topic.keyword.toLowerCase())}
					onclick={() => toggleSuggested(topic)}
					title={activeKeywords.has(topic.keyword.toLowerCase())
						? `Remove "${topic.keyword}"`
						: `Watch "${topic.keyword}"`}
				>
					{#if activeKeywords.has(topic.keyword.toLowerCase())}
						<span class="chip-icon" aria-hidden="true">&#10003;</span>
					{:else}
						<span class="chip-icon" aria-hidden="true">+</span>
					{/if}
					{topic.keyword}
				</button>
			{/each}
		</div>

		<!-- Active monitors header -->
		<div class="monitors-header">
			<span class="monitor-count">
				{monitors.length} active watch{monitors.length !== 1 ? 'es' : ''}
			</span>
			<button class="add-btn" onclick={() => (showAdd = !showAdd)}>
				{showAdd ? 'Cancel' : '+ Custom'}
			</button>
		</div>

		<!-- Add custom monitor form -->
		{#if showAdd}
			<div class="add-form">
				<input
					type="text"
					bind:value={newKeyword}
					placeholder="Keyword or phrase..."
					class="keyword-input"
					onkeydown={(e) => {
						if (e.key === 'Enter') addMonitor();
					}}
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
						Create Watch
					</button>
				</div>
			</div>
		{/if}

		<!-- Monitor list -->
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
				<div class="empty" role="status">Tap a topic above or use + Custom to start watching</div>
			{/each}
		</div>

		<!-- Sync banner for unauthenticated users -->
		{#if !authStore.isAuthenticated}
			<button class="sync-banner" onclick={() => (authStore.showAuthModal = true)}>
				<span class="sync-icon" aria-hidden="true">&#128274;</span>
				Sign in to sync across devices
			</button>
		{/if}
	{/if}
</div>

<style>
	.topic-watch {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.section-label {
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-tertiary);
	}

	.suggested-topics {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.topic-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.6875rem;
		padding: 4px 10px;
		border-radius: 14px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
		white-space: nowrap;
	}

	.topic-chip:hover {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.topic-chip.active {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: var(--text-inverse);
	}

	.topic-chip.active:hover {
		opacity: 0.85;
		color: var(--text-inverse);
	}

	.chip-icon {
		font-size: 0.625rem;
		font-weight: 700;
		line-height: 1;
	}

	.monitors-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 4px;
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
		transition: opacity 0.15s;
	}

	.add-btn:hover {
		opacity: 0.85;
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
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
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
		padding: 16px 0;
	}

	.sync-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px dashed var(--border-primary);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 0.6875rem;
		cursor: pointer;
		transition:
			border-color 0.15s,
			color 0.15s;
		flex-shrink: 0;
	}

	.sync-banner:hover {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.sync-icon {
		font-size: 0.75rem;
	}
</style>
