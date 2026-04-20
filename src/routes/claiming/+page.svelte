<script lang="ts">
    import TopBar from "$lib/components/TopBar.svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import { Button } from "flowbite-svelte";
    import { ArrowLeftOutline, MoonOutline, SunOutline } from "flowbite-svelte-icons";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import claimingMarkdown from "./claiming.md?raw";
    import { renderMarkdown } from "$lib/markdown";
    import { daysUntilIso, isIsoDate } from "$lib/utils/isoDateHelpers";

    const spaDateIso = $derived.by(() => {
        const value = page.url.searchParams.get("spaDate") ?? "";
        return isIsoDate(value) ? value : "";
    });

    const showAsapWarning = $derived.by(() => {
        if (!spaDateIso) return false;
        const days = daysUntilIso(spaDateIso);
        return days >= 0 && days <= 92;
    });
    const claimingHtml = renderMarkdown(claimingMarkdown);

    let darkMode: boolean = $state(readDarkModeFromStorage());

    onMount(() => {
        applyDarkModeClass(darkMode);
    });

    $effect.pre(() => {
        if (typeof window !== "undefined") {
            persistDarkModeToStorage(darkMode);
            applyDarkModeClass(darkMode);
        }
    });
</script>

<div class="flex flex-col min-h-screen">
    <TopBar title="Claiming" showInAppBanner={false}>
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
        class="app-page-bg page-bottom-safe-area py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1"
    >
        <div class="page-container-doc w-full">
            <header class="mb-6 sm:mb-8 max-w-3xl">
                <h1
                    class="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3"
                >
                    State Pension Claim Guidance
                </h1>
                <p class="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2">
                    Claim links and key contact numbers for UK and non-UK residents.
                </p>
            </header>

            <div class="card-surface w-full p-5 sm:p-6 space-y-5">
                <section
                    class="doc-markdown policy-markdown prose prose-sm sm:prose-base prose-blue dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
                >
                    {@html claimingHtml}
                </section>

                <div
                    class="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30 space-y-2"
                >
                    <h2 class="text-lg font-semibold text-amber-900 dark:text-amber-200">
                        The 3-Month Deadline
                    </h2>
                    {#if showAsapWarning}
                        <p class="font-medium text-amber-900 dark:text-amber-200">
                            You are within 3 months of your State Pension age. If you have not yet
                            claimed or received an invitation letter, claim as soon as possible to
                            reduce the risk of a payment delay.
                        </p>
                    {:else}
                        <p>
                            If you are within 3 months of your State Pension age and have not yet
                            made a claim or received an invitation letter, call the relevant number
                            above as soon as possible. Waiting longer may lead to a delay in your
                            payments.
                        </p>
                    {/if}
                </div>
            </div>
        </div>
    </main>

    <AppFooter />
</div>

<svelte:head>
    <title>Claiming Your UK State Pension</title>
    <meta
        name="description"
        content="How to claim your UK State Pension, including UK and international claim routes and key phone numbers."
    />
    <meta
        property="og:description"
        content="How to claim your UK State Pension, including UK and international claim routes and key phone numbers."
    />
    <meta property="og:url" content="https://ukspcal.vercel.app/claiming" />
    <link rel="canonical" href="https://ukspcal.vercel.app/claiming" />
</svelte:head>
