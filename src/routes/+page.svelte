<script lang="ts">


    import {
        generatePayments,
        type Payment,
        type PensionResult,
    } from "$lib/pensionEngine";
    import { Card } from "flowbite-svelte";
    import SummaryCard from "$lib/components/SummaryCard.svelte";
    import PensionInputsCard from "$lib/components/PensionInputsCard.svelte";
    import CalendarView from "$lib/components/CalendarView.svelte";
    import type { DateFormat } from "$lib/utils/dateFormatting";
    import { detectFacebookInAppBrowser } from "$lib/utils/inAppBrowser";
    import {
        loadPersistedInputs,
        savePersistedInputs,
    } from "$lib/utils/inputPersistence";
    import { onMount } from "svelte";
    import {
        computeIsStandalone,
        getDisplayModeStandalone,
        getNavigatorStandalone,
        shouldShowIosInstallHelp,
        type BeforeInstallPromptEvent,
    } from "$lib/utils/pwaInstall";
    import "../styles/calendarPrint.css";

    const PERSIST_KEY = "ukspcal.inputs.v1";
    const ALLOWED_CYCLE_DAYS = new Set([7, 14, 28, 91]);
    const ALLOWED_DATE_FORMATS = new Set<DateFormat>([
        "dd/mm/yyyy",
        "dd-mmm-yyyy",
        "yyyy-mm-dd",
        "mm/dd/yyyy",
        "ddd, d mmmm yyyy",
    ]);

    // --- State variables (using Svelte runes mode) ---
    let ni: string = $state("");
    let startYear: number = $state(new Date().getFullYear());
    let endYear: number = $state(new Date().getFullYear() + 1);
    let cycleDays: number = $state<number>(28);
    let showWeekends: boolean = $state(true);
    let showBankHolidays: boolean = $state(true);
    let csvDateFormat: DateFormat = $state<DateFormat>("dd/mm/yyyy");
    let icsEventName: string = $state("UK State Pension Payment");
    let icsCategory: string = $state("Finance");
    let icsColor: string = $state("#22c55e");
    let dob: string = $state("");

    // --- Utility: Read dark mode preference from localStorage ---
    function readDarkModeFromStorage(): boolean {
        if (typeof window === "undefined") return false;
        try {
            return localStorage.getItem("darkMode") === "true";
        } catch {
            return false;
        }
    }

    let darkMode: boolean = $state(readDarkModeFromStorage());
    let hasLoadedPersistedInputs: boolean = $state(false);
    let hasUserCommittedInputs: boolean = $state(false);
    let isFacebookInAppBrowser: boolean = $state(false);
    let isStandalone: boolean = $state(false);
    let canInstallPwa: boolean = $state(false);
    let showInstallHelpModal: boolean = $state(false);
    let showIosInstallHelp: boolean = $state(false);
    let deferredInstallPrompt: BeforeInstallPromptEvent | null = $state(null);

    // --- Input persistence logic ---
    function persistInputs(): void {
        if (typeof window === "undefined") return;
        if (!hasLoadedPersistedInputs) return;
        hasUserCommittedInputs = true;
        const payload = {
            ni,
            dob,
            startYear: Number(startYear),
            endYear: Number(endYear),
            cycleDays: Number(cycleDays),
            showWeekends,
            showBankHolidays,
            csvDateFormat,
            icsEventName,
            icsCategory,
            icsColor,
        };
        // Ignore storage quota / private mode errors.
        savePersistedInputs(localStorage, PERSIST_KEY, payload);
    }

    onMount(() => {
        const ua = navigator.userAgent ?? "";
        isFacebookInAppBrowser = detectFacebookInAppBrowser({
            userAgent: ua,
            href: window.location.href,
        });

        const mq =
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function"
                ? window.matchMedia("(display-mode: standalone)")
                : null;

        const computeStandalone = () => {
            isStandalone = computeIsStandalone({
                userAgent: ua,
                displayModeStandalone: getDisplayModeStandalone(mq),
                navigatorStandalone: getNavigatorStandalone(navigator),
            });
        };

        computeStandalone();
        const onMqChange = () => computeStandalone();
        mq?.addEventListener?.("change", onMqChange);

        const onBeforeInstallPrompt = (e: Event) => {
            // Only relevant in browsers that support install prompts.
            e.preventDefault?.();
            deferredInstallPrompt = e as BeforeInstallPromptEvent;
            canInstallPwa = true;
        };

        const onAppInstalled = () => {
            deferredInstallPrompt = null;
            canInstallPwa = false;
            computeStandalone();
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onAppInstalled);

        // On iOS there's no `beforeinstallprompt`. Offer help instead.
        showIosInstallHelp = shouldShowIosInstallHelp({
            userAgent: ua,
            isStandalone,
        });

        try {
            const persisted = loadPersistedInputs(localStorage, PERSIST_KEY, {
                allowedCycleDays: ALLOWED_CYCLE_DAYS,
                allowedDateFormats: ALLOWED_DATE_FORMATS,
            });

            if (persisted.ni !== undefined) ni = persisted.ni;
            if (persisted.dob !== undefined) dob = persisted.dob;
            if (persisted.startYear !== undefined)
                startYear = persisted.startYear;
            if (persisted.endYear !== undefined) {
                endYear = Number(persisted.endYear);
            } else if (typeof lastBankHolidayYear === 'number' && Number(endYear) < lastBankHolidayYear) {
                endYear = lastBankHolidayYear;
            }
            if (persisted.cycleDays !== undefined)
                cycleDays = persisted.cycleDays;
            if (persisted.showWeekends !== undefined)
                showWeekends = persisted.showWeekends;
            if (persisted.showBankHolidays !== undefined)
                showBankHolidays = persisted.showBankHolidays;
            if (persisted.csvDateFormat !== undefined)
                csvDateFormat = persisted.csvDateFormat;
            if (persisted.icsEventName !== undefined)
                icsEventName = persisted.icsEventName;
            if (persisted.icsCategory !== undefined)
                icsCategory = persisted.icsCategory;
            if (persisted.icsColor !== undefined) icsColor = persisted.icsColor;
        } catch {
            // Ignore invalid/corrupt stored values.
            if (typeof lastBankHolidayYear === 'number' && Number(endYear) < lastBankHolidayYear) {
                endYear = lastBankHolidayYear;
            }
        } finally {
            hasLoadedPersistedInputs = true;
        }

        return () => {
            mq?.removeEventListener?.("change", onMqChange);
            window.removeEventListener(
                "beforeinstallprompt",
                onBeforeInstallPrompt,
            );
            window.removeEventListener("appinstalled", onAppInstalled);
        };
    });

    let { data } = $props();
    let bankHolidays = $derived(data.bankHolidays);

    // Reactively compute the latest bank holiday date and year (runes mode)
    let lastBankHolidayIso = $derived.by(() => {
        const hols = bankHolidays;
        const keys = Object.keys(hols);
        return keys.sort().pop();
    });
    let lastBankHolidayYear = $derived.by(() => {
        const iso = lastBankHolidayIso;
        return iso ? Number(iso.slice(0, 4)) : null;
    });

    let result: PensionResult | null = $state(null);
    let error = $state("");

    let currentCalendarMonth = $state(new Date().getMonth());
    let currentCalendarYear = $state(new Date().getFullYear());

    let pendingCalendarFocusIso = $state<string | null>(null);

    let minPaymentIso = $state<string | null>(null);
    let lastFirstPaymentAfterSpaKey = $state<string | null>(null);

    // Dark mode effect
    $effect.pre(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("darkMode", darkMode.toString());
            } catch {
                // Ignore storage quota / private mode errors.
            }
            if (darkMode) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        }
    });

    // Note: persistence is intentionally triggered only on commit/blur/change
    // from input components (see `persistInputs()`), to avoid per-keystroke writes.

    // Generate pension schedule
    function generate() {
        error = "";

        if (!/^\d{2}[A-D]$/i.test(ni)) {
            error =
                "NI code (last 3 characters of your NI number) must be 2 digits followed by A–D (e.g. 22D)";
            result = null;
            return;
        }

        if (endYear < startYear) {
            error = "End year must be after start year";
            result = null;
            return;
        }

        const generated = generatePayments(
            ni,
            startYear,
            endYear,
            cycleDays,
            bankHolidays,
        );

        const minIso = minPaymentIso;

        const filteredPayments = minIso
            ? generated.payments.filter((p) => p.paid >= minIso)
            : generated.payments;

        result = { ...generated, payments: filteredPayments };

        // Reset calendar to a requested focus date (if set), otherwise first payment.
        if (result && result.payments.length > 0) {
            const focusIso = pendingCalendarFocusIso ?? result.payments[0].paid;
            const focusDate = new Date(focusIso + "T00:00:00Z");
            currentCalendarMonth = focusDate.getUTCMonth();
            currentCalendarYear = focusDate.getUTCFullYear();
        }

        pendingCalendarFocusIso = null;
    }

    function handleFirstPaymentAfterSpa(payment: Payment | null) {
        if (!payment) {
            minPaymentIso = null;
            lastFirstPaymentAfterSpaKey = null;
            return;
        }

        const key = `${payment.due}|${payment.paid}`;
        if (key === lastFirstPaymentAfterSpaKey) return;
        lastFirstPaymentAfterSpaKey = key;

        // Auto-start calendar from the first payment after SPA (use paid date so early payments still show).
        minPaymentIso = payment.paid;

        const start = Math.min(isoYear(payment.due), isoYear(payment.paid));
        startYear = start;
        if (endYear < startYear + 1) endYear = startYear + 1;

        pendingCalendarFocusIso = payment.paid;
        generate();

        // This handler runs as a consequence of user commits (NI/DOB/cycle changes).
        // Persist the auto-adjusted year range so the UI comes back the same next time.
        if (hasUserCommittedInputs) persistInputs();
    }

    function isoYear(iso: string): number {
        return Number(iso.slice(0, 4));
    }

    async function handleInstallClick() {
        if (isFacebookInAppBrowser) return;
        if (isStandalone) return;

        if (canInstallPwa && deferredInstallPrompt) {
            await deferredInstallPrompt.prompt();
            // Clear prompt either way; browser usually only allows it once.
            try {
                await deferredInstallPrompt.userChoice;
            } catch {
                // Ignore
            }
            deferredInstallPrompt = null;
            canInstallPwa = false;
            return;
        }

        if (showIosInstallHelp) {
            showInstallHelpModal = true;
        }
    }
</script>

<!-- --- Navigation Bar --- -->
<nav
    class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
>
    {#if isFacebookInAppBrowser}
        <!-- Info banner for in-app browser users -->
        <div
            class="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900"
        >
            <div class="max-w-7xl mx-auto px-4 py-1">
                <p
                    class="text-xs text-amber-800 dark:text-amber-200 leading-snug"
                >
                    <span class="sm:hidden"
                        >Tip: works best in Safari/Chrome/Edge (use “Open in
                        browser”).</span
                    >
                    <span class="hidden sm:inline"
                        >Tip: this app works best in Safari/Chrome/Edge (use
                        “Open in browser”).</span
                    >
                </p>
            </div>
        </div>
    {/if}
    <div class="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-2">
            <img src="/favicon.svg" alt="App icon" class="w-7 h-7" style="margin-bottom:2px;" />
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">Pension Calendar</span>
        </div>
        <div class="flex items-center gap-2">
            <a
                href="/help"
                class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
                Help
            </a>
            {#if !isFacebookInAppBrowser && !isStandalone && (canInstallPwa || showIosInstallHelp)}
                <!-- Install button for PWA or iOS help -->
                <button
                    onclick={handleInstallClick}
                    class="px-3 py-1 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition"
                    title="Install app"
                    aria-label="Install app"
                >
                    Install
                </button>
            {/if}
            <!-- Dark mode toggle button -->
            <button
                onclick={() => {
                    darkMode = !darkMode;
                }}
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

{#if showInstallHelpModal}
    <!-- Modal for iOS install help -->
    <div class="fixed inset-0 z-[60]">
        <button
            type="button"
            class="absolute inset-0 bg-black/40"
            onclick={() => (showInstallHelpModal = false)}
            aria-label="Close install help"
        ></button>
        <div
            class="relative mx-auto mt-24 w-[92%] max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl"
        >
            <div class="p-4">
                <div class="flex items-start justify-between gap-3">
                    <h2
                        class="text-base font-semibold text-gray-900 dark:text-white"
                    >
                        Install on iPhone/iPad
                    </h2>
                    <button
                        onclick={() => (showInstallHelpModal = false)}
                        class="px-2 py-1 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <p
                    class="mt-2 text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
                >
                    In Safari, tap the Share button, then choose <span
                        class="font-semibold">Add to Home Screen</span
                    >.
                </p>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    If you’re viewing inside an in-app browser, use “Open in
                    browser” first.
                </p>
            </div>
        </div>
    </div>
{/if}

<!-- --- Main Content --- -->
<div
    class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100"
>
    <div class="max-w-7xl mx-auto">
        <!-- Header section -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                UK State Pension Payment Calendar
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-300">
                Calculate your pension payment schedule based on your NI code
            </p>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Privacy: this app does not save or share any personal data to a server.
            </p>
        </div>

        <!-- Inputs + Summary (single cohesive card) -->
        <Card
            size="xl"
            class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8 input-section"
        >
            <div
                class="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700"
            >
                <!-- Pension input form -->
                <div class="lg:col-span-8">
                    <PensionInputsCard
                        bind:ni
                        bind:dob
                        bind:startYear
                        bind:endYear
                        bind:cycleDays
                        bind:error
                        {bankHolidays}
                        onFirstPaymentAfterSpa={handleFirstPaymentAfterSpa}
                        onPersist={persistInputs}
                        onRecalculate={generate}
                    />
                </div>

                <!-- Summary card -->
                <div class="lg:col-span-4">
                    {#if result}
                        <SummaryCard {result} embedded />
                    {:else}
                        <div class="p-6">
                            <div class="mb-2">
                                <h2
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Schedule summary
                                </h2>
                                <p
                                    class="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    Generate a schedule to see a summary here.
                                </p>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </Card>

        <!-- Results Section: Calendar and payments -->
        {#if result}
            {#key `${result.ni}:${startYear}:${endYear}:${cycleDays}`}
                <div class="w-full space-y-6 max-w-7xl mx-auto">
                    <Card
                        size="xl"
                        class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 calendar-print-wrapper"
                    >
                        <CalendarView
                            {result}
                            payments={result.payments}
                            {bankHolidays}
                            bind:showWeekends
                            bind:showBankHolidays
                            bind:currentMonth={currentCalendarMonth}
                            bind:currentYear={currentCalendarYear}
                            bind:csvDateFormat
                            bind:icsEventName
                            bind:icsCategory
                            bind:icsColor
                            onPersist={persistInputs}
                        />
                    </Card>
                </div>
            {/key}
        {/if}
    </div>
</div>
