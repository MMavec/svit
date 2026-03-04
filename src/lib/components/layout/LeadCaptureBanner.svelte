<script lang="ts">
	import { onMount } from 'svelte';
	import { leadStore } from '$lib/stores/leads.svelte';

	let email = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let bannerError = $state<string | null>(null);
	let visible = $state(false);

	onMount(() => {
		if (!leadStore.shouldShowPrompt()) return;
		// Show banner after 30 seconds of page visit
		const timer = setTimeout(() => {
			if (leadStore.shouldShowPrompt()) {
				visible = true;
				leadStore.showPrompt = true;
			}
		}, 30_000);
		return () => clearTimeout(timer);
	});

	async function quickSubmit(e: Event) {
		e.preventDefault();
		if (!email) return;
		submitting = true;
		bannerError = null;
		const result = await leadStore.submitLead({
			email,
			consent_marketing: true,
			consent_privacy: true,
			source: 'banner'
		});
		submitting = false;
		if (result.success) {
			submitted = true;
			setTimeout(() => {
				visible = false;
			}, 3000);
		} else {
			bannerError = result.error || 'Failed to subscribe';
		}
	}

	function dismiss() {
		leadStore.dismiss();
		visible = false;
	}

	function openModal() {
		leadStore.openModal();
		visible = false;
	}
</script>

{#if visible && leadStore.showPrompt}
	<div class="lead-banner" role="complementary" aria-label="Subscribe for updates">
		{#if submitted}
			<div class="banner-success">Subscribed! You'll receive civic updates.</div>
		{:else}
			<div class="banner-content">
				<span class="banner-text">Get civic alerts for your municipality</span>
				<form class="banner-form" onsubmit={quickSubmit}>
					<input
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						required
						class="banner-input"
					/>
					<button type="submit" class="banner-submit" disabled={submitting}>
						{submitting ? '...' : 'Subscribe'}
					</button>
				</form>
				<button class="banner-link" onclick={openModal}>More options</button>
				{#if bannerError}
					<span class="banner-error">{bannerError}</span>
				{/if}
			</div>
			<button class="banner-dismiss" onclick={dismiss} aria-label="Dismiss">&times;</button>
		{/if}
	</div>
{/if}

<style>
	.lead-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 90;
		background: var(--bg-surface-elevated);
		border-top: 1px solid var(--border-primary);
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
		padding: 12px 20px;
		display: flex;
		align-items: center;
		gap: 12px;
		animation: slide-up 0.3s ease;
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		flex-wrap: wrap;
	}

	.banner-text {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.banner-form {
		display: flex;
		gap: 4px;
		flex: 1;
		min-width: 200px;
		max-width: 320px;
	}

	.banner-input {
		flex: 1;
		padding: 6px 12px;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.75rem;
	}

	.banner-input:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.banner-submit {
		padding: 6px 16px;
		border: none;
		border-radius: 6px;
		background: var(--accent-primary);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: opacity 0.15s;
	}

	.banner-submit:hover {
		opacity: 0.9;
	}

	.banner-submit:disabled {
		opacity: 0.5;
	}

	.banner-link {
		background: none;
		border: none;
		color: var(--accent-primary);
		font-size: 0.6875rem;
		cursor: pointer;
		text-decoration: underline;
		white-space: nowrap;
	}

	.banner-error {
		font-size: 0.6875rem;
		color: var(--accent-danger);
	}

	.banner-dismiss {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: 50%;
		font-size: 1.125rem;
		flex-shrink: 0;
	}

	.banner-dismiss:hover {
		background: var(--border-primary);
		color: var(--text-primary);
	}

	.banner-success {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--accent-secondary);
		flex: 1;
		text-align: center;
	}

	@media (max-width: 600px) {
		.lead-banner {
			padding: 10px 12px;
			flex-direction: column;
			gap: 8px;
		}

		.banner-content {
			flex-direction: column;
			align-items: stretch;
			gap: 8px;
		}

		.banner-form {
			max-width: none;
		}

		.banner-dismiss {
			position: absolute;
			top: 8px;
			right: 8px;
		}
	}
</style>
