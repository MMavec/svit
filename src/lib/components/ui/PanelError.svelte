<script lang="ts">
	interface Props {
		message: string;
		onRetry?: () => void;
	}

	let { message, onRetry }: Props = $props();
</script>

<div class="panel-error" role="alert">
	<span class="error-icon" aria-hidden="true">&#x26A0;</span>
	<span class="error-message">{message}</span>
	{#if onRetry}
		<button class="retry-btn" onclick={onRetry}>Try again</button>
	{/if}
</div>

<style>
	.panel-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		flex: 1;
		padding: 12px;
		text-align: center;
	}

	.error-icon {
		font-size: 1.25rem;
		color: var(--text-tertiary);
		line-height: 1;
	}

	.error-message {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.retry-btn {
		margin-top: 2px;
		padding: 6px 16px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: transparent;
		color: var(--accent-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.retry-btn:hover {
		background: var(--bg-surface-hover);
	}
</style>
