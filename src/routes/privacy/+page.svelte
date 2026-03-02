<script lang="ts">
    import { Button } from "flowbite-svelte";
    import { ArrowLeftOutline, MoonOutline, SunOutline } from "flowbite-svelte-icons";
    import { goto } from "$app/navigation";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import TopBar from "$lib/components/TopBar.svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import privacyMarkdown from "./privacy.md?raw";
    import { renderMarkdown } from "$lib/markdown";

    let darkMode: boolean = readDarkModeFromStorage();
    const privacyHtml = renderMarkdown(privacyMarkdown);

    $: {
        if (typeof window !== "undefined") {
            persistDarkModeToStorage(darkMode);
            applyDarkModeClass(darkMode);
        }
    }
</script>

<svelte:head>
    <title>Privacy Policy - UK State Pension Calendar</title>
    <meta
        name="description"
        content="Privacy Policy for UK State Pension Age and Payments Calendar."
    />
    <meta property="og:title" content="Privacy Policy - UK State Pension Calendar" />
    <meta
        property="og:description"
        content="How UK State Pension Age and Payments Calendar handles your data."
    />
    <meta property="og:url" content="https://ukspcal.vercel.app/privacy" />
    <meta property="og:type" content="website" />
    <link rel="canonical" href="https://ukspcal.vercel.app/privacy" />
</svelte:head>

<div class="flex flex-col min-h-screen">
    <TopBar title="Privacy Policy">
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
        class="app-page-bg py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1"
    >
        <article
            class="card-surface w-full page-container-doc p-5 sm:p-6 space-y-5"
        >
            <header class="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-5">
                <p
                    class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                >
                    Data handling
                </p>
                <h1
                    class="mt-2 text-2xl min-[390px]:text-[1.75rem] sm:text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white"
                >
                    Privacy Policy
                </h1>
                <p class="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    How this app uses local storage, analytics, and exported data.
                </p>
            </header>
            <section
                class="doc-markdown policy-markdown prose prose-sm sm:prose-base prose-blue dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
            >
                {@html privacyHtml}
            </section>
        </article>
    </main>

    <AppFooter />
</div>
