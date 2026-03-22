<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { supabase } from '$lib/supabase';
	import { councillors } from '$lib/config/councillors';
	import { municipalities } from '$lib/config/municipalities';
	import type { Councillor } from '$lib/types/index';

	const STORAGE_KEY = 'svit-followed-councillors';

	type FilterMode = 'all' | 'followed';

	let filterMode = $state<FilterMode>('all');
	let followedIds = $state<string[]>(loadFollowed());
	let syncing = $state(false);

	function loadFollowed(): string[] {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) return parsed;
			}
		} catch {
			// ignore
		}
		return [];
	}

	function saveFollowed(ids: string[]) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
		} catch {
			// ignore
		}
	}

	function isFollowed(id: string): boolean {
		return followedIds.includes(id);
	}

	function toggleFollow(id: string) {
		if (isFollowed(id)) {
			followedIds = followedIds.filter((fid) => fid !== id);
		} else {
			followedIds = [...followedIds, id];
		}
		saveFollowed(followedIds);
		if (authStore.isAuthenticated) {
			syncToSupabase();
		}
	}

	async function syncToSupabase() {
		if (!supabase || !authStore.isAuthenticated || !authStore.user) return;
		syncing = true;
		try {
			// Delete existing connections for this user
			await supabase.from('connections').delete().eq('user_id', authStore.user.id);
			// Insert current follows
			if (followedIds.length > 0) {
				const rows = followedIds.map((cid) => {
					const c = councillors.find((cc) => cc.id === cid);
					return {
						user_id: authStore.user!.id,
						councillor_name: c?.name ?? cid,
						municipality: c?.municipality ?? 'victoria',
						relationship: 'following',
						notes: '',
						last_contact: new Date().toISOString()
					};
				});
				await supabase.from('connections').insert(rows);
			}
		} catch {
			// silent failure for sync
		}
		syncing = false;
	}

	async function loadFromSupabase() {
		if (!supabase || !authStore.isAuthenticated || !authStore.user) return;
		try {
			const { data } = await supabase
				.from('connections')
				.select('councillor_name')
				.eq('user_id', authStore.user.id);
			if (data && data.length > 0) {
				// Match Supabase names back to councillor IDs
				const ids: string[] = [];
				for (const row of data) {
					const match = councillors.find(
						(c) => c.name === row.councillor_name
					);
					if (match) ids.push(match.id);
				}
				if (ids.length > 0) {
					followedIds = ids;
					saveFollowed(followedIds);
				}
			}
		} catch {
			// silent
		}
	}

	// On auth change, load from Supabase
	$effect(() => {
		if (authStore.isAuthenticated) {
			loadFromSupabase();
		}
	});

	function municipalityName(slug: string): string {
		return municipalities.find((m) => m.slug === slug)?.name || slug;
	}

	function municipalityColor(slug: string): string {
		return municipalities.find((m) => m.slug === slug)?.color || 'var(--accent-primary)';
	}

	function roleLabel(role: Councillor['role']): string {
		switch (role) {
			case 'mayor':
				return 'Mayor';
			case 'councillor':
				return 'Councillor';
			case 'director':
				return 'Director';
			case 'chair':
				return 'Chair';
			default:
				return role;
		}
	}

	function socialUrl(platform: string, handle: string): string {
		switch (platform) {
			case 'twitter':
				return `https://x.com/${handle}`;
			case 'bluesky':
				return `https://bsky.app/profile/${handle}`;
			case 'facebook':
				return `https://facebook.com/${handle}`;
			case 'instagram':
				return `https://instagram.com/${handle}`;
			case 'website':
				return handle.startsWith('http') ? handle : `https://${handle}`;
			default:
				return '#';
		}
	}

	function socialLabel(platform: string): string {
		switch (platform) {
			case 'twitter':
				return 'X';
			case 'bluesky':
				return 'BS';
			case 'facebook':
				return 'FB';
			case 'instagram':
				return 'IG';
			case 'website':
				return 'WEB';
			default:
				return platform;
		}
	}

	function socialTitle(platform: string): string {
		switch (platform) {
			case 'twitter':
				return 'X (Twitter)';
			case 'bluesky':
				return 'Bluesky';
			case 'facebook':
				return 'Facebook';
			case 'instagram':
				return 'Instagram';
			case 'website':
				return 'Website';
			default:
				return platform;
		}
	}

	// Get unique municipality slugs present in the councillor list (for filter buttons in All CRD view)
	const municipalitySlugs = $derived(
		[...new Set(councillors.filter((c) => c.active).map((c) => c.municipality))]
	);

	let municipalityFilter = $state<string | null>(null);

	const filteredCouncillors = $derived.by(() => {
		let list = councillors.filter((c) => c.active);

		// Filter by selected municipality from the global selector
		if (municipalityStore.slug) {
			list = list.filter((c) => c.municipality === municipalityStore.slug);
		} else if (municipalityFilter) {
			// In All CRD view, allow sub-filtering by municipality
			list = list.filter((c) => c.municipality === municipalityFilter);
		}

		// Filter by follow status
		if (filterMode === 'followed') {
			list = list.filter((c) => followedIds.includes(c.id));
		}

		// Sort: followed first, then mayors first, then alphabetical
		list = [...list].sort((a, b) => {
			const aFollowed = followedIds.includes(a.id) ? 0 : 1;
			const bFollowed = followedIds.includes(b.id) ? 0 : 1;
			if (aFollowed !== bFollowed) return aFollowed - bFollowed;
			const aRole = a.role === 'mayor' ? 0 : 1;
			const bRole = b.role === 'mayor' ? 0 : 1;
			if (aRole !== bRole) return aRole - bRole;
			return a.lastName.localeCompare(b.lastName);
		});

		return list;
	});

	const followedCount = $derived(followedIds.length);
	const totalShown = $derived(filteredCouncillors.length);
</script>

<div class="connections">
	{#if !authStore.isAuthenticated}
		<div class="sync-banner" role="status">
			<span class="sync-icon">&#9729;</span>
			<span>Sign in to sync follows across devices</span>
			<button class="sync-sign-in" onclick={() => (authStore.showAuthModal = true)}>
				Sign in
			</button>
		</div>
	{/if}

	<div class="filter-bar">
		<div class="filter-tabs">
			<button
				class="filter-tab"
				class:active={filterMode === 'all'}
				onclick={() => (filterMode = 'all')}
			>
				All
			</button>
			<button
				class="filter-tab"
				class:active={filterMode === 'followed'}
				onclick={() => (filterMode = 'followed')}
			>
				Followed
				{#if followedCount > 0}
					<span class="follow-badge">{followedCount}</span>
				{/if}
			</button>
		</div>
		{#if !municipalityStore.slug}
			<div class="municipality-filters">
				<button
					class="muni-chip"
					class:active={municipalityFilter === null}
					onclick={() => (municipalityFilter = null)}
				>
					All CRD
				</button>
				{#each municipalitySlugs as slug (slug)}
					<button
						class="muni-chip"
						class:active={municipalityFilter === slug}
						style="--chip-color: {municipalityColor(slug)}"
						onclick={() => (municipalityFilter = municipalityFilter === slug ? null : slug)}
					>
						{municipalities.find((m) => m.slug === slug)?.abbreviation ?? slug}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="conn-count" role="status">
		{totalShown} councillor{totalShown !== 1 ? 's' : ''}
		{#if syncing}
			<span class="sync-status">syncing...</span>
		{/if}
	</div>

	<div class="councillor-list">
		{#each filteredCouncillors as councillor (councillor.id)}
			<div class="councillor-card" class:is-followed={isFollowed(councillor.id)}>
				<div class="card-main">
					<div class="card-left">
						<div class="card-name-row">
							<span class="card-name">{councillor.name}</span>
							{#if councillor.role === 'mayor'}
								<span class="mayor-badge">Mayor</span>
							{/if}
						</div>
						<div class="card-meta">
							<span
								class="card-municipality"
								style="color: {municipalityColor(councillor.municipality)}"
							>
								{municipalityName(councillor.municipality)}
							</span>
							{#if councillor.role !== 'mayor'}
								<span class="card-role">{roleLabel(councillor.role)}</span>
							{/if}
						</div>
						<div class="card-links">
							{#if councillor.social}
								{#each Object.entries(councillor.social) as [platform, handle]}
									{#if handle}
										<a
											href={socialUrl(platform, handle)}
											target="_blank"
											rel="noopener noreferrer"
											class="social-link"
											class:social-twitter={platform === 'twitter'}
											class:social-bluesky={platform === 'bluesky'}
											class:social-facebook={platform === 'facebook'}
											class:social-instagram={platform === 'instagram'}
											class:social-website={platform === 'website'}
											title={socialTitle(platform)}
										>
											{socialLabel(platform)}
										</a>
									{/if}
								{/each}
							{/if}
							{#if councillor.email}
								<a
									href="mailto:{councillor.email}"
									class="social-link social-email"
									title="Email {councillor.name}"
								>
									@
								</a>
							{/if}
						</div>
					</div>
					<button
						class="follow-btn"
						class:following={isFollowed(councillor.id)}
						onclick={() => toggleFollow(councillor.id)}
						aria-label={isFollowed(councillor.id)
							? `Unfollow ${councillor.name}`
							: `Follow ${councillor.name}`}
						title={isFollowed(councillor.id) ? 'Unfollow' : 'Follow'}
					>
						{isFollowed(councillor.id) ? '\u2605' : '\u2606'}
					</button>
				</div>
			</div>
		{:else}
			<div class="empty" role="status">
				{#if filterMode === 'followed'}
					No followed councillors yet. Star councillors to follow them.
				{:else}
					No councillors found.
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.connections {
		display: flex;
		flex-direction: column;
		gap: 6px;
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
	}

	.sync-icon {
		font-size: 0.875rem;
		opacity: 0.6;
	}

	.sync-sign-in {
		margin-left: auto;
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid var(--accent-primary);
		background: transparent;
		color: var(--accent-primary);
		font-size: 0.625rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.sync-sign-in:hover {
		background: var(--accent-primary);
		color: var(--text-inverse);
	}

	.filter-bar {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.filter-tabs {
		display: flex;
		gap: 4px;
	}

	.filter-tab {
		padding: 4px 12px;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.filter-tab.active {
		background: var(--accent-primary);
		color: var(--text-inverse);
		border-color: var(--accent-primary);
	}

	.follow-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		border-radius: 8px;
		background: var(--accent-warning);
		color: #000;
		font-size: 0.5625rem;
		font-weight: 700;
		line-height: 1;
	}

	.municipality-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
	}

	.muni-chip {
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 0.5625rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	.muni-chip.active {
		background: var(--chip-color, var(--accent-primary));
		color: #fff;
		border-color: var(--chip-color, var(--accent-primary));
	}

	.muni-chip:hover:not(.active) {
		border-color: var(--chip-color, var(--accent-primary));
		color: var(--chip-color, var(--accent-primary));
	}

	.conn-count {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.sync-status {
		font-size: 0.5625rem;
		color: var(--accent-primary);
		font-style: italic;
	}

	.councillor-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
		flex: 1;
	}

	.councillor-card {
		padding: 8px;
		border-radius: 8px;
		background: var(--bg-surface-hover);
		border-left: 3px solid transparent;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.councillor-card.is-followed {
		border-left-color: var(--accent-warning);
	}

	.councillor-card:hover {
		background: var(--bg-surface);
	}

	.card-main {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.card-left {
		flex: 1;
		min-width: 0;
	}

	.card-name-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.card-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mayor-badge {
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--accent-primary);
		color: var(--text-inverse);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		flex-shrink: 0;
	}

	.card-meta {
		display: flex;
		gap: 8px;
		margin-top: 2px;
		font-size: 0.625rem;
	}

	.card-role {
		color: var(--text-tertiary);
	}

	.card-links {
		display: flex;
		gap: 4px;
		margin-top: 4px;
		flex-wrap: wrap;
	}

	.social-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.5625rem;
		font-weight: 700;
		text-decoration: none;
		border: 1px solid var(--border-primary);
		color: var(--text-secondary);
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
		line-height: 1.2;
	}

	.social-link:hover {
		background: var(--bg-surface);
	}

	.social-twitter:hover {
		color: #1da1f2;
		border-color: #1da1f2;
	}

	.social-bluesky:hover {
		color: #0085ff;
		border-color: #0085ff;
	}

	.social-facebook:hover {
		color: #1877f2;
		border-color: #1877f2;
	}

	.social-instagram:hover {
		color: #e4405f;
		border-color: #e4405f;
	}

	.social-website:hover {
		color: var(--accent-secondary);
		border-color: var(--accent-secondary);
	}

	.social-email:hover {
		color: var(--accent-primary);
		border-color: var(--accent-primary);
	}

	.follow-btn {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border: 1px solid var(--border-primary);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 1rem;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s,
			background 0.15s;
		line-height: 1;
	}

	.follow-btn:hover {
		color: var(--accent-warning);
		border-color: var(--accent-warning);
	}

	.follow-btn.following {
		color: var(--accent-warning);
		border-color: var(--accent-warning);
		background: color-mix(in srgb, var(--accent-warning) 10%, transparent);
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
