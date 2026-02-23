<script lang="ts">
    import { Button } from "flowbite-svelte";
    import { goto } from "$app/navigation";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import TopBar from "$lib/components/TopBar.svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";

    let darkMode: boolean = readDarkModeFromStorage();

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
                onclick={() => {
                    goto("/");
                }}
            >
                <span class="inline-flex items-center gap-1.5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        class="h-4 w-4"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span>Back</span>
                </span>
            </Button>
            <Button
                color="light"
                size="xs"
                onclick={() => {
                    darkMode = !darkMode;
                }}
                title="Toggle dark mode"
                aria-label="Toggle dark mode"
            >
                {#if darkMode}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        class="h-4 w-4"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        class="h-4 w-4"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                {/if}
            </Button>
        </svelte:fragment>
    </TopBar>

    <main
        class="bg-gradient-to-b from-slate-50 via-blue-50/40 to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1"
    >
        <article
            class="w-full max-w-5xl mx-auto shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 sm:p-6 space-y-5"
        >
            <header>
                <h1 class="text-2xl min-[390px]:text-[1.75rem] sm:text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                    Privacy Policy
                </h1>
                <p class="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mt-2">
                    Last updated: February 22, 2026
                </p>
            </header>

            <section class="space-y-3 text-sm sm:text-base leading-relaxed text-gray-800 dark:text-gray-200">
                <p>
                    UK State Pension Calendar is designed to work
                    primarily on your device. This page explains what data is used
                    and why.
                </p>

                <h2 class="pt-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Data you enter in the app</h2>
                <p>
                    You may enter your NI code suffix and date of birth to generate
                    a pension schedule. This data is used locally in your browser on
                    your device to provide calculations and calendar outputs. This data is not
                    transferred to a server or shared in any way.
                </p>

                <h2 class="pt-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Local storage on your device</h2>
                <p>
                    The app stores settings and recent inputs in your browser local
                    storage so your preferences can be restored when you return.
                    You can clear this data at any time using the app&rsquo;s restore defaults
                    control or your browser/site settings.
                </p>

                <h2 class="pt-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Analytics and technical data</h2>
                <p>
                    The app uses anonymous analytics to aggregate usage
                    metrics and facilitate product improvement. These services may process
                    technical information such as pages viewed, device/browser
                    details, and interaction events. Your input data is not part this information.
                </p>
                <p>
                    The app does not require account registration, and we do not
                    collect or share your NI code or date of birth.
                </p>

                <h2 class="pt-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Holiday data providers</h2>
                <p>
                    To show bank holidays and optional country holiday overlays, the
                    app requests public holiday data from third-party APIs. Requests
                    may include country and year parameters needed for those results.
                </p>

                <h2 class="pt-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Exports and sharing</h2>
                <p>
                    If you choose CSV/ICS export, print, or share actions, the
                    generated content is created from your inputs and handled by your
                    device/browser or selected apps.
                </p>

                <h2 class="pt-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Changes to this policy</h2>
                <p>
                    This policy may be updated from time to time. Updates will be
                    posted on this page with a revised "Last updated" date.
                </p>

                <h2 class="pt-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Contact</h2>
                <p>
                    For privacy questions or requests, use the feedback form:
                    <a
                        href="https://tally.so/r/q4Vbq2"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="underline hover:no-underline"
                    >
                        Send feedback
                    </a>
                </p>
            </section>
        </article>
    </main>

    <AppFooter />
</div>
