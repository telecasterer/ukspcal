<script lang="ts">
            import { detectFacebookInAppBrowser } from "$lib/utils/inAppBrowser";
            import { onMount, tick } from "svelte";
            import AppFooter from "$lib/components/AppFooter.svelte";
            let isFacebookInAppBrowser: boolean = false;

            onMount(() => {
                const ua = navigator.userAgent ?? "";
                isFacebookInAppBrowser = detectFacebookInAppBrowser({
                    userAgent: ua,
                    href: window.location.href,
                });
            });
        // --- Dark mode state and utility (copied from main page) ---
        function readDarkModeFromStorage(): boolean {
            if (typeof window === "undefined") return false;
            try {
                return localStorage.getItem("darkMode") === "true";
            } catch {
                return false;
            }
        }
        let darkMode: boolean = readDarkModeFromStorage();

        // Make darkMode reactive and persist to localStorage, update document class
        $: {
            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem("darkMode", darkMode.toString());
                } catch {}
                if (darkMode) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            }
        }
    /**
     * --- HELP PAGE LOGIC ---
     *
     * 1. Extract the latest bank holiday from layout data.
     * 2. Replace the placeholder in the markdown with the formatted date.
     * 3. Parse the markdown into structured sections and subsections for rendering.
     */

    // --- 1. Extract latest bank holiday from layout data ---
    export let data: { bankHolidays: Record<string, string> };
    const bankHolidays = data?.bankHolidays || {};
    // Get the latest bank holiday ISO date and name (or fallback)
    const lastBankHolidayIso = Object.keys(bankHolidays).sort().pop();
    const latestBankHolidayString = lastBankHolidayIso
        ? `${new Date(lastBankHolidayIso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} (${bankHolidays[lastBankHolidayIso]})`
        : "not available";

    // --- 2. Import markdown and replace placeholder ---
    import MarkdownIt from "markdown-it";
    import helpMarkdown from "./help.md?raw";
    import {
        Accordion,
        AccordionItem,
        Button,
        Footer,
        FooterIcon,
    } from "flowbite-svelte";
    import { buildInfo, buildInfoFormatted } from "$lib/buildInfo";

    // Replace the placeholder in the markdown with the latest bank holiday string
    const helpMarkdownReplaced = helpMarkdown.replace("{{LATEST_BANK_HOLIDAY}}", latestBankHolidayString);

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
    {#if isFacebookInAppBrowser}
        <div class="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900">
            <div class="max-w-7xl mx-auto px-4 py-1">
                <p class="text-xs text-amber-800 dark:text-amber-200 leading-snug">
                    <span class="sm:hidden">Tip: works best in Safari/Chrome/Edge (use “Open in browser”).</span>
                    <span class="hidden sm:inline">Tip: this app works best in Safari/Chrome/Edge (use “Open in browser”).</span>
                </p>
            </div>
        </div>
    {/if}
    <!-- Blue top bar, matching main page -->
    <!-- Exact copy of main page top bar for perfect alignment -->
    <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
            <div class="flex items-center gap-2">
                <img src="/favicon.svg" alt="App icon" class="w-7 h-7" style="margin-bottom:2px;" />
                <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">Help</span>
            </div>
            <div class="flex items-center gap-2">
                <a
                    href="/"
                    class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    ← Back
                </a>
                <button
                    onclick={() => { darkMode = !darkMode; }}
                    class="text-2xl p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Toggle dark mode"
                >
                    {#if darkMode}
                        ☀️
                    {:else}
                        🌙
                    {/if}
                </button>
            </div>
        </div>
    </nav>
    <!-- Main content area -->
    <div class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1">
        <div class="max-w-4xl mx-auto space-y-6">

            <!-- Main help content rendered as accordion sections -->
            <div
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
                <Accordion class="w-full">
                    {#each sections as section, i}
                        <AccordionItem
                            classes={{
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
                                                content:
                                                    "bg-white dark:bg-gray-900/30",
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

                    <!-- App details as last accordion item -->
                    <AccordionItem
                        classes={{ content: "bg-white dark:bg-gray-900/30" }}
                    >
                        {#snippet header()}
                            <span>Version information</span>
                        {/snippet}
                        <div
                            class="help-markdown prose prose-sm prose-blue dark:prose-invert max-w-none"
                        >
                            <dl>
                                <div
                                    class="flex flex-row flex-nowrap items-baseline"
                                >
                                    <dt class="font-semibold min-w-[6.5rem]">
                                        Developer:
                                    </dt>
                                    <dd class="ml-2">Paul Robins</dd>
                                </div>
                                <div
                                    class="flex flex-row flex-nowrap items-baseline"
                                >
                                    <dt class="font-semibold min-w-[6.5rem]">
                                        Version:
                                    </dt>
                                    <dd class="ml-2">
                                        {buildInfo.version} (commit {buildInfo.commit})
                                    </dd>
                                </div>
                                <div
                                    class="flex flex-row flex-nowrap items-baseline"
                                >
                                    <dt class="font-semibold min-w-[6.5rem]">
                                        Commit date:
                                    </dt>
                                    <dd class="ml-2">
                                        {buildInfoFormatted.commitDate}
                                    </dd>
                                </div>
                                <div
                                    class="flex flex-row flex-nowrap items-baseline"
                                >
                                    <dt class="font-semibold min-w-[6.5rem]">
                                        Build date:
                                    </dt>
                                    <dd class="ml-2">
                                        {buildInfoFormatted.buildTime}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <AppFooter />
</div>

<style>
    /* Make hash navigation land nicely below the header area */
    .prose :global(h3) {
        scroll-margin-top: 4rem;
    }
</style>
