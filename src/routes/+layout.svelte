<script lang="ts">
	import "../app.css";
	import { injectAnalytics } from "@vercel/analytics/sveltekit";
	import { onMount } from "svelte";
	import { registerSW } from "virtual:pwa-register";
	import FloatingFeedbackButton from "$lib/components/FloatingFeedbackButton.svelte";

	let { children } = $props();

	onMount(() => {
		injectAnalytics();
		const updateSW = registerSW({
			immediate: true,
			onNeedRefresh() {
				// New service worker is available, activate and reload
				updateSW(true);
			},
			onOfflineReady() {
				// App is ready to work offline
			}
		});
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
	
	<!-- Base Meta Tags -->
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Calculate your UK State Pension payment dates based on your National Insurance code and date of birth. Get an accurate pension schedule with bank holiday considerations." />
	<meta name="keywords" content="UK State Pension, pension calculator, State Pension age, pension dates, National Insurance" />
	<meta name="theme-color" content="#2563eb" />
	
	<!-- Open Graph Tags -->
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_GB" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href="https://ukspcal.vercel.app" />
	
	<!-- Schema.org Structured Data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "UK State Pension Calculator",
			"description": "Calculate your UK State Pension payment dates based on your National Insurance code and date of birth",
			"url": "https://ukspcal.vercel.app",
			"applicationCategory": "FinanceApplication",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "GBP"
			},
			"aggregateRating": {
				"@type": "AggregateRating",
				"ratingValue": "4.8",
				"ratingCount": "150"
			},
			"potentialAction": {
				"@type": "CalculateAction",
				"target": {
					"@type": "EntryPoint",
					"urlTemplate": "https://ukspcal.vercel.app",
					"actionPlatform": ["DesktopWebPlatform", "MobileWebPlatform"]
				}
			}
		}
	</script>
	
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "Calculator",
			"name": "UK State Pension Payment Calculator",
			"description": "Calculate precise UK State Pension payment dates with bank holiday adjustments",
			"url": "https://ukspcal.vercel.app",
			"applicationCategory": "FinanceApplication"
		}
	</script>
</svelte:head>

{@render children()}
<FloatingFeedbackButton />
