<script lang="ts">
    import { detectFacebookInAppBrowserFromWindow } from "$lib/utils/inAppBrowser";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import { onMount, tick } from "svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "$lib/utils/clipboard";
    import { capturePosthog } from "$lib/utils/posthog";
    import { goto } from "$app/navigation";

    let isFacebookInAppBrowser: boolean = false;
    let copyLinkStatus = "";

    onMount(() => {
        isFacebookInAppBrowser = detectFacebookInAppBrowserFromWindow();
        capturePosthog("help_opened");
    });

    async function handleCopyLink() {
        copyLinkStatus = "";
        const ok = await copyLinkToClipboardUtil();
        copyLinkStatus = ok
            ? "Link copied."
            : "Couldn't copy automatically — please copy the address bar URL.";
    }

    // Share handled by ShareButton component
    // --- Dark mode state ---
    let darkMode: boolean = readDarkModeFromStorage();

    // Make darkMode reactive and persist to localStorage, update document class
    $: {
        if (typeof window !== "undefined") {
            persistDarkModeToStorage(darkMode);
            applyDarkModeClass(darkMode);
        }
    }
    /**
     * --- HELP PAGE LOGIC ---
     *
     * 1. Extract the latest bank holiday from layout data.
     * 2. Replace the placeholder in the markdown with the formatted date.
     * 3. Parse the markdown into structured sections and subsections for rendering.
     */

    // --- 1. Layout data (no per-help placeholders required) ---
    // The help markdown no longer uses a dynamic latest-bank-holiday placeholder.

    // --- 2. Import markdown and replace placeholder ---
    import MarkdownIt from "markdown-it";
    import helpMarkdown from "./help.md?raw";
    import { Button } from "flowbite-svelte";
    import { buildInfo, buildInfoFormatted } from "$lib/buildInfo";

    // Replace placeholders in the markdown with dynamic values
    const placeholderMap: Record<string, string> = {
        "{{BUILDINFO_VERSION}}": buildInfo.version,
        "{{BUILDINFO_COMMIT}}": buildInfo.commit,
        "{{BUILDINFO_COMMIT_DATE}}": buildInfoFormatted.commitDate,
        "{{BUILDINFO_BUILD_TIME}}": buildInfoFormatted.buildTime,
    };

    const helpMarkdownReplaced = Object.entries(placeholderMap).reduce(
        (acc, [key, value]) => acc.replaceAll(key, value),
        helpMarkdown
    );

    // --- 3. Parse markdown into structured sections ---
    // Types for help sections
    type HelpSubSection = { title: string; html: string };
    type HelpSection = {
        title: string;
        html?: string;
        subSections?: HelpSubSection[];
    };

    // Initialize markdown parser
    const md = new MarkdownIt({ html: true, linkify: true });
    const sections: HelpSection[] = [];
    const allTokens = md.parse(helpMarkdownReplaced, {});

    // State for section parsing
    let currentSection: HelpSection | null = null;
    let currentSubSection: HelpSubSection | null = null;
    let bodyTokens: any[] = [];
    let subBodyTokens: any[] = [];

    /**
     * Push the current H3 subsection (if any) into the current H2 section.
     * Renders the collected tokens as HTML.
     */
    function pushSubSection(): void {
        if (currentSubSection && currentSection) {
            currentSubSection.html = md.renderer.render(subBodyTokens, md.options, {});
            if (!currentSection.subSections) currentSection.subSections = [];
            currentSection.subSections.push(currentSubSection);
            currentSubSection = null;
            subBodyTokens = [];
        }
    }

    /**
     * Push the current H2 section (if any) into the sections array.
     * Renders the collected tokens as HTML.
     */
    function pushSection(): void {
        if (!currentSection) return;
        // If there were any H3s, render content before first H3 as html
        if (currentSection.subSections && bodyTokens.length > 0) {
            currentSection.html = md.renderer.render(bodyTokens, md.options, {});
        } else if (!currentSection.subSections) {
            // No H3s: render all content as html
            currentSection.html = md.renderer.render(bodyTokens, md.options, {});
        }
        sections.push(currentSection);
        currentSection = null;
        currentSubSection = null;
        bodyTokens = [];
        subBodyTokens = [];
    }

    // --- Main token parsing loop ---
    // Walk through all tokens and build up sections and subsections
    for (let i = 0; i < allTokens.length; i++) {
        const token = allTokens[i];
        if (token.type === "heading_open" && token.tag === "h2") {
            pushSubSection();
            pushSection();
            const inline = allTokens[i + 1];
            currentSection = {
                title: inline && inline.type === "inline" ? inline.content.trim() : "Section",
            };
            // Skip over the h2 (heading_open, inline, heading_close).
            while (i < allTokens.length && allTokens[i].type !== "heading_close") i++;
            continue;
        } else if (token.type === "heading_open" && token.tag === "h3") {
            pushSubSection();
            const inline = allTokens[i + 1];
            currentSubSection = {
                title: inline && inline.type === "inline" ? inline.content.trim() : "Subsection",
                html: "",
            };
            // Skip over the h3 (heading_open, inline, heading_close).
            while (i < allTokens.length && allTokens[i].type !== "heading_close") i++;
            continue;
        }
        if (currentSubSection) {
            subBodyTokens.push(token);
        } else if (currentSection) {
            bodyTokens.push(token);
        }
    }
    // Ensure the last section is included
    pushSubSection();
    pushSection();

    // No JS-driven animation: rely on native <details> behaviour
</script>

<div class="flex flex-col min-h-screen">
    <!-- Blue top bar, matching main page -->
    <TopBar title="Help" showInAppBanner={isFacebookInAppBrowser}>
        <svelte:fragment slot="actions">
            <Button
                color="light"
                size="sm"
                onclick={() => {
                    goto("/");
                }}
            >
                ← Back
            </Button>
            <ShareButton
                shareText="Calculate your State Pension Age and payment calendar."
                size="sm"
            />
            <Button
                color="light"
                size="sm"
                onclick={() => {
                    darkMode = !darkMode;
                }}
                title="Toggle dark mode"
            >
                {#if darkMode}
                    ☀️
                {:else}
                    🌙
                {/if}
            </Button>
        </svelte:fragment>
    </TopBar>
    <!-- Main content area: full-width single section, no card or rounded corners -->
    <main
        class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1"
    >
        <!-- Main help content: all top-level items grouped in a single bordered container -->
        <div class="w-full">
            <div class="w-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 summary-section rounded-lg p-4 space-y-2 help-top-container">
                {#each sections as section}
                    <details class="custom-details group">
                        <summary class="custom-summary flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <span>{section.title}</span>
                            <span class="chev" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </span>
                        </summary>

                        {#if section.html !== undefined}
                            <div class="details-content">
                                <div class="help-markdown prose prose-sm prose-blue dark:prose-invert max-w-none px-3 pb-2">
                                    {@html section.html}
                                </div>
                            </div>
                        {/if}

                        {#if section.subSections}
                            <div class="px-3 pb-2 space-y-1">
                                {#each section.subSections as sub}
                                    <details class="custom-details group ml-4">
                                        <summary class="custom-summary flex items-center justify-between px-2 py-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                <span>{sub.title}</span>
                                                <span class="chev" aria-hidden="true">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                    </svg>
                                                </span>
                                            </summary>
                                            <div class="details-content">
                                                <div class="help-markdown prose prose-sm prose-blue dark:prose-invert max-w-none px-2 pb-1">
                                                    {@html sub.html}
                                                </div>
                                            </div>
                                    </details>
                                {/each}
                            </div>
                        {/if}
                    </details>
                {/each}
            </div>
        </div>
    </main>

    <!-- Footer -->
    <AppFooter />
</div>

<svelte:head>
    <title>Help - UK State Pension Calculator</title>
    <meta property="og:title" content="Help - UK State Pension Calculator" />
    <meta
        property="og:description"
        content="Learn how to use the UK State Pension Calculator. Get answers to frequently asked questions and understand how to calculate your pension dates."
    />
    <meta property="og:url" content="https://ukspcal.vercel.app/help" />
    <link rel="canonical" href="https://ukspcal.vercel.app/help" />
</svelte:head>

<style>
    /* Make hash navigation land nicely below the header area */
    .prose :global(h3) {
        scroll-margin-top: 4rem;
    }

    /* Custom details/summary styling with animated chevron */
    .custom-summary {
        cursor: pointer;
    }
    .custom-summary:hover { background-color: rgba(0,0,0,0.03); }
    :global(.dark) .custom-summary:hover { background-color: rgba(255,255,255,0.03); }
    .custom-summary .chev {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transform: rotate(0deg);
        transition: none;
        color: inherit;
    }
    details[open] > .custom-summary .chev {
        transform: rotate(180deg);
    }
    /* Hide default marker */
    summary::-webkit-details-marker { display: none; }
    summary::marker { display: none; }

    /* Reduce vertical spacing for grouped container */
    .help-top-container > details + details { margin-top: 0.25rem; }

    /* Make subsection summaries visually match H2 summaries */
    .custom-details .custom-summary { gap: 0.5rem; }

    /* No animation: use native details/summary behaviour */
    .details-content {
        display: block;
        max-height: none;
        opacity: 1;
        transform: none;
        overflow: visible;
        transition: none;
    }
</style>
