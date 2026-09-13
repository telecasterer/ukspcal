<script lang="ts">
    import DocPage from "$lib/components/DocPage.svelte";
    import { GithubSolid } from "flowbite-svelte-icons";
    import { buildInfo, buildInfoFormatted } from "$lib/buildInfo";
    import { renderMarkdownDocument, replaceMarkdownPlaceholders } from "$lib/markdown";
    import helpMarkdown from "./help.md?raw";

    // Build info placeholders used in the Version Information section
    const placeholderMap: Record<string, string> = {
        "{{BUILDINFO_SUMMARY}}": buildInfoFormatted.summary,
        "{{BUILDINFO_RELEASE}}": buildInfoFormatted.release,
        "{{BUILDINFO_VERSION}}": buildInfo.version,
        "{{BUILDINFO_COMMIT}}": buildInfoFormatted.commitShort,
        "{{BUILDINFO_COMMIT_DATE}}": buildInfoFormatted.commitDate,
        "{{BUILDINFO_BUILD_TIME}}": buildInfoFormatted.buildTime,
    };

    const { html, headings } = renderMarkdownDocument(
        replaceMarkdownPlaceholders(helpMarkdown, placeholderMap)
    );
</script>

<DocPage
    barTitle="Help"
    heading="Help & guidance"
    intro="How to use the calculator, how payment dates are worked out, and where to find official guidance."
    {html}
    {headings}
    share={{ text: "Calculate your State Pension Age and payment calendar." }}
>
    <div class="mt-8 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
        <a
            href="https://github.com/telecasterer/ukspcal"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="View source code on GitHub"
        >
            <GithubSolid class="h-4 w-4" />
            <span>Source code</span>
        </a>
    </div>
</DocPage>

<svelte:head>
    <title>Help - UK State Pension Calendar</title>
    <meta property="og:title" content="Help - UK State Pension Calendar" />
    <meta
        property="og:description"
        content="Learn how to use the UK State Pension Calendar. Get answers to frequently asked questions and understand how to calculate your pension dates."
    />
    <meta property="og:url" content="https://ukspcal.vercel.app/help" />
    <link rel="canonical" href="https://ukspcal.vercel.app/help" />
</svelte:head>
