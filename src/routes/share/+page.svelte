<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		window.location.replace(data.redirectUrl);
	});
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={data.description} />
	<meta property="og:image" content={data.ogImage} />
	<meta property="og:url" content={data.redirectUrl} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.title} />
	<meta name="twitter:description" content={data.description} />
	<meta name="twitter:image" content={data.ogImage} />
	<meta http-equiv="refresh" content="0;url={data.redirectUrl}" />
</svelte:head>

<div
	style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:#94a3b8;font-family:system-ui"
>
	<p>Redirecting to SVIT...</p>
</div>
