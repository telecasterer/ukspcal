<script lang="ts">
    import DocPage from "$lib/components/DocPage.svelte";
    import { renderMarkdown } from "$lib/markdown";
    import privacyMarkdown from "./privacy.md?raw";

    const html = renderMarkdown(privacyMarkdown);
</script>

<svelte:head>
    <title>Privacy Policy - UK State Pension Calendar</title>
    <meta
        name="description"
        content="Privacy Policy for UK State Pension Calendar."
    />
    <meta property="og:title" content="Privacy Policy - UK State Pension Calendar" />
    <meta
        property="og:description"
        content="How UK State Pension Calendar handles your data."
    />
    <meta property="og:url" content="https://ukspcal.vercel.app/privacy" />
    <meta property="og:type" content="website" />
    <link rel="canonical" href="https://ukspcal.vercel.app/privacy" />
</svelte:head>

<DocPage
    barTitle="Privacy Policy"
    heading="Privacy Policy"
    intro="How this app handles your data — local storage, analytics, and exports."
    {html}
/>
