<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { supabase } from '$lib/supabase';

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
	let showAdd = $state(false);
	let newKeyword = $state('');
	let newSources = $state<string[]>(['council', 'news', 'development']);

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
		const { data } = await supabase
			.from('monitors')
			.select('*')
			.eq('user_id', authStore.user!.id)
			.order('created_at', { ascending: false });
		monitors = (data || []) as Monitor[];
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

	$effect(() => {
		if (authStore.isAuthenticated) {
			loadMonitors();
		}
	});
</script>

<div class="my-monitors">
	{#if !authStore.isAuthenticated}
		<div class="auth-prompt">
			<div class="auth-icon">&#128274;</div>
			<p class="auth-text">Sign in to create custom keyword monitors</p>
			<button class="auth-btn" onclick={() => (authStore.showAuthModal = true)}> Sign In </button>
		</div>
	{:else if loading}
		<div class="loading">Loading monitors...</div>
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
				<div class="monitor-card">
					<div class="monitor-keyword">{monitor.keyword}</div>
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
					<div class="monitor-footer">
						<span class="match-count">{monitor.matches || 0} matches</span>
						<button class="delete-btn" onclick={() => deleteMonitor(monitor.id)}>Remove</button>
					</div>
				</div>
			{:else}
				<div class="empty">
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

	.auth-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex: 1;
		text-align: center;
	}

	.auth-icon {
		font-size: 2rem;
		opacity: 0.5;
	}

	.auth-text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	.auth-btn {
		padding: 6px 20px;
		border-radius: 8px;
		border: 1px solid var(--accent-primary);
		background: var(--accent-primary);
		color: var(--text-inverse);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
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

	.monitor-keyword {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
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

	.loading,
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
