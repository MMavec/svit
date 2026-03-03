<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase';
	import PanelSkeleton from '$lib/components/ui/PanelSkeleton.svelte';

	interface Thread {
		id: string;
		title: string;
		item_type: string;
		item_id: string;
		message_count: number;
		last_message: string;
		last_message_at: string;
		created_at: string;
	}

	let threads = $state<Thread[]>([]);
	let loading = $state(false);
	let showNew = $state(false);
	let newTitle = $state('');
	let newMessage = $state('');

	async function loadThreads() {
		if (!supabase || !authStore.isAuthenticated) return;
		loading = true;
		const { data } = await supabase
			.from('threads')
			.select('*')
			.eq('user_id', authStore.user!.id)
			.order('last_message_at', { ascending: false });
		threads = (data || []) as Thread[];
		loading = false;
	}

	async function createThread() {
		if (!supabase || !authStore.isAuthenticated || !newTitle.trim()) return;
		const { error } = await supabase.from('threads').insert({
			user_id: authStore.user!.id,
			title: newTitle.trim(),
			item_type: 'note',
			item_id: crypto.randomUUID(),
			last_message: newMessage.trim() || newTitle.trim(),
			last_message_at: new Date().toISOString(),
			message_count: newMessage.trim() ? 1 : 0
		});
		if (!error) {
			newTitle = '';
			newMessage = '';
			showNew = false;
			await loadThreads();
		}
	}

	async function deleteThread(id: string) {
		if (!supabase) return;
		await supabase.from('threads').delete().eq('id', id);
		threads = threads.filter((t) => t.id !== id);
	}

	function typeLabel(type: string): string {
		const labels: Record<string, string> = {
			council: 'Council',
			bylaw: 'Bylaw',
			development: 'Development',
			hearing: 'Hearing',
			note: 'Note'
		};
		return labels[type] || 'Thread';
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	$effect(() => {
		if (authStore.isAuthenticated) {
			loadThreads();
		}
	});
</script>

<div class="threads-panel">
	{#if !authStore.isAuthenticated}
		<div class="auth-prompt">
			<div class="auth-icon">&#128172;</div>
			<p class="auth-text">Sign in to create discussion threads</p>
			<button class="auth-btn" onclick={() => (authStore.showAuthModal = true)}> Sign In </button>
		</div>
	{:else if loading}
		<PanelSkeleton variant="list" />
	{:else}
		<div class="threads-header">
			<span class="thread-count">{threads.length} thread{threads.length !== 1 ? 's' : ''}</span>
			<button class="add-btn" onclick={() => (showNew = !showNew)}>
				{showNew ? 'Cancel' : '+ New'}
			</button>
		</div>

		{#if showNew}
			<div class="add-form">
				<input
					type="text"
					bind:value={newTitle}
					placeholder="Thread title..."
					class="title-input"
				/>
				<textarea
					bind:value={newMessage}
					placeholder="First message (optional)..."
					class="message-input"
					rows="3"
				></textarea>
				<button class="save-btn" onclick={createThread} disabled={!newTitle.trim()}>
					Create Thread
				</button>
			</div>
		{/if}

		<div class="thread-list">
			{#each threads as thread (thread.id)}
				<div class="thread-card">
					<div class="thread-header">
						<span class="thread-type">{typeLabel(thread.item_type)}</span>
						<span class="thread-time">{timeAgo(thread.last_message_at || thread.created_at)}</span>
					</div>
					<div class="thread-title">{thread.title}</div>
					{#if thread.last_message}
						<div class="thread-preview">{thread.last_message}</div>
					{/if}
					<div class="thread-footer">
						<span class="message-count"
							>{thread.message_count || 0} message{(thread.message_count || 0) !== 1
								? 's'
								: ''}</span
						>
						<button class="delete-btn" onclick={() => deleteThread(thread.id)}>Delete</button>
					</div>
				</div>
			{:else}
				<div class="empty">
					No threads yet — start a discussion about council items, bylaws, or anything civic
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.threads-panel {
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

	.threads-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border-primary);
	}

	.thread-count {
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
		gap: 6px;
	}

	.title-input,
	.message-input {
		padding: 6px 10px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.75rem;
		font-family: inherit;
		outline: none;
		resize: none;
	}

	.title-input:focus,
	.message-input:focus {
		border-color: var(--accent-primary);
	}

	.save-btn {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 6px;
		border-radius: 6px;
		border: none;
		background: var(--accent-primary);
		color: var(--text-inverse);
		cursor: pointer;
	}

	.save-btn:disabled {
		opacity: 0.5;
	}

	.thread-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.thread-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		transition: background 0.15s;
	}

	.thread-card:hover {
		background: var(--bg-surface-elevated);
	}

	.thread-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2px;
	}

	.thread-type {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--accent-primary);
		letter-spacing: 0.05em;
	}

	.thread-time {
		font-size: 0.625rem;
		color: var(--text-tertiary);
	}

	.thread-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.thread-preview {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		margin-top: 2px;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.thread-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 6px;
	}

	.message-count {
		font-size: 0.625rem;
		color: var(--text-tertiary);
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
		padding: 16px;
	}
</style>
