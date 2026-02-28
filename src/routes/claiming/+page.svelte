<script lang="ts">
    import TopBar from "$lib/components/TopBar.svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import { Button } from "flowbite-svelte";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    function isIsoDate(value: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    function daysUntilIso(iso: string): number {
        const now = new Date();
        const todayUtc = Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        );
        const target = new Date(iso + "T00:00:00Z");
        const targetUtc = Date.UTC(
            target.getUTCFullYear(),
            target.getUTCMonth(),
            target.getUTCDate()
        );
        return Math.ceil((targetUtc - todayUtc) / 86400000);
    }

    const spaDateIso = $derived.by(() => {
        const value = page.url.searchParams.get("spaDate") ?? "";
        return isIsoDate(value) ? value : "";
    });

    const showAsapWarning = $derived.by(() => {
        if (!spaDateIso) return false;
        const days = daysUntilIso(spaDateIso);
        return days >= 0 && days <= 92;
    });

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
        <div class="max-w-3xl mx-auto">
            <div
                class="w-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 sm:p-6 space-y-5"
            >
                <h1
                    class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                >
                    Claiming your State Pension
                </h1>

                <p>
                    You will not receive your State Pension automatically; you
                    must claim it. You can start your claim as soon as you are
                    within 4 months of your State Pension age.
                </p>

                <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/30 space-y-2">
                    <p>
                        Start with the official service:
                        <a
                            class="underline hover:no-underline"
                            href="https://www.gov.uk/get-state-pension"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GOV.UK: Get your State Pension
                        </a>
                    </p>
                    <p>
                        If you were sent an invitation letter, keep your claim
                        code ready. If you are within 3 months of State Pension
                        age and do not have a code, GOV.UK explains how to request one.
                    </p>
                </div>

                <div class="space-y-2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                        If you live in the UK
                    </h2>
                    <p>
                        <span class="font-medium">Invitation letter:</span> You
                        should usually receive a letter with a claim code around
                        4 months before pension age.
                    </p>
                    <p>
                        <span class="font-medium">Claim online:</span> GOV.UK
                        offers online, phone, and post claims. If you have your
                        invitation code, online is a straightforward route to apply.
                    </p>
                    <p>
                        <span class="font-medium">Claim by phone:</span> The Pension Service (DWP).
                    </p>
                    <div class="space-y-1 text-sm sm:text-base">
                        <p>
                            <span class="font-medium">Call:</span>
                            <a
                                class="ml-1 inline-block whitespace-nowrap rounded border border-gray-300 dark:border-gray-600 px-2 py-0.5 font-mono underline hover:no-underline"
                                href="tel:08007317898"
                            >
                                0800 731 7898
                            </a>
                        </p>
                        <p>
                            <span class="font-medium">Welsh language:</span>
                            <a
                                class="ml-1 inline-block whitespace-nowrap rounded border border-gray-300 dark:border-gray-600 px-2 py-0.5 font-mono underline hover:no-underline"
                                href="tel:08007317936"
                            >
                                0800 731 7936
                            </a>
                        </p>
                    </div>
                </div>

                <div class="space-y-2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                        If you live abroad (Non-UK residents)
                    </h2>
                    <p>
                        <span class="font-medium">Do not wait for a code:</span>
                        Many people abroad do not receive an invitation letter.
                        You do not need one to start your claim.
                    </p>
                    <p>
                        <span class="font-medium">Local route:</span> Official
                        guidance may direct you to claim through the pension
                        authority in your country of residence. This can take
                        longer in some cases.
                    </p>
                    <p>
                        <span class="font-medium">Claim by phone:</span> International Pension Centre (DWP).
                    </p>
                    <p class="text-sm sm:text-base">
                        <span class="font-medium">Call:</span>
                        <a
                            class="ml-1 inline-block whitespace-nowrap rounded border border-gray-300 dark:border-gray-600 px-2 py-0.5 font-mono underline hover:no-underline"
                            href="tel:+441912187777"
                        >
                            +44 191 218 7777
                        </a>
                    </p>
                    <p>
                        <span class="font-medium">Official abroad claim guidance:</span>
                        <a
                            class="underline hover:no-underline"
                            href="https://www.gov.uk/state-pension-if-you-retire-abroad/how-to-claim"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GOV.UK: Claim if you retire abroad
                        </a>.
                    </p>
                    <p>
                        <span class="font-medium">Tip:</span> Ask the agent for
                        a callback to reduce international phone charges.
                    </p>
                    <p>
                        <span class="font-medium">Planning ahead (more than 4 months away):</span>
                        Future Pension Centre (DWP).
                    </p>
                    <p class="text-sm sm:text-base">
                        <span class="font-medium">Call:</span>
                        <a
                            class="ml-1 inline-block whitespace-nowrap rounded border border-gray-300 dark:border-gray-600 px-2 py-0.5 font-mono underline hover:no-underline"
                            href="tel:+441912183600"
                        >
                            +44 191 218 3600
                        </a>
                    </p>
                </div>

                <div class="space-y-2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                        What to have ready
                    </h2>
                    <ul class="list-disc pl-5 space-y-1">
                        <li>Your National Insurance number</li>
                        <li>Your bank or building society account details</li>
                        <li>Your marriage or civil partnership details (if relevant)</li>
                        <li>Dates you lived or worked abroad, if relevant</li>
                        <li>Your invitation/claim code, if you have one</li>
                    </ul>
                </div>

                <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30 space-y-2">
                    <h2 class="text-lg font-semibold text-amber-900 dark:text-amber-200">
                        ⚠️ The 3-Month Deadline
                    </h2>
                    {#if showAsapWarning}
                        <p class="font-medium text-amber-900 dark:text-amber-200">
                            You are within 3 months of your State Pension age.
                            If you have not yet claimed or received an
                            invitation letter, claim as soon as possible to
                            reduce the risk of a payment gap.
                        </p>
                    {:else}
                        <p>
                            If you are within 3 months of your State Pension
                            age and have not yet made a claim or received an
                            invitation letter, call the relevant number above
                            as soon as possible. Waiting longer may lead to a gap in
                            your payments.
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
