<script lang="ts">
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { urlState } from '$lib/stores/url-state.svelte';

	interface Props {
		panelId?: string;
		panelTitle?: string;
		onclose: () => void;
	}

	let { panelId, panelTitle, onclose }: Props = $props();

	let copied = $state(false);

	function getShareUrl(): string {
		return urlState.getShareUrl(panelId);
	}

	function getShareText(): string {
		const parts: string[] = [];
		if (panelTitle) parts.push(panelTitle);
		const label = municipalityStore.label;
		if (label && label !== 'All CRD') parts.push(`in ${label}`);
		parts.push('- SVIT: South Vancouver Island Tracker');
		return parts.join(' ');
	}

	function shareTwitter() {
		const url = getShareUrl();
		const text = getShareText();
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
			'_blank',
			'noopener,noreferrer,width=550,height=420'
		);
		onclose();
	}

	function shareFacebook() {
		const url = getShareUrl();
		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
			'_blank',
			'noopener,noreferrer,width=550,height=420'
		);
		onclose();
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(getShareUrl());
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Fallback for older browsers
			const input = document.createElement('input');
			input.value = getShareUrl();
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	function shareInstagram() {
		copyLink();
		window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
	}

	function shareTikTok() {
		copyLink();
		window.open('https://www.tiktok.com/', '_blank', 'noopener,noreferrer');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="share-backdrop" role="presentation" onclick={onclose}></div>
<div class="share-drawer" role="dialog" aria-label="Share" aria-modal="true">
	<div class="share-header">
		<span class="share-title">Share</span>
		<button class="share-close" onclick={onclose} aria-label="Close">&times;</button>
	</div>

	{#if panelTitle}
		<div class="share-context">
			{panelTitle}
			{#if municipalityStore.label !== 'All CRD'}
				<span class="share-muni">{municipalityStore.label}</span>
			{/if}
		</div>
	{/if}

	<div class="share-buttons">
		<button class="share-option" onclick={shareTwitter}>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
				/>
			</svg>
			<span>X / Twitter</span>
		</button>

		<button class="share-option" onclick={shareFacebook}>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
				/>
			</svg>
			<span>Facebook</span>
		</button>

		<button class="share-option" onclick={shareInstagram}>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
				/>
			</svg>
			<span>Instagram</span>
			<span class="share-note">Copies link</span>
		</button>

		<button class="share-option" onclick={shareTikTok}>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
				/>
			</svg>
			<span>TikTok</span>
			<span class="share-note">Copies link</span>
		</button>

		<button class="share-option copy-option" onclick={copyLink}>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
				<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
			</svg>
			<span>{copied ? 'Copied!' : 'Copy Link'}</span>
		</button>
	</div>

	<div class="share-url-preview">
		{getShareUrl()}
	</div>
</div>

<style>
	.share-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 200;
	}

	.share-drawer {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 400px;
		background: var(--bg-surface-elevated);
		border: 1px solid var(--border-primary);
		border-bottom: none;
		border-radius: 16px 16px 0 0;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
		z-index: 201;
		padding: 16px;
		animation: slide-up 0.25s ease;
	}

	@keyframes slide-up {
		from {
			transform: translateX(-50%) translateY(100%);
		}
		to {
			transform: translateX(-50%) translateY(0);
		}
	}

	.share-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.share-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.share-close {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: var(--border-primary);
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: 50%;
		font-size: 1.125rem;
		transition: all 0.15s;
	}

	.share-close:hover {
		background: var(--bg-surface-hover);
		color: var(--text-primary);
	}

	.share-context {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border-primary);
	}

	.share-muni {
		color: var(--accent-primary);
		margin-left: 4px;
	}

	.share-buttons {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.share-option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: none;
		border-radius: 10px;
		background: transparent;
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
	}

	.share-option:hover {
		background: var(--bg-surface-hover);
	}

	.share-note {
		margin-left: auto;
		font-size: 0.625rem;
		color: var(--text-tertiary);
		font-weight: 400;
	}

	.copy-option {
		border-top: 1px solid var(--border-primary);
		margin-top: 4px;
		padding-top: 12px;
	}

	.share-url-preview {
		font-size: 0.625rem;
		font-family: 'Geist Mono', monospace;
		color: var(--text-tertiary);
		margin-top: 12px;
		padding: 8px;
		background: var(--bg-surface);
		border-radius: 6px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
