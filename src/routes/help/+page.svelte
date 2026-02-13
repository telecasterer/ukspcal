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
    import { Accordion, AccordionItem, Button, Footer, FooterIcon } from "flowbite-svelte";
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
        role="main"
    >
        <!-- Main help content rendered as accordion sections (full width) -->
        <Accordion class="w-full">
            {#each sections as section, i}
                <AccordionItem
                    classes={{
                        // inactive: "bg-white dark:bg-gray-800",
                        content: "bg-white dark:bg-gray-900/30",
                    }}
                >
                    {#snippet header()}
                        <span>{section.title}</span>
                    {/snippet}
                    {#if section.subSections}
                        {#if section.html !== undefined}
                            <div
                                class="help-markdown prose prose-sm prose-blue dark:prose-invert max-w-none mb-2"
                            >
                                {@html section.html}
                            </div>
                        {/if}
                        <!-- Render H3 subsections as nested accordions -->
                        <Accordion class="w-full ml-2">
                            {#each section.subSections as sub, j}
                                <AccordionItem
                                    classes={{
                                        content: "bg-white dark:bg-gray-900/30",
                                    }}
                                >
                                    {#snippet header()}
                                        <span>{sub.title}</span>
                                    {/snippet}
                                    <div
                                        class="help-markdown prose prose-sm prose-blue dark:prose-invert max-w-none"
                                    >
                                        {@html sub.html}
                                    </div>
                                </AccordionItem>
                            {/each}
                        </Accordion>
                    {:else if section.html !== undefined}
                        <div
                            class="help-markdown prose prose-sm prose-blue dark:prose-invert max-w-none"
                        >
                            {@html section.html}
                        </div>
                    {/if}
                </AccordionItem>
            {/each}
        </Accordion>
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
</style>
