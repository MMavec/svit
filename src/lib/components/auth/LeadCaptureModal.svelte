<script lang="ts">
	import { leadStore } from '$lib/stores/leads.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { municipalities } from '$lib/config/municipalities';

	let step = $state(1);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);
	let showPrivacy = $state(false);

	// Step 1 fields
	let email = $state('');
	let name = $state('');
	let municipality = $state(municipalityStore.slug || '');

	// Step 2 fields
	let phone = $state('');
	let bluesky = $state('');
	let twitter = $state('');
	let facebook = $state('');
	let instagram = $state('');

	// Step 3 fields
	let interests = $state<string[]>([]);
	let consentPrivacy = $state(false);
	let consentMarketing = $state(false);

	const interestOptions = [
		{ id: 'council', label: 'Council Meetings' },
		{ id: 'development', label: 'Development' },
		{ id: 'transit', label: 'Transit' },
		{ id: 'safety', label: 'Safety & Emergency' },
		{ id: 'events', label: 'Community Events' },
		{ id: 'budget', label: 'Budget & Finance' },
		{ id: 'wildlife', label: 'Wildlife & Nature' },
		{ id: 'environment', label: 'Environment' }
	];

	function toggleInterest(id: string) {
		if (interests.includes(id)) {
			interests = interests.filter((i) => i !== id);
		} else {
			interests = [...interests, id];
		}
	}

	function close() {
		leadStore.showModal = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	async function submit() {
		if (!consentPrivacy) {
			error = 'Please accept the privacy policy';
			return;
		}
		submitting = true;
		error = null;

		const socialAccounts = [
			bluesky && { platform: 'bluesky', handle: bluesky },
			twitter && { platform: 'twitter', handle: twitter },
			facebook && { platform: 'facebook', handle: facebook },
			instagram && { platform: 'instagram', handle: instagram }
		].filter(Boolean) as { platform: string; handle: string }[];

		const result = await leadStore.submitLead({
			email,
			phone: phone || undefined,
			name: name || undefined,
			municipality: municipality || undefined,
			interests,
			consent_marketing: consentMarketing,
			consent_privacy: true,
			source: 'modal',
			social_accounts: socialAccounts.length > 0 ? socialAccounts : undefined
		});

		submitting = false;
		if (result.success) {
			success = true;
		} else {
			error = result.error || 'Something went wrong';
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (leadStore.showModal) handleKeydown(e);
	}}
/>

{#if leadStore.showModal}
	<div class="modal-backdrop" role="presentation" onclick={close}></div>
	<div class="modal" role="dialog" aria-label="Stay informed" aria-modal="true">
		<button class="modal-close" onclick={close} aria-label="Close">&times;</button>

		{#if success}
			<div class="success-view">
				<div class="success-icon">&#10003;</div>
				<h2>You're all set!</h2>
				<p>You'll receive updates based on your preferences.</p>
				<button class="btn-primary" onclick={close}>Done</button>
			</div>
		{:else if step === 1}
			<h2 class="modal-title">Stay Informed About Your Community</h2>
			<p class="modal-subtitle">Get civic alerts and updates for your municipality.</p>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					if (email) step = 2;
				}}
			>
				<label class="field">
					<span class="field-label">Email <span class="required">*</span></span>
					<input type="email" bind:value={email} placeholder="you@example.com" required />
				</label>
				<label class="field">
					<span class="field-label">Name</span>
					<input type="text" bind:value={name} placeholder="Your name (optional)" />
				</label>
				<label class="field">
					<span class="field-label">Municipality of interest</span>
					<select bind:value={municipality}>
						<option value="">All CRD</option>
						{#each municipalities as m (m.slug)}
							<option value={m.slug}>{m.name}</option>
						{/each}
					</select>
				</label>
				<button class="btn-primary" type="submit" disabled={!email}>Next</button>
			</form>
		{:else if step === 2}
			<h2 class="modal-title">Connect Your Accounts</h2>
			<p class="modal-subtitle">Optional — help us reach you on your preferred platforms.</p>
			<div class="fields">
				<label class="field">
					<span class="field-label">Phone number</span>
					<input type="tel" bind:value={phone} placeholder="+1 (250) 555-0000" />
				</label>
				<label class="field">
					<span class="field-label">Bluesky</span>
					<input type="text" bind:value={bluesky} placeholder="@you.bsky.social" />
				</label>
				<label class="field">
					<span class="field-label">X / Twitter</span>
					<input type="text" bind:value={twitter} placeholder="@handle" />
				</label>
				<label class="field">
					<span class="field-label">Facebook</span>
					<input type="text" bind:value={facebook} placeholder="facebook.com/you" />
				</label>
				<label class="field">
					<span class="field-label">Instagram</span>
					<input type="text" bind:value={instagram} placeholder="@handle" />
				</label>
			</div>
			<div class="btn-group">
				<button class="btn-secondary" onclick={() => (step = 3)}>Skip</button>
				<button class="btn-primary" onclick={() => (step = 3)}>Next</button>
			</div>
		{:else}
			<h2 class="modal-title">Your Preferences</h2>
			<p class="modal-subtitle">What topics interest you?</p>
			<div class="interest-grid">
				{#each interestOptions as opt (opt.id)}
					<button
						class="interest-chip"
						class:selected={interests.includes(opt.id)}
						onclick={() => toggleInterest(opt.id)}
						type="button"
					>
						{opt.label}
					</button>
				{/each}
			</div>
			<div class="consent-fields">
				<label class="consent-label">
					<input type="checkbox" bind:checked={consentPrivacy} />
					<span
						>I agree to the <button
							class="link-btn"
							type="button"
							onclick={() => (showPrivacy = true)}>privacy policy</button
						></span
					>
				</label>
				<label class="consent-label">
					<input type="checkbox" bind:checked={consentMarketing} />
					<span>Send me email alerts about topics I follow</span>
				</label>
			</div>
			{#if error}
				<p class="error-text">{error}</p>
			{/if}
			<div class="btn-group">
				<button class="btn-secondary" onclick={() => (step = 2)}>Back</button>
				<button class="btn-primary" onclick={submit} disabled={submitting || !consentPrivacy}>
					{submitting ? 'Submitting...' : 'Submit'}
				</button>
			</div>
		{/if}
	</div>

	{#if showPrivacy}
		<div class="privacy-backdrop" role="presentation" onclick={() => (showPrivacy = false)}></div>
		<div class="privacy-modal" role="dialog" aria-label="Privacy Policy" aria-modal="true">
			<button class="modal-close" onclick={() => (showPrivacy = false)} aria-label="Close"
				>&times;</button
			>
			<h2 class="modal-title">Privacy Policy</h2>
			<div class="privacy-content">
				<h3>What We Collect</h3>
				<p>
					Email address (required), name, phone number, social media handles, municipality
					preference, and topic interests — all voluntarily provided by you.
				</p>
				<h3>How We Use It</h3>
				<p>
					To send you civic alerts and updates about topics and municipalities you follow. We will
					never sell or share your data with third parties.
				</p>
				<h3>Data Storage</h3>
				<p>
					Your data is stored securely in Supabase with encryption at rest. Only the SVIT
					administrator has access to your information.
				</p>
				<h3>Your Rights</h3>
				<p>
					You can request deletion of your data at any time by contacting the administrator. You can
					unsubscribe from communications at any time.
				</p>
				<h3>Contact</h3>
				<p>For privacy inquiries, contact the SVIT administrator.</p>
			</div>
			<button class="btn-primary" onclick={() => (showPrivacy = false)}>Close</button>
		</div>
	{/if}
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 150;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 420px;
		max-height: 85vh;
		overflow-y: auto;
		background: var(--bg-surface-elevated);
		border: 1px solid var(--border-primary);
		border-radius: 16px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
		z-index: 151;
		padding: 28px;
		animation: modal-in 0.2s ease;
	}

	@keyframes modal-in {
		from {
			opacity: 0;
			transform: translate(-50%, -48%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.modal-close {
		position: absolute;
		top: 12px;
		right: 12px;
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
		font-size: 1.25rem;
	}

	.modal-close:hover {
		background: var(--border-primary);
		color: var(--text-primary);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.modal-subtitle {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin-bottom: 20px;
	}

	.field {
		display: block;
		margin-bottom: 14px;
	}

	.field-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 4px;
	}

	.required {
		color: var(--accent-danger);
	}

	.field input,
	.field select {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.8125rem;
		transition: border-color 0.15s;
	}

	.field input:focus,
	.field select:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.fields {
		display: flex;
		flex-direction: column;
	}

	.interest-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
	}

	.interest-chip {
		padding: 6px 14px;
		border: 1px solid var(--border-primary);
		border-radius: 20px;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.interest-chip:hover {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.interest-chip.selected {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: #fff;
	}

	.consent-fields {
		margin-bottom: 16px;
	}

	.consent-label {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 8px;
		cursor: pointer;
	}

	.consent-label input[type='checkbox'] {
		margin-top: 2px;
		accent-color: var(--accent-primary);
	}

	.link-btn {
		background: none;
		border: none;
		color: var(--accent-primary);
		cursor: pointer;
		text-decoration: underline;
		font-size: inherit;
		padding: 0;
	}

	.btn-primary {
		width: 100%;
		padding: 10px;
		border: none;
		border-radius: 8px;
		background: var(--accent-primary);
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		padding: 10px;
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-secondary:hover {
		background: var(--bg-surface-hover);
	}

	.btn-group {
		display: flex;
		gap: 8px;
	}

	.btn-group .btn-secondary {
		flex: 0 0 auto;
	}

	.btn-group .btn-primary {
		flex: 1;
	}

	.error-text {
		font-size: 0.75rem;
		color: var(--accent-danger);
		margin-bottom: 12px;
	}

	.success-view {
		text-align: center;
		padding: 16px 0;
	}

	.success-icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--accent-secondary);
		color: #fff;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.success-view h2 {
		font-size: 1.125rem;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.success-view p {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin-bottom: 20px;
	}

	/* Privacy modal */
	.privacy-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 160;
	}

	.privacy-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 480px;
		max-height: 80vh;
		overflow-y: auto;
		background: var(--bg-surface-elevated);
		border: 1px solid var(--border-primary);
		border-radius: 16px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
		z-index: 161;
		padding: 28px;
	}

	.privacy-content {
		margin-bottom: 20px;
	}

	.privacy-content h3 {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-top: 16px;
		margin-bottom: 4px;
	}

	.privacy-content p {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
</style>
