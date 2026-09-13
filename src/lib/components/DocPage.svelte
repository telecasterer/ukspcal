<script lang="ts">
    // DocPage.svelte: shared layout for the markdown document pages (Help, Claiming, Privacy)
    import type { Snippet } from "svelte";
    import { onMount } from "svelte";
    import { Button } from "flowbite-svelte";
    import {
        ArrowLeftOutline,
        ArrowUpOutline,
        MoonOutline,
        SunOutline,
    } from "flowbite-svelte-icons";
    import { goto } from "$app/navigation";
    import TopBar from "$lib/components/TopBar.svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import { detectFacebookInAppBrowserFromWindow } from "$lib/utils/inAppBrowser";
    import { DOC_INSERT_MARKER, type MarkdownHeading } from "$lib/markdown";

    type Props = {
        /** Short title shown in the top bar. */
        barTitle: string;
        heading: string;
        intro: string;
        /** Rendered markdown. */
        html: string;
        /** When given, adds an "On this page" list and back-to-top buttons. */
        headings?: MarkdownHeading[];
        /** When given, adds a Share button for this page. */
        share?: { text: string; url?: string };
        /** Rendered where DOC_INSERT_MARKER appears in the markdown (or after it). */
        insert?: Snippet;
        /** Extra content shown after the markdown, inside the card. */
        children?: Snippet;
    };

    let {
        barTitle,
        heading,
        intro,
        html,
        headings = [],
        share,
        insert,
        children,
    }: Props = $props();

    const markerIndex = $derived(html.indexOf(DOC_INSERT_MARKER));
    const htmlBefore = $derived(markerIndex === -1 ? html : html.slice(0, markerIndex));
    const htmlAfter = $derived(
        markerIndex === -1 ? "" : html.slice(markerIndex + DOC_INSERT_MARKER.length)
    );

    let isFacebookInAppBrowser = $state(false);
    let darkMode = $state(readDarkModeFromStorage());

    onMount(() => {
        isFacebookInAppBrowser = detectFacebookInAppBrowserFromWindow();
    });

    $effect(() => {
        persistDarkModeToStorage(darkMode);
        applyDarkModeClass(darkMode);
    });

    // --- Back to top ---
    // The floating button shows once the contents list has scrolled away, and hides
    // again when the button at the end of the card is on screen (so it never covers
    // the footer).
    let pageHeading: HTMLElement | undefined = $state();
    let contentsNav: HTMLElement | undefined = $state();
    let endBackToTop: HTMLElement | undefined = $state();
    let contentsInView = $state(true);
    let endInView = $state(false);
    const showFloatingBackToTop = $derived(!contentsInView && !endInView);

    $effect(() => {
        if (!contentsNav || !endBackToTop || typeof IntersectionObserver === "undefined") {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === contentsNav) contentsInView = entry.isIntersecting;
                if (entry.target === endBackToTop) endInView = entry.isIntersecting;
            }
        });
        observer.observe(contentsNav);
        observer.observe(endBackToTop);
        return () => observer.disconnect();
    });

    function backToTop(): void {
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        pageHeading?.focus({ preventScroll: true });
    }
</script>

<div class="flex flex-col min-h-screen">
    <TopBar title={barTitle} showInAppBanner={isFacebookInAppBrowser}>
        <svelte:fragment slot="actions">
            <Button color="light" size="xs" class="toolbar-btn" onclick={() => goto("/")}>
                <span class="inline-flex items-center gap-1.5">
                    <ArrowLeftOutline class="h-4 w-4" ariaLabel="Back" />
                    <span>Back</span>
                </span>
            </Button>
            {#if share}
                <ShareButton
                    shareText={share.text}
                    shareUrl={share.url ?? null}
                    buttonLabel="Share this page"
                    size="xs"
                    buttonClass="toolbar-btn"
                />
            {/if}
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

    <main
        class="app-page-bg page-bottom-safe-area py-5 sm:py-8 px-3 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1"
    >
        <div class="page-container-doc w-full">
            <header class="mb-5 sm:mb-8 px-1 sm:px-0">
                <h1
                    bind:this={pageHeading}
                    tabindex="-1"
                    class="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2 sm:mb-3 focus:outline-none"
                >
                    {heading}
                </h1>
                <p class="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                    {intro}
                </p>
            </header>

            <article class="card-surface w-full px-4 py-5 sm:p-8">
                {#if headings.length > 0}
                    <nav
                        bind:this={contentsNav}
                        aria-labelledby="doc-contents-heading"
                        class="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700"
                    >
                        <h2
                            id="doc-contents-heading"
                            class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                        >
                            On this page
                        </h2>
                        <ul class="mt-1 grid sm:grid-cols-2 sm:gap-x-6">
                            {#each headings as item (item.id)}
                                <li>
                                    <a
                                        href="#{item.id}"
                                        class="-mx-2 block rounded-md px-2 py-2 text-sm sm:text-base font-medium text-blue-700 hover:bg-blue-50 hover:underline dark:text-blue-300 dark:hover:bg-gray-700/60"
                                    >
                                        {item.title}
                                    </a>
                                </li>
                            {/each}
                        </ul>
                    </nav>
                {/if}

                <div
                    class="doc-markdown prose prose-sm sm:prose-base prose-blue dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
                >
                    {@html htmlBefore}
                    {@render insert?.()}
                    {@html htmlAfter}
                </div>

                {@render children?.()}

                {#if headings.length > 0}
                    <div class="mt-6 flex justify-center">
                        <button
                            bind:this={endBackToTop}
                            type="button"
                            onclick={backToTop}
                            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 hover:underline dark:text-blue-300 dark:hover:bg-gray-700/60"
                        >
                            <ArrowUpOutline class="h-4 w-4" />
                            <span>Back to top</span>
                        </button>
                    </div>
                {/if}
            </article>
        </div>
    </main>

    <AppFooter />
</div>

{#if headings.length > 0}
    <button
        type="button"
        onclick={backToTop}
        hidden={!showFloatingBackToTop}
        class="print-hide fixed right-4 bottom-[calc(1rem+var(--safe-area-bottom))] z-40 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white/95 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg backdrop-blur hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800/95 dark:text-gray-200 dark:hover:bg-gray-700"
    >
        <ArrowUpOutline class="h-4 w-4" />
        <span>Back to top</span>
    </button>
{/if}
