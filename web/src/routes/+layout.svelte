<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { injectAnalytics } from "@vercel/analytics/sveltekit";
	import { onMount } from "svelte";

	let { children } = $props();

	onMount(() => {
		injectAnalytics();
	});
</script>

<svelte:head>
	<script>
		// Prevent flash of light mode on reload
		if (typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true') {
			document.documentElement.classList.add('dark');
		}
	</script>
	<link rel="icon" href="{favicon}" />
</svelte:head>

{@render children()}
