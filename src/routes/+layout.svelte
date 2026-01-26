<script lang="ts">
	import "../app.css";
	import { injectAnalytics } from "@vercel/analytics/sveltekit";
	import { onMount } from "svelte";
	import { registerSW } from "virtual:pwa-register";

	let { children } = $props();

	onMount(() => {
		injectAnalytics();
		registerSW({ immediate: true });
	});
</script>

<svelte:head>
	<script>
		// Prevent flash of light mode on reload
		if (typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true') {
			document.documentElement.classList.add('dark');
		}
	</script>
	<link rel="icon" href="/favicon.svg" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{@render children()}
