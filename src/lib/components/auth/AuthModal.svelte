<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';

	let mode = $state<'login' | 'signup' | 'reset'>('login');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);
	let message = $state<string | null>(null);

	function close() {
		authStore.showAuthModal = false;
		error = null;
		message = null;
		email = '';
		password = '';
	}

	async function handleSubmit() {
		error = null;
		message = null;
		submitting = true;

		if (mode === 'login') {
			const result = await authStore.signInWithEmail(email, password);
			if (result.error) {
				error = result.error;
			} else {
				close();
			}
		} else if (mode === 'signup') {
			const result = await authStore.signUpWithEmail(email, password);
			if (result.error) {
				error = result.error;
			} else {
				message = 'Check your email for a confirmation link.';
			}
		} else if (mode === 'reset') {
			const result = await authStore.resetPassword(email);
			if (result.error) {
				error = result.error;
			} else {
				message = 'Password reset email sent.';
			}
		}

		submitting = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if authStore.showAuthModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-backdrop" role="presentation" onclick={close}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="modal"
			role="dialog"
			aria-label="Authentication"
			onclick={(e) => e.stopPropagation()}
		>
			<button class="close-btn" onclick={close} aria-label="Close">&times;</button>

			<h2 class="modal-title">
				{#if mode === 'login'}Sign In
				{:else if mode === 'signup'}Create Account
				{:else}Reset Password
				{/if}
			</h2>

			{#if !authStore.configured}
				<div class="not-configured">
					<p>Supabase is not configured yet.</p>
					<p class="hint">
						Set <code>PUBLIC_SUPABASE_URL</code> and
						<code>PUBLIC_SUPABASE_ANON_KEY</code> in your .env file.
					</p>
				</div>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<label class="field">
						<span>Email</span>
						<input type="email" bind:value={email} required autocomplete="email" />
					</label>

					{#if mode !== 'reset'}
						<label class="field">
							<span>Password</span>
							<input
								type="password"
								bind:value={password}
								required
								minlength="6"
								autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
							/>
						</label>
					{/if}

					{#if error}
						<div class="error-msg">{error}</div>
					{/if}

					{#if message}
						<div class="success-msg">{message}</div>
					{/if}

					<button type="submit" class="submit-btn" disabled={submitting}>
						{#if submitting}...
						{:else if mode === 'login'}Sign In
						{:else if mode === 'signup'}Create Account
						{:else}Send Reset Link
						{/if}
					</button>
				</form>

				<div class="mode-switch">
					{#if mode === 'login'}
						<button onclick={() => (mode = 'signup')}>Create an account</button>
						<button onclick={() => (mode = 'reset')}>Forgot password?</button>
					{:else if mode === 'signup'}
						<button onclick={() => (mode = 'login')}>Already have an account?</button>
					{:else}
						<button onclick={() => (mode = 'login')}>Back to sign in</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		backdrop-filter: blur(4px);
	}

	.modal {
		background: var(--bg-surface-elevated);
		border: 1px solid var(--border-primary);
		border-radius: 16px;
		padding: 32px;
		width: 380px;
		max-width: 90vw;
		position: relative;
		box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
	}

	.close-btn {
		position: absolute;
		top: 12px;
		right: 16px;
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--text-tertiary);
		cursor: pointer;
		line-height: 1;
	}

	.close-btn:hover {
		color: var(--text-primary);
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 24px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 16px;
	}

	.field span {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field input {
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.field input:focus {
		border-color: var(--accent-primary);
	}

	.submit-btn {
		width: 100%;
		padding: 10px;
		border-radius: 8px;
		border: none;
		background: var(--accent-primary);
		color: var(--text-inverse);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
		margin-top: 8px;
	}

	.submit-btn:hover {
		opacity: 0.9;
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-msg {
		font-size: 0.75rem;
		color: var(--accent-danger);
		margin-bottom: 8px;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.success-msg {
		font-size: 0.75rem;
		color: var(--accent-secondary);
		margin-bottom: 8px;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.mode-switch {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid var(--border-primary);
	}

	.mode-switch button {
		background: none;
		border: none;
		color: var(--accent-primary);
		font-size: 0.75rem;
		cursor: pointer;
	}

	.mode-switch button:hover {
		text-decoration: underline;
	}

	.not-configured {
		text-align: center;
		padding: 16px 0;
		color: var(--text-tertiary);
		font-size: 0.8125rem;
	}

	.hint {
		font-size: 0.75rem;
		margin-top: 8px;
	}

	.hint code {
		font-family: 'Geist Mono', monospace;
		font-size: 0.6875rem;
		padding: 1px 4px;
		border-radius: 3px;
		background: var(--bg-surface);
	}
</style>
