<script lang="ts">
    import {
        generatePayments,
        type Payment,
        type PensionResult,
    } from "$lib/pensionEngine";
    import { Button, Card } from "flowbite-svelte";
    import SummaryCard from "$lib/components/SummaryCard.svelte";
    import PensionInputsCard from "$lib/components/PensionInputsCard.svelte";
    import CalendarView from "$lib/components/CalendarView.svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import type { DateFormat } from "$lib/utils/dateFormatting";
    import { detectFacebookInAppBrowserFromWindow } from "$lib/utils/inAppBrowser";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import {
        loadPersistedInputs,
        savePersistedInputs,
    } from "$lib/utils/inputPersistence";
    import { calculateStatePensionAge } from "$lib/utils/statePensionAge";
    import { onMount } from "svelte";
    import { clearAllAppStorage } from "$lib/utils/clearAllAppStorage";

    import { goto } from "$app/navigation";
    import {
        loadHolidaysFromCache,
        saveHolidaysToCache,
    } from "$lib/utils/holidayCache";
    import { detectCountryFromTimezone } from "$lib/utils/timezoneDetection";
    import { capturePosthog } from "$lib/utils/posthog";

    // Reset all fields and clear all saved values
    function handleResetAll() {
        clearAllAppStorage();
        // Reset all state variables to defaults
        ni = "";
        dob = "";
        startYear = new Date().getFullYear();
        numberOfYears = 5;
        cycleDays = 28;
        showBankHolidays = true;
        csvDateFormat = "dd/mm/yyyy";
        icsEventName = "UK State Pension Payment";
        icsCategory = "Finance";
        icsColor = "#22c55e";
        additionalHolidays = {};
        isLoadingAdditionalHolidays = false;
        additionalHolidaysError = "";
        // Optionally reset dark mode
        // darkMode = false;
        result = null;
        error = "";
        hasUserCommittedInputs = false;
        hasLoadedPersistedInputs = true;
    }
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
    let numberOfYears: number = $state(5);
    let cycleDays: number = $state<number>(28);
    let showBankHolidays: boolean = $state(true);
    let csvDateFormat: DateFormat = $state<DateFormat>("dd/mm/yyyy");
    let icsEventName: string = $state("UK State Pension Payment");
    let icsCategory: string = $state("Finance");
    let icsColor: string = $state("#22c55e");
    let dob: string = $state("");
    let detectedCountry: string = detectCountryFromTimezone();
    let ukRegion: string = $state("GB-ENG+GB-WLS"); // England & Wales default (combined)
    let selectedCountry: string = $state("none");
    let additionalHolidays: Record<string, string> = $state({});
    let isLoadingAdditionalHolidays: boolean = $state(false);
    let additionalHolidaysError: string = $state("");
    let lastAdditionalHolidaysKey: string = $state("");
    let ukHolidaysRequestSeq = 0;
    let additionalHolidaysRequestSeq = 0;


    const currentYear: number = new Date().getFullYear();
    const years: number[] = Array.from(
        { length: 50 },
        (_, i) => currentYear - 15 + i
    );

    let startYearSelect: string = $state("");
    let numberOfYearsInput: string = $state("");

    // --- Initialize result early for use in deriveds ---
    let result: PensionResult | null = $state(null);

    // --- Derived SPA date ---
    const spaDateIso = $derived.by(() => {
        if (!dob) return "";
        try {
            const spa = calculateStatePensionAge(dob);
            return spa?.spaDate ?? "";
        } catch {
            return "";
        }
    });

    const hasPassedSpa = $derived.by(() => {
        if (!spaDateIso) return false;
        const todayIso = new Date().toISOString().slice(0, 10);
        return todayIso >= spaDateIso;
    });

    // --- Derived first payment date after SPA ---
    const firstPaymentDateFormatted = $derived.by(() => {
        if (!result || result.payments.length === 0) return "";
        try {
            const d = new Date(result.payments[0].paid + "T00:00:00Z");
            return d.toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "";
        }
    });

    const nextPaymentDateFormatted = $derived.by(() => {
        if (!result || result.payments.length === 0 || !hasPassedSpa) return "";
        const todayIso = new Date().toISOString().slice(0, 10);
        const nextPayment = result.payments.find(
            (payment) => payment.paid >= todayIso
        );
        if (!nextPayment) return "";
        try {
            const d = new Date(nextPayment.paid + "T00:00:00Z");
            return d.toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "";
        }
    });

    let darkMode: boolean = $state(readDarkModeFromStorage());
    let hasLoadedPersistedInputs: boolean = $state(false);
    let hasUserCommittedInputs: boolean = $state(false);
    let isFacebookInAppBrowser: boolean = $state(false);
    let isStandalone: boolean = $state(false);
    let canInstallPwa: boolean = $state(false);
    let showInstallHelpModal: boolean = $state(false);
    let showIosInstallHelp: boolean = $state(false);
    let deferredInstallPrompt: BeforeInstallPromptEvent | null = $state(null);
    let hasCapturedInstallAccepted: boolean = $state(false);

    function captureInstallAcceptedOnce() {
        if (hasCapturedInstallAccepted) return;
        hasCapturedInstallAccepted = true;
        capturePosthog("install_prompt_accepted");
    }

    // --- Input persistence logic ---
    function persistInputs(): void {
        if (typeof window === "undefined") return;
        if (!hasLoadedPersistedInputs) return;
        hasUserCommittedInputs = true;
        const payload = {
            ni,
            dob,
            startYear: Number(startYear),
            numberOfYears: Number(numberOfYears),
            cycleDays: Number(cycleDays),
            showBankHolidays,
            csvDateFormat,
            icsEventName,
            icsCategory,
            icsColor,
            selectedCountry,
        };
        // Ignore storage quota / private mode errors.
        savePersistedInputs(localStorage, PERSIST_KEY, payload);
    }

    onMount(() => {
        const ua = navigator.userAgent ?? "";
        isFacebookInAppBrowser = detectFacebookInAppBrowserFromWindow();

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
            hasCapturedInstallAccepted = false;
            capturePosthog("install_prompt_shown");
        };

        const onAppInstalled = () => {
            deferredInstallPrompt = null;
            canInstallPwa = false;
            computeStandalone();
            captureInstallAcceptedOnce();
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onAppInstalled);

        // On iOS there's no `beforeinstallprompt`. Offer help instead.
        showIosInstallHelp = shouldShowIosInstallHelp({
            userAgent: ua,
            isStandalone,
        });

        try {
            // Migration: remove legacy `ukRegion` from persisted inputs so
            // it cannot override the default England & Wales canonical region.
            try {
                const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PERSIST_KEY) : null;
                const migrationFlagKey = 'ukspcal.region_migration.v1';

                // Run one-time migration unconditionally (if not already run):
                // clear per-region holiday caches and show a one-time notice.
                try {
                    const migrated = typeof localStorage !== 'undefined' ? localStorage.getItem(migrationFlagKey) : null;
                    if (!migrated && typeof localStorage !== 'undefined') {
                        localStorage.removeItem('holiday_cache_GB-SCT');
                        localStorage.removeItem('holiday_cache_GB-NIR');
                        localStorage.setItem(migrationFlagKey, '1');
                    }
                } catch {
                    // ignore cache clear errors
                }

                // If there are persisted inputs, remove legacy `ukRegion` key.
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw) as Record<string, unknown> | null;
                        if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'ukRegion')) {
                            delete parsed.ukRegion;
                            // write back the cleaned payload
                            savePersistedInputs(localStorage, PERSIST_KEY, parsed);
                        }
                    } catch {
                        // ignore malformed JSON; loadPersistedInputs will handle gracefully
                    }
                }
            } catch {
                // ignore storage access errors
            }
            const persisted = loadPersistedInputs(localStorage, PERSIST_KEY, {
                allowedCycleDays: ALLOWED_CYCLE_DAYS,
                allowedDateFormats: ALLOWED_DATE_FORMATS,
            });

            if (persisted.ni !== undefined) ni = persisted.ni;
            if (persisted.dob !== undefined) dob = persisted.dob;
            if (persisted.startYear !== undefined)
                startYear = persisted.startYear;
            if (persisted.numberOfYears !== undefined) {
                numberOfYears = Number(persisted.numberOfYears);
            }
            if (persisted.cycleDays !== undefined)
                cycleDays = persisted.cycleDays;
            if (persisted.showBankHolidays !== undefined)
                showBankHolidays = persisted.showBankHolidays;
            if (persisted.csvDateFormat !== undefined)
                csvDateFormat = persisted.csvDateFormat;
            if (persisted.icsEventName !== undefined)
                icsEventName = persisted.icsEventName;
            if (persisted.icsCategory !== undefined)
                icsCategory = persisted.icsCategory;
            if (persisted.icsColor !== undefined) icsColor = persisted.icsColor;
            if (persisted.selectedCountry !== undefined)
                selectedCountry = persisted.selectedCountry;
        } catch {
            // Ignore invalid/corrupt stored values.
        } finally {
            hasLoadedPersistedInputs = true;
        }

        return () => {
            mq?.removeEventListener?.("change", onMqChange);
            window.removeEventListener(
                "beforeinstallprompt",
                onBeforeInstallPrompt
            );
            window.removeEventListener("appinstalled", onAppInstalled);
        };
    });

    // Share handled by ShareButton component

    import { fetchHolidaysForCountryAndYears } from "$lib/services/nagerHolidayService";

    type PageProps = {
        bankHolidays?: Record<string, string>;
    };
    const { bankHolidays: initialBankHolidays = {} }: PageProps = $props();
    let bankHolidays: Record<string, string> = $state({});

    $effect.pre(() => {
        bankHolidays = initialBankHolidays;
    });

    // Fetch UK holidays for the selected region and year range
    $effect.pre(() => {
        if (!ukRegion || !hasLoadedPersistedInputs) return;
        const years = Array.from({ length: numberOfYears }, (_, i) => startYear + i);
        const requestId = ++ukHolidaysRequestSeq;
        (async () => {
            // Always use countryCode GB for UK, and pass region code for filtering
            const holidays = await fetchHolidaysForCountryAndYears("GB", years, ukRegion);
            if (requestId !== ukHolidaysRequestSeq) return;
            bankHolidays = holidays;
        })();
    });

    // Note: `ukRegion` is intentionally NOT persisted or restored.
    // The app defaults to England & Wales (`GB-ENG+GB-WLS`) for all
    // payment/early-payment calculations regardless of any prior
    // saved value.

    let error = $state("");

    let currentCalendarMonth = $state(new Date().getMonth());
    let currentCalendarYear = $state(new Date().getFullYear());

    let pendingCalendarFocusIso = $state<string | null>(null);

    let minPaymentIso = $state<string | null>(null);
    let lastFirstPaymentAfterSpaKey = $state<string | null>(null);

    $effect.pre(() => {
        startYearSelect = String(startYear);
        numberOfYearsInput = String(numberOfYears);
    });

    function applyStartYear() {
        const n = Number.parseInt(startYearSelect, 10);
        if (Number.isFinite(n)) {
            startYear = n;
            persistInputs();
            generate("range_start_year");
        }
    }

    function applyNumberOfYears() {
        const n = Number.parseInt(numberOfYearsInput, 10);
        if (Number.isFinite(n) && n > 0 && n <= 50) {
            numberOfYears = n;
            persistInputs();
            generate("range_duration");
        }
    }

    function extendNumberOfYearsByOne(): boolean {
        if (numberOfYears >= 50) return false;
        pendingCalendarFocusIso = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, "0")}-01`;
        numberOfYears += 1;
        numberOfYearsInput = String(numberOfYears);
        persistInputs();
        generate("range_extend_one_year");
        return true;
    }

    /**
     * Handle country selection change
     */
    async function handleCountryChange(country: string) {
        selectedCountry = country;
        persistInputs();
        additionalHolidaysError = "";

        if (country === "none") {
            additionalHolidaysRequestSeq += 1;
            isLoadingAdditionalHolidays = false;
            additionalHolidays = {};
            return;
        }
        const requestId = ++additionalHolidaysRequestSeq;

        // For regional UK overlays (GB-SCT, GB-NIR) use countryCode "GB"
        // and pass the region code to the holiday service. Keep the cache
        // key as the selected value (e.g., "GB-SCT") so overlays are cached
        // separately.
        const isGbRegion = typeof country === "string" && country.startsWith("GB-");
        const cacheKey = country;

        // Try to load from cache first
        let cached = loadHolidaysFromCache(cacheKey);
        // If a cache entry exists but its `data` is empty (e.g. stale or malformed
        // save), invalidate it so we fetch fresh data. This addresses cases where
        // localStorage contains a years list but no holiday keys.
        try {
            if (cached && Object.keys(cached.data || {}).length === 0) {
                if (typeof window !== 'undefined') localStorage.removeItem(`holiday_cache_${cacheKey}`);
                cached = null;
            }
        } catch {
            // ignore inspection errors
        }

        const yearsToFetch = Array.from(
            { length: numberOfYears },
            (_, i) => startYear + i
        );

        // If cache covers all needed years, use it
        if (cached && yearsToFetch.every((y) => cached.years.includes(y))) {
            if (requestId !== additionalHolidaysRequestSeq) return;
            isLoadingAdditionalHolidays = false;
            additionalHolidays = cached.data;
            return;
        }

        // Fetch from API (only missing years if cache exists)
        isLoadingAdditionalHolidays = true;
        const missingYears = cached
            ? yearsToFetch.filter((y) => !cached.years.includes(y))
            : yearsToFetch;
        try {
            let holidays: Record<string, string> = {};
            if (isGbRegion) {
                // country is like "GB-SCT"; fetch with countryCode "GB" and region
                const regionCode = country; // e.g., "GB-SCT"
                holidays = await fetchHolidaysForCountryAndYears(
                    "GB",
                    missingYears,
                    regionCode
                );
                // fetched GB region holidays
            } else {
                holidays = await fetchHolidaysForCountryAndYears(
                    country,
                    missingYears
                );
                // fetched country holidays
            }
            const merged = cached ? { ...cached.data, ...holidays } : holidays;
            const mergedYears = cached
                ? [...new Set([...cached.years, ...missingYears])]
                : yearsToFetch;

            if (requestId !== additionalHolidaysRequestSeq) return;
            additionalHolidays = merged;
            saveHolidaysToCache(cacheKey, merged, mergedYears);
        } catch (error) {
            if (requestId !== additionalHolidaysRequestSeq) return;
            console.error(`Error fetching holidays for ${country}:`, error);
            additionalHolidays = {};
            additionalHolidaysError =
                "Couldn't load additional holidays right now. Try again.";
        } finally {
            if (requestId !== additionalHolidaysRequestSeq) return;
            isLoadingAdditionalHolidays = false;
        }
    }

    // Fetch holidays when app loads or when year range changes with a selected country
    $effect.pre(() => {
        if (!hasLoadedPersistedInputs) return;
        if (selectedCountry === "none") {
            additionalHolidaysRequestSeq += 1;
            isLoadingAdditionalHolidays = false;
            additionalHolidays = {};
            additionalHolidaysError = "";
            lastAdditionalHolidaysKey = "";
            return;
        }

        const key = `${selectedCountry}:${startYear}:${numberOfYears}`;
        if (key === lastAdditionalHolidaysKey) return;
        lastAdditionalHolidaysKey = key;
        handleCountryChange(selectedCountry);
    });

    // Dark mode effect
    $effect.pre(() => {
        if (typeof window !== "undefined") {
            persistDarkModeToStorage(darkMode);
            applyDarkModeClass(darkMode);
        }
    });

    // Note: persistence is intentionally triggered only on commit/blur/change
    // from input components (see `persistInputs()`), to avoid per-keystroke writes.

    // Generate pension schedule
    function generate(source: string = "auto") {
        error = "";

        if (!/^\d{2}[A-D]$/i.test(ni)) {
            error =
                "NI code (last 3 characters of your NI number) must be 2 digits followed by A–D (e.g. 22D)";
            result = null;
            capturePosthog("schedule_generate_validation_failed", {
                source,
                reason: "invalid_ni",
            });
            return;
        }

        const endYear = startYear + numberOfYears - 1;
        const generated = generatePayments(
            ni,
            startYear,
            endYear,
            cycleDays,
            bankHolidays
        );

        const minIso = minPaymentIso;

        const filteredPayments = minIso
            ? generated.payments.filter((p) => p.paid >= minIso)
            : generated.payments;

        result = { ...generated, payments: filteredPayments };
        capturePosthog("schedule_generated", {
            source,
            cycle_days: cycleDays,
            start_year: startYear,
            number_of_years: numberOfYears,
            payments_count: result.payments.length,
        });

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

        pendingCalendarFocusIso = payment.paid;
        generate("spa_auto_focus");

        // This handler runs as a consequence of user commits (NI/DOB/cycle changes).
        // Persist the auto-adjusted year range so the UI comes back the same next time.
        if (hasUserCommittedInputs) persistInputs();
    }

    function isoYear(iso: string): number {
        return Number(iso.slice(0, 4));
    }

    async function handleInstallClick() {
        capturePosthog("install_click", {
            can_install_pwa: canInstallPwa,
            show_ios_help: showIosInstallHelp,
            is_standalone: isStandalone,
            in_app_browser: isFacebookInAppBrowser,
        });
        if (isFacebookInAppBrowser) return;
        if (isStandalone) return;

        if (canInstallPwa && deferredInstallPrompt) {
            await deferredInstallPrompt.prompt();
            // Clear prompt either way; browser usually only allows it once.
            try {
                const choice = await deferredInstallPrompt.userChoice;
                if (choice.outcome === "accepted") {
                    captureInstallAcceptedOnce();
                } else {
                    capturePosthog("install_prompt_dismissed");
                }
            } catch {
                // Ignore
            }
            deferredInstallPrompt = null;
            canInstallPwa = false;
            return;
        }

        if (showIosInstallHelp) {
            showInstallHelpModal = true;
            capturePosthog("install_help_opened");
        }
    }

    function handleHelpClick() {
        capturePosthog("help_opened");
        goto("/help");
    }

    function handleInputsRecalculate() {
        generate("inputs_commit");
    }
</script>

<!-- --- Navigation Bar --- -->
<TopBar title="Pension Calendar" showInAppBanner={isFacebookInAppBrowser}>
    <svelte:fragment slot="actions">
        <Button
            color="light"
            size="xs"
            onclick={handleHelpClick}
        >
            Help
        </Button>
        <ShareButton
            shareText="Calculate your State Pension Age and payment calendar, including bank holiday adjustments."
            size="xs"
        />
        {#if !isFacebookInAppBrowser && !isStandalone && (canInstallPwa || showIosInstallHelp)}
            <!-- Install button for PWA or iOS help -->
            <Button
                color="blue"
                size="xs"
                onclick={handleInstallClick}
                title="Install app"
                aria-label="Install app"
            >
                Install
            </Button>
        {/if}
        <!-- Dark mode toggle button -->
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            class="h-4 w-4"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                        >
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
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
    class="bg-gradient-to-b from-slate-50 via-blue-50/40 to-white dark:from-gray-950 dark:to-gray-900 min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100"
>
    <div class="max-w-7xl mx-auto">
        <!-- Header section -->
        <div class="mb-6 sm:mb-8">
            <div
                class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
                <div>
                    <h1
                        class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2"
                    >
                        UK State Pension Payment Calendar
                    </h1>
                    <p class="text-base sm:text-lg text-gray-700 dark:text-gray-300">
                        Check your expected payment dates using your NI code and date of birth.
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        We also estimate your State Pension age and let you print or export your calendar.
                    </p>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Privacy: your details stay on this device and are not sent to a server.
                    </p>
                </div>
            </div>
        </div>

        <!-- Inputs + Summary (single cohesive card) -->
        <Card
            size="xl"
            class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 input-section"
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
                        bind:numberOfYears
                        bind:cycleDays
                        bind:error
                        {bankHolidays}
                        onRestoreDefaults={handleResetAll}
                        onFirstPaymentAfterSpa={handleFirstPaymentAfterSpa}
                        onPersist={persistInputs}
                        onRecalculate={handleInputsRecalculate}
                        
                    />
                </div>

                <!-- Summary card -->
                <div class="lg:col-span-4 space-y-4">
                    {#if result}
                        <SummaryCard
                            {result}
                            embedded
                            spaDate={firstPaymentDateFormatted}
                            nextPaymentDate={nextPaymentDateFormatted}
                        />
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
            {#key `${result.ni}:${startYear}:${numberOfYears}:${cycleDays}`}
                <div class="w-full space-y-6 max-w-7xl mx-auto">
                    <!-- Calendar -->
                    <Card
                        size="xl"
                        class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 calendar-print-wrapper"
                    >
                        
                        <CalendarView
                            {result}
                            payments={result.payments}
                            {bankHolidays}
                            bind:showBankHolidays
                            bind:currentMonth={currentCalendarMonth}
                            bind:currentYear={currentCalendarYear}
                            bind:csvDateFormat
                            bind:icsEventName
                            bind:icsCategory
                            bind:icsColor
                            bind:startYearSelect
                            bind:numberOfYearsInput
                            {years}
                            {applyStartYear}
                            {applyNumberOfYears}
                            extendRangeByOneYear={extendNumberOfYearsByOne}
                            onPersist={persistInputs}
                            bind:selectedCountry
                            {additionalHolidays}
                            {isLoadingAdditionalHolidays}
                            {additionalHolidaysError}
                            onCountryChange={handleCountryChange}
                            {detectedCountry}
                        />
                    </Card>
                </div>
            {/key}
        {/if}
    </div>
    <AppFooter />
</div>

<svelte:head>
    <title>UK State Pension Age & Payment Calendar</title>
    <meta
        property="og:title"
        content="UK State Pension Age & Payment Calendar"
    />
    <meta
        property="og:description"
        content="Calculate your UK State Pension payment dates based on your National Insurance code and date of birth. Get an accurate pension schedule with bank holiday considerations."
    />
    <meta property="og:url" content="https://ukspcal.vercel.app" />
</svelte:head>
