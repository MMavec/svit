<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { supabase } from '$lib/supabase';
	import { municipalities } from '$lib/config/municipalities';

	interface Connection {
		id: string;
		councillor_name: string;
		municipality: string;
		relationship: 'constituent' | 'met' | 'working-with' | 'following';
		notes: string;
		last_contact: string | null;
	}

	const RELATIONSHIP_LABELS: Record<string, string> = {
		constituent: 'Constituent',
		met: 'Met',
		'working-with': 'Working with',
		following: 'Following'
	};

	let connections = $state<Connection[]>([]);
	let loading = $state(false);
	let showAdd = $state(false);
	let newName = $state('');
	let newMunicipality = $state<string>(municipalityStore.slug || 'victoria');
	let newRelationship = $state<Connection['relationship']>('following');
	let newNotes = $state('');

	async function loadConnections() {
		if (!supabase || !authStore.isAuthenticated) return;
		loading = true;
		const { data } = await supabase
			.from('connections')
			.select('*')
			.eq('user_id', authStore.user!.id)
			.order('last_contact', { ascending: false });
		connections = (data || []) as Connection[];
		loading = false;
	}

	async function addConnection() {
		if (!supabase || !authStore.isAuthenticated || !newName.trim()) return;
		const { error } = await supabase.from('connections').insert({
			user_id: authStore.user!.id,
			councillor_name: newName.trim(),
			municipality: newMunicipality,
			relationship: newRelationship,
			notes: newNotes.trim(),
			last_contact: new Date().toISOString()
		});
		if (!error) {
			newName = '';
			newNotes = '';
			showAdd = false;
			await loadConnections();
		}
	}

	async function deleteConnection(id: string) {
		if (!supabase) return;
		await supabase.from('connections').delete().eq('id', id);
		connections = connections.filter((c) => c.id !== id);
	}

	function municipalityName(slug: string): string {
		return municipalities.find((m) => m.slug === slug)?.name || slug;
	}

	function municipalityColor(slug: string): string {
		return municipalities.find((m) => m.slug === slug)?.color || 'var(--accent-primary)';
	}

	const filteredConnections = $derived(
		municipalityStore.slug
			? connections.filter((c) => c.municipality === municipalityStore.slug)
			: connections
	);

	$effect(() => {
		if (authStore.isAuthenticated) {
			loadConnections();
		}
	});
</script>

<div class="connections">
	{#if !authStore.isAuthenticated}
		<div class="auth-prompt">
			<div class="auth-icon">&#128279;</div>
			<p class="auth-text">Sign in to track your civic connections</p>
			<button class="auth-btn" onclick={() => (authStore.showAuthModal = true)}> Sign In </button>
		</div>
	{:else if loading}
		<div class="loading">Loading connections...</div>
	{:else}
		<div class="conn-header">
			<span class="conn-count"
				>{filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}</span
			>
			<button class="add-btn" onclick={() => (showAdd = !showAdd)}>
				{showAdd ? 'Cancel' : '+ Add'}
			</button>
		</div>

		{#if showAdd}
			<div class="add-form">
				<input
					type="text"
					bind:value={newName}
					placeholder="Name (councillor, staff, etc.)"
					class="name-input"
				/>
				<div class="form-row">
					<select bind:value={newMunicipality} class="select-field">
						{#each municipalities as m (m.slug)}
							<option value={m.slug}>{m.name}</option>
						{/each}
					</select>
					<select bind:value={newRelationship} class="select-field">
						<option value="following">Following</option>
						<option value="constituent">Constituent</option>
						<option value="met">Met</option>
						<option value="working-with">Working with</option>
					</select>
				</div>
				<textarea bind:value={newNotes} placeholder="Notes..." class="notes-input" rows="2"
				></textarea>
				<button class="save-btn" onclick={addConnection} disabled={!newName.trim()}>
					Add Connection
				</button>
			</div>
		{/if}

		<div class="conn-list">
			{#each filteredConnections as conn (conn.id)}
				<div class="conn-card">
					<div class="conn-name">{conn.councillor_name}</div>
					<div class="conn-meta">
						<span class="conn-municipality" style="color: {municipalityColor(conn.municipality)}">
							{municipalityName(conn.municipality)}
						</span>
						<span class="conn-relationship"
							>{RELATIONSHIP_LABELS[conn.relationship] || conn.relationship}</span
						>
					</div>
					{#if conn.notes}
						<div class="conn-notes">{conn.notes}</div>
					{/if}
					<div class="conn-footer">
						{#if conn.last_contact}
							<span class="last-contact">
								Last contact: {new Date(conn.last_contact).toLocaleDateString('en-CA', {
									month: 'short',
									day: 'numeric'
								})}
							</span>
						{/if}
						<button class="delete-btn" onclick={() => deleteConnection(conn.id)}>Remove</button>
					</div>
				</div>
			{:else}
				<div class="empty">No connections yet</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.connections {
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

	.conn-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border-primary);
	}

	.conn-count {
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

	.name-input,
	.notes-input {
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

	.name-input:focus,
	.notes-input:focus {
		border-color: var(--accent-primary);
	}

	.form-row {
		display: flex;
		gap: 6px;
	}

	.select-field {
		flex: 1;
		padding: 6px 8px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.6875rem;
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

	.conn-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
		flex: 1;
	}

	.conn-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
	}

	.conn-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.conn-meta {
		display: flex;
		gap: 8px;
		margin-top: 2px;
		font-size: 0.625rem;
	}

	.conn-relationship {
		color: var(--text-tertiary);
		font-style: italic;
	}

	.conn-notes {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		margin-top: 4px;
		line-height: 1.3;
	}

	.conn-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 6px;
	}

	.last-contact {
		font-size: 0.625rem;
		color: var(--text-tertiary);
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
	}
</style>
