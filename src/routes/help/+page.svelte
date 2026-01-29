<script lang="ts">
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
    <div
        class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1"
    >
        <div class="max-w-4xl mx-auto space-y-6">
            
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h1
                        class="text-3xl font-bold text-gray-900 dark:text-white"
                    >
                        Help
                    </h1>
                    <p class="mt-2 text-gray-600 dark:text-gray-300">
                        This app calculates your UK State Pension age and
                        payment calendar and allows you to print or export the
                        calendar as csv or ics files.
                    </p>
                </div>
                <Button color="light" href="/" class="shrink-0">← Back</Button>
            </div>

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

    <!-- Footer with sources and GitHub link -->
    <Footer
        footerType="default"
        class="rounded-none border-t border-gray-200 dark:border-gray-700 shadow-none p-3 md:p-3"
    >
        <div
            class="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="text-xs text-gray-500 dark:text-gray-400">
                Sources: GOV.UK State Pension age guidance, the published State
                Pension age timetable, and UK bank holiday lists.
            </div>

            <div class="flex items-center gap-2">
                <FooterIcon
                    href="https://github.com/telecasterer/ukspcal"
                    ariaLabel="GitHub repository"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    <svg
                        viewBox="0 0 98 96"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4"
                    >
                        <path
                            d="M48.9 0C21.9 0 0 22.1 0 49.2c0 21.2 13.5 38.9 31.7 45.5 2.6 1 5.1-.8 5.1-3.4v-7.7c-1.3.6-3.1 1-4.6 1-6.3 0-10-3.4-12.7-9.9-1.1-2.6-2.2-4.1-4.4-4.4-1.1-.1-1.5-.6-1.5-1.1 0-1.1 1.9-2 3.8-2 2.8 0 5.2 1.7 7.7 5.3 1.9 2.8 3.9 4 6.3 4 2.4 0 3.9-.9 6.1-3.1 1.6-1.6 2.9-3 4-4-12.6-1.5-21.5-10.6-21.5-22.4 0-4.8 1.7-9.9 4.6-13.4-1.2-3.2-1.1-9.9.4-12.6 3.8-.5 9 1.5 12.1 4.3 3.6-1.1 7.5-1.7 12.2-1.7 4.7 0 8.5.6 12 1.7 3-2.7 8.2-4.8 12-4.3 1.4 2.6 1.6 9.3.4 12.6 3.1 3.6 4.7 8.5 4.7 13.4 0 11.8-8.9 20.7-21.7 22.3 3.3 2.1 5.5 6.7 5.5 11.9v10c0 2.9 2.4 4.5 5.3 3.4C84.4 87.9 98 70.6 98 49.2 98 22.1 76 0 48.9 0z"
                        />
                    </svg>
                </FooterIcon>

                <a
                    href="https://github.com/telecasterer/ukspcal"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-gray-500 hover:underline dark:text-gray-400"
                >
                    View the source code on GitHub
                </a>
            </div>
        </div>
    </Footer>
</div>

<style>
    /* Make hash navigation land nicely below the header area */
    .prose :global(h3) {
        scroll-margin-top: 4rem;
    }
</style>
