<script lang="ts">
    import { detectFacebookInAppBrowserFromWindow } from "$lib/utils/inAppBrowser";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import { onMount } from "svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "$lib/utils/clipboard";
    import { capturePosthog } from "$lib/utils/posthog";
    import { goto } from "$app/navigation";

    let isFacebookInAppBrowser: boolean = $state(false);
    let copyLinkStatus = $state("");

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
    let darkMode: boolean = $state(readDarkModeFromStorage());

    // Persist darkMode to localStorage and update document class reactively
    $effect(() => {
        if (typeof window !== "undefined") {
            persistDarkModeToStorage(darkMode);
            applyDarkModeClass(darkMode);
        }
    });
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
    import helpMarkdown from "./help.md?raw";
    import { Button } from "flowbite-svelte";
    import {
        ArrowLeftOutline,
        ChevronDownOutline,
        MoonOutline,
        SunOutline,
    } from "flowbite-svelte-icons";
    import { buildInfo, buildInfoFormatted } from "$lib/buildInfo";
    import {
        parseMarkdownSections,
        replaceMarkdownPlaceholders,
        type MarkdownSection,
    } from "$lib/markdown";

    // Replace placeholders in the markdown with dynamic values
    const placeholderMap: Record<string, string> = {
        "{{BUILDINFO_SUMMARY}}": buildInfoFormatted.summary,
        "{{BUILDINFO_RELEASE}}": buildInfoFormatted.release,
        "{{BUILDINFO_VERSION}}": buildInfo.version,
        "{{BUILDINFO_COMMIT}}": buildInfoFormatted.commitShort,
        "{{BUILDINFO_COMMIT_DATE}}": buildInfoFormatted.commitDate,
        "{{BUILDINFO_BUILD_TIME}}": buildInfoFormatted.buildTime,
    };

    const helpMarkdownReplaced = replaceMarkdownPlaceholders(helpMarkdown, placeholderMap);

    // --- 3. Parse markdown into structured sections ---
    const sections: MarkdownSection[] = parseMarkdownSections(helpMarkdownReplaced);

    // No JS-driven animation: rely on native <details> behaviour
</script>

<div class="flex flex-col min-h-screen">
    <!-- Blue top bar, matching main page -->
    <TopBar title="Help" showInAppBanner={isFacebookInAppBrowser}>
        <svelte:fragment slot="actions">
            <Button
                color="light"
                size="xs"
                class="toolbar-btn"
                onclick={() => {
                    goto("/");
                }}
            >
                <span class="inline-flex items-center gap-1.5">
                    <ArrowLeftOutline class="h-4 w-4" ariaLabel="Back" />
                    <span>Back</span>
                </span>
            </Button>
            <ShareButton
                shareText="Calculate your State Pension Age and payment calendar."
                size="xs"
                buttonClass="toolbar-btn"
            />
            <Button
                color="light"
                size="xs"
                class="toolbar-icon-btn"
                onclick={() => {
                    darkMode = !darkMode;
                }}
                title="Toggle dark mode"
                aria-label="Toggle dark mode"
            >
                {#if darkMode}
                    <SunOutline class="h-4 w-4" ariaLabel="Light mode" />
                {:else}
                    <MoonOutline class="h-4 w-4" ariaLabel="Dark mode" />
                {/if}
            </Button>
        </svelte:fragment>
    </TopBar>
    <!-- Main content area: full-width single section, no card or rounded corners -->
    <main
        class="app-page-bg page-bottom-safe-area py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1"
    >
        <div class="page-container-help w-full">
            <header class="mb-6 sm:mb-8 max-w-3xl">
                <h1
                    class="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3"
                >
                    Help & guidance
                </h1>
                <p class="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2">
                    Expand a section below for setup steps, privacy details, and
                    troubleshooting.
                </p>
            </header>
            <div
                class="card-surface w-full summary-section p-5 sm:p-6 space-y-2 help-top-container"
            >
                {#each sections as section, i}
                    <details class="custom-details group" open={i === 0}>
                        <summary
                            class="custom-summary flex items-center justify-between px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-gray-100"
                        >
                            <span>{section.title}</span>
                            <span class="chev" aria-hidden="true">
                                <ChevronDownOutline class="h-4 w-4" ariaLabel="Expand" />
                            </span>
                        </summary>

                        {#if section.html !== undefined}
                            <div class="details-content">
                                <div
                                    class="doc-markdown help-markdown prose prose-sm sm:prose-base prose-blue dark:prose-invert max-w-none px-3 pb-2"
                                >
                                    {@html section.html}
                                </div>
                            </div>
                        {/if}

                        {#if section.subSections}
                            <div class="px-3 pb-2 space-y-1">
                                {#each section.subSections as sub}
                                    <details class="custom-details group ml-4">
                                        <summary
                                            class="custom-summary flex items-center justify-between px-2 py-1 text-sm sm:text-base text-gray-900 dark:text-gray-100"
                                        >
                                            <span>{sub.title}</span>
                                            <span class="chev" aria-hidden="true">
                                                <ChevronDownOutline
                                                    class="h-4 w-4"
                                                    ariaLabel="Expand"
                                                />
                                            </span>
                                        </summary>
                                        <div class="details-content">
                                            <div
                                                class="doc-markdown help-markdown prose prose-sm sm:prose-base prose-blue dark:prose-invert max-w-none px-2 pb-1"
                                            >
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

    /* Reduce vertical spacing for grouped container */
    .help-top-container > details + details {
        margin-top: 0.25rem;
    }
</style>
