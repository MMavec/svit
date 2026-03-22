<script lang="ts">
	// TODO: Add admin toggle for auth-required mode
	import { authStore } from '$lib/stores/auth.svelte';
	import { threadStore } from '$lib/stores/threads.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import type { Thread } from '$lib/stores/threads.svelte';

	let showNew = $state(false);
	let newTitle = $state('');
	let newMunicipality = $state('');
	let selectedThread = $state<string | null>(null);
	let replyContent = $state('');

	const activeThread = $derived(threadStore.threads.find((t: Thread) => t.id === selectedThread));

	const filteredThreads = $derived(
		municipalityStore.slug ? threadStore.getThreads(municipalityStore.slug) : threadStore.threads
	);

	function createThread() {
		if (!newTitle.trim()) return;
		threadStore.addThread(newTitle.trim(), newMunicipality || null);
		newTitle = '';
		newMunicipality = '';
		showNew = false;
	}

	function sendReply() {
		if (!activeThread || !replyContent.trim()) return;
		threadStore.addMessage(activeThread.id, replyContent.trim());
		replyContent = '';
	}

	function deleteThread(id: string) {
		threadStore.deleteThread(id);
		if (selectedThread === id) selectedThread = null;
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
</script>

<div class="threads-panel">
	{#if !authStore.isAuthenticated}
		<div class="sync-banner" role="status">
			<span class="sync-icon">&#9729;</span>
			Sign in to save threads across devices
		</div>
	{/if}

	{#if selectedThread && activeThread}
		<!-- Detail view -->
		<div class="thread-detail">
			<div class="detail-header">
				<button class="back-btn" onclick={() => (selectedThread = null)}>&larr; Back</button>
				{#if activeThread.municipality}
					<span class="detail-municipality">{activeThread.municipality}</span>
				{/if}
			</div>
			<div class="detail-title">{activeThread.title}</div>
			<div class="message-list">
				{#if activeThread.messages && activeThread.messages.length > 0}
					{#each activeThread.messages as msg (msg.id)}
						<div class="message-bubble">
							<div class="message-meta">
								<span class="message-author">{msg.author}</span>
								<span class="message-time">{timeAgo(msg.timestamp)}</span>
							</div>
							<div class="message-content">{msg.text}</div>
						</div>
					{/each}
				{:else}
					<div class="no-messages">No messages yet</div>
				{/if}
			</div>
			<div class="reply-bar">
				<input
					type="text"
					bind:value={replyContent}
					placeholder="Write a reply..."
					class="reply-input"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							sendReply();
						}
					}}
				/>
				<button class="send-btn" onclick={sendReply} disabled={!replyContent.trim()}> Send </button>
			</div>
		</div>
	{:else}
		<!-- List view -->
		<div class="threads-header">
			<span class="thread-count"
				>{filteredThreads.length} thread{filteredThreads.length !== 1 ? 's' : ''}</span
			>
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
				<input
					type="text"
					bind:value={newMunicipality}
					placeholder="Municipality (optional)..."
					class="municipality-input"
				/>
				<button class="save-btn" onclick={createThread} disabled={!newTitle.trim()}>
					Create Thread
				</button>
			</div>
		{/if}

		<div class="thread-list">
			{#each filteredThreads as thread (thread.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="thread-card" onclick={() => (selectedThread = thread.id)}>
					<div class="thread-header">
						{#if thread.municipality}
							<span class="thread-municipality">{thread.municipality}</span>
						{/if}
						<span class="thread-time">{timeAgo(thread.createdAt)}</span>
					</div>
					<div class="thread-title">{thread.title}</div>
					{#if thread.messages.length > 0}
						<div class="thread-preview">
							{thread.messages[thread.messages.length - 1].text}
						</div>
					{/if}
					<div class="thread-footer">
						<span class="message-count"
							>{thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''}</span
						>
						<button
							class="delete-btn"
							onclick={(e) => {
								e.stopPropagation();
								deleteThread(thread.id);
							}}>Delete</button
						>
					</div>
				</div>
			{:else}
				<div class="empty" role="status">
					No threads yet. Start a discussion about council items, bylaws, or anything civic.
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

	.sync-banner {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 6px;
		background: var(--bg-surface-hover);
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		line-height: 1.3;
	}

	.sync-icon {
		font-size: 0.875rem;
		opacity: 0.6;
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
	.municipality-input {
		padding: 6px 10px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.75rem;
		font-family: inherit;
		outline: none;
	}

	.title-input:focus,
	.municipality-input:focus {
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
		border: none;
		text-align: left;
		cursor: pointer;
		width: 100%;
		font-family: inherit;
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

	.thread-municipality {
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

	.thread-detail {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 6px;
	}

	.detail-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border-primary);
	}

	.back-btn {
		font-size: 0.6875rem;
		padding: 3px 8px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.back-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-hover);
	}

	.detail-municipality {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--accent-primary);
		letter-spacing: 0.05em;
	}

	.detail-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.message-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 4px 0;
	}

	.message-bubble {
		padding: 8px 10px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.message-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2px;
	}

	.message-author {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--accent-secondary);
	}

	.message-content {
		font-size: 0.75rem;
		color: var(--text-primary);
		line-height: 1.4;
	}

	.message-time {
		font-size: 0.5625rem;
		color: var(--text-tertiary);
	}

	.no-messages {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.reply-bar {
		display: flex;
		gap: 6px;
		padding-top: 6px;
		border-top: 1px solid var(--border-primary);
	}

	.reply-input {
		flex: 1;
		padding: 8px 10px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.75rem;
		font-family: inherit;
		outline: none;
	}

	.reply-input:focus {
		border-color: var(--accent-primary);
	}

	.send-btn {
		padding: 8px 14px;
		border-radius: 6px;
		border: none;
		background: var(--accent-primary);
		color: var(--text-inverse);
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
