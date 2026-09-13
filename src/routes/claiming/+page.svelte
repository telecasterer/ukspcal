<script lang="ts">
    import DocPage from "$lib/components/DocPage.svelte";
    import { page } from "$app/state";
    import { renderMarkdownDocument } from "$lib/markdown";
    import { daysUntilIso, isIsoDate } from "$lib/utils/isoDateHelpers";
    import claimingMarkdown from "./claiming.md?raw";

    const spaDateIso = $derived.by(() => {
        const value = page.url.searchParams.get("spaDate") ?? "";
        return isIsoDate(value) ? value : "";
    });

    const showAsapWarning = $derived.by(() => {
        if (!spaDateIso) return false;
        const days = daysUntilIso(spaDateIso);
        return days >= 0 && days <= 92;
    });

    const { html, headings } = renderMarkdownDocument(claimingMarkdown);

    // Share the page itself, without the user's ?spaDate= parameter.
    const shareUrl = $derived(`${page.url.origin}${page.url.pathname}`);
</script>

<DocPage
    barTitle="How to Claim"
    heading="How to claim your State Pension"
    intro="How to claim, and who to contact, in England, Scotland and Wales, Northern Ireland, and overseas."
    {html}
    {headings}
    share={{ text: "How to claim the UK State Pension, with phone numbers for the UK and abroad.", url: shareUrl }}
>
    <!-- Rendered at the doc-insert marker in claiming.md: after the Northern Ireland
         section, since invitation letters don't apply to overseas claims. -->
    {#snippet insert()}
        <div
            role="note"
            class="not-prose my-6 space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm sm:text-base dark:border-amber-700 dark:bg-amber-900/30"
        >
            <p class="font-semibold text-amber-900 dark:text-amber-200">
                No invitation letter? (UK and Northern Ireland)
            </p>
            {#if showAsapWarning}
                <p class="font-medium leading-relaxed text-amber-900 dark:text-amber-200">
                    You are within 3 months of your State Pension age. If you have not
                    claimed yet and have not received an invitation letter, request an
                    invitation code on GOV.UK or call the relevant number above.
                </p>
            {:else}
                <p class="leading-relaxed text-gray-800 dark:text-gray-200">
                    If you are within 3 months of your State Pension age and have not
                    received an invitation letter, you can request an invitation code on
                    GOV.UK or call the relevant number above to claim.
                </p>
            {/if}
        </div>
    {/snippet}
</DocPage>

<svelte:head>
    <title>How to Claim - UK State Pension Calendar</title>
    <meta
        name="description"
        content="How to claim your UK State Pension in the UK or from abroad, with key phone numbers."
    />
    <meta
        property="og:description"
        content="How to claim your UK State Pension in the UK or from abroad, with key phone numbers."
    />
    <meta property="og:url" content="https://ukspcal.vercel.app/claiming" />
    <link rel="canonical" href="https://ukspcal.vercel.app/claiming" />
</svelte:head>
