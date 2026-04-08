<script lang="ts">
    // --- Imports ---
    import {
        generatePayments,
        type Payment,
        type PensionResult,
    } from "$lib/pensionEngine";
    import { Button, Card, Modal } from "flowbite-svelte";
    import { MoonOutline, SunOutline } from "flowbite-svelte-icons";
    import SummaryCard from "$lib/components/SummaryCard.svelte";
    import PensionInputsCard from "$lib/components/PensionInputsCard.svelte";
    import CalendarView from "$lib/components/CalendarView.svelte";
    import AppFooter from "$lib/components/AppFooter.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import type { DateFormat } from "$lib/utils/dateFormatting";
    import {
        detectFacebookInAppBrowserFromWindow,
        isAndroidUserAgent,
    } from "$lib/utils/inAppBrowser";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "$lib/utils/darkMode";
    import {
        loadPersistedInputs,
        savePersistedInputs,
    } from "$lib/utils/inputPersistence";
    import { migrateLegacyUkRegion } from "$lib/utils/persistedInputsMigration";
    import { calculateStatePensionAge } from "$lib/utils/statePensionAge";
    import { clearAllAppStorage } from "$lib/utils/clearAllAppStorage";
    import { loadAdditionalHolidays } from "$lib/utils/loadAdditionalHolidays";
    import { detectCountryFromTimezone } from "$lib/utils/timezoneDetection";
    import { capturePosthog } from "$lib/utils/posthog";
    import {
        subtractMonthsFromIso,
        formatIsoDateLong,
        daysUntilIso,
    } from "$lib/utils/isoDateHelpers";
    import {
        PERSIST_KEY,
        ANDROID_PLAY_STORE_URL,
        ALLOWED_CYCLE_DAYS,
        ALLOWED_DATE_FORMATS,
    } from "$lib/config";
    import { goto } from "$app/navigation";
    import { fetchHolidaysForCountryAndYears } from "$lib/services/nagerHolidayService";
    import {
        computeIsStandalone,
        getDisplayModeStandalone,
        getNavigatorStandalone,
        shouldShowIosInstallHelp,
        type BeforeInstallPromptEvent,
    } from "$lib/utils/pwaInstall";
    import { onMount } from "svelte";
    import "../styles/calendarPrint.css";

    // --- Props ---
    type PageProps = { bankHolidays?: Record<string, string> };
    const { bankHolidays: initialBankHolidays = {} }: PageProps = $props();

    // --- State: core inputs ---
    let ni: string = $state("");
    let dob: string = $state("");
    let startYear: number = $state(new Date().getFullYear());
    let numberOfYears: number = $state(5);
    let cycleDays: number = $state(28);
    let showBankHolidays: boolean = $state(true);
    let csvDateFormat: DateFormat = $state("dd/mm/yyyy");
    let icsEventName: string = $state("UK State Pension Payment");
    let icsCategory: string = $state("Finance");
    let icsColor: string = $state("#22c55e");
    let ukRegion: string = $state("GB-ENG+GB-WLS"); // England & Wales default (combined)
    const detectedCountry: string = detectCountryFromTimezone();
    let result: PensionResult | null = $state(null);
    let error: string = $state("");
    let hasUserCommittedInputs: boolean = $state(false);
    let hasLoadedPersistedInputs: boolean = $state(false);

    // --- State: calendar navigation ---
    const currentYear: number = new Date().getFullYear();
    const years: number[] = Array.from({ length: 50 }, (_, i) => currentYear - 15 + i);
    let startYearSelect: string = $state("");
    let numberOfYearsInput: string = $state("");
    let currentCalendarMonth: number = $state(new Date().getMonth());
    let currentCalendarYear: number = $state(new Date().getFullYear());
    let pendingCalendarFocusIso: string | null = $state(null);
    let minPaymentIso: string | null = $state(null);
    let lastFirstPaymentAfterSpaKey: string | null = $state(null);

    // --- State: holiday loading ---
    let bankHolidays: Record<string, string> = $state({});
    let selectedCountry: string = $state("none");
    let additionalHolidays: Record<string, string> = $state({});
    let isLoadingAdditionalHolidays: boolean = $state(false);
    let additionalHolidaysError: string = $state("");
    let lastAdditionalHolidaysKey: string = $state("");
    let ukHolidaysRequestSeq = 0;
    let additionalHolidaysRequestSeq = 0;

    // --- State: PWA install ---
    let darkMode: boolean = $state(readDarkModeFromStorage());
    let isFacebookInAppBrowser: boolean = $state(false);
    let isAndroid: boolean = $state(false);
    let isStandalone: boolean = $state(false);
    let canInstallPwa: boolean = $state(false);
    let showInstallHelpModal: boolean = $state(false);
    let showIosInstallHelp: boolean = $state(false);
    let deferredInstallPrompt: BeforeInstallPromptEvent | null = $state(null);
    let hasCapturedInstallAccepted: boolean = $state(false);

    // --- Derived values ---
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
        return new Date().toISOString().slice(0, 10) >= spaDateIso;
    });

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
        const nextPayment = result.payments.find((p) => p.paid >= todayIso);
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

    const statePensionApplyInfo = $derived.by(() => {
        if (!spaDateIso || hasPassedSpa) return null;
        const applyFromIso = subtractMonthsFromIso(spaDateIso, 4);
        const applyNow = applyFromIso <= new Date().toISOString().slice(0, 10);
        return {
            applyFromIso,
            applyFromFormatted: formatIsoDateLong(applyFromIso),
            countdownDays: applyNow ? 0 : daysUntilIso(applyFromIso),
            applyNow,
        };
    });

    const isWithinThreeMonthsOfSpa = $derived.by(() => {
        if (!spaDateIso || hasPassedSpa) return false;
        return daysUntilIso(spaDateIso) <= 92;
    });

    const showInstallCta = $derived.by(
        () =>
            !isFacebookInAppBrowser &&
            !isStandalone &&
            (isAndroid || canInstallPwa || showIosInstallHelp)
    );

    const installButtonLabel = $derived.by(() =>
        isAndroid ? "Get Android app" : "Install"
    );

    const installButtonTitle = $derived.by(() =>
        isAndroid ? "Get the Android app on Google Play" : "Install app"
    );

    // --- Lifecycle ---
    onMount(() => {
        const ua = navigator.userAgent ?? "";
        isFacebookInAppBrowser = detectFacebookInAppBrowserFromWindow();
        isAndroid = isAndroidUserAgent(ua);

        const mq =
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
        showIosInstallHelp = shouldShowIosInstallHelp({ userAgent: ua, isStandalone });

        try {
            migrateLegacyUkRegion(localStorage, PERSIST_KEY);
            const persisted = loadPersistedInputs(localStorage, PERSIST_KEY, {
                allowedCycleDays: ALLOWED_CYCLE_DAYS,
                allowedDateFormats: ALLOWED_DATE_FORMATS,
            });

            if (persisted.ni !== undefined) ni = persisted.ni;
            if (persisted.dob !== undefined) dob = persisted.dob;
            if (persisted.startYear !== undefined) startYear = persisted.startYear;
            if (persisted.numberOfYears !== undefined)
                numberOfYears = Number(persisted.numberOfYears);
            if (persisted.cycleDays !== undefined) cycleDays = persisted.cycleDays;
            if (persisted.showBankHolidays !== undefined)
                showBankHolidays = persisted.showBankHolidays;
            if (persisted.csvDateFormat !== undefined) csvDateFormat = persisted.csvDateFormat;
            if (persisted.icsEventName !== undefined) icsEventName = persisted.icsEventName;
            if (persisted.icsCategory !== undefined) icsCategory = persisted.icsCategory;
            if (persisted.icsColor !== undefined) icsColor = persisted.icsColor;
            if (persisted.selectedCountry !== undefined) selectedCountry = persisted.selectedCountry;
        } catch {
            // Ignore invalid/corrupt stored values.
        } finally {
            hasLoadedPersistedInputs = true;
        }

        return () => {
            mq?.removeEventListener?.("change", onMqChange);
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.removeEventListener("appinstalled", onAppInstalled);
        };
    });

    // --- Effects ---

    $effect.pre(() => {
        bankHolidays = initialBankHolidays;
    });

    // Sync string inputs for year-range selects
    $effect.pre(() => {
        startYearSelect = String(startYear);
        numberOfYearsInput = String(numberOfYears);
    });

    // Fetch UK bank holidays for the selected region and year range.
    // Note: `ukRegion` is intentionally NOT persisted — always defaults to GB-ENG+GB-WLS.
    $effect.pre(() => {
        if (!ukRegion || !hasLoadedPersistedInputs) return;
        const yrs = Array.from({ length: numberOfYears }, (_, i) => startYear + i);
        const requestId = ++ukHolidaysRequestSeq;
        (async () => {
            const holidays = await fetchHolidaysForCountryAndYears("GB", yrs, ukRegion);
            if (requestId !== ukHolidaysRequestSeq) return;
            bankHolidays = holidays;
        })();
    });

    // Fetch additional (non-UK) holidays when year range or country changes
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

    // Persist dark mode preference and apply CSS class
    $effect.pre(() => {
        if (typeof window !== "undefined") {
            persistDarkModeToStorage(darkMode);
            applyDarkModeClass(darkMode);
        }
    });

    // --- Helper functions ---

    function captureInstallAcceptedOnce() {
        if (hasCapturedInstallAccepted) return;
        hasCapturedInstallAccepted = true;
        capturePosthog("install_prompt_accepted");
    }

    function isoYear(iso: string): number {
        return Number(iso.slice(0, 4));
    }

    // Persistence is triggered only on commit/blur/change, not on every keystroke.
    function persistInputs(): void {
        if (typeof window === "undefined" || !hasLoadedPersistedInputs) return;
        hasUserCommittedInputs = true;
        savePersistedInputs(localStorage, PERSIST_KEY, {
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
        });
    }

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
        const generated = generatePayments(
            ni,
            startYear,
            startYear + numberOfYears - 1,
            cycleDays,
            bankHolidays
        );
        const filteredPayments = minPaymentIso
            ? generated.payments.filter((p) => p.paid >= minPaymentIso!)
            : generated.payments;
        result = { ...generated, payments: filteredPayments };
        capturePosthog("schedule_generated", {
            source,
            cycle_days: cycleDays,
            start_year: startYear,
            number_of_years: numberOfYears,
            payments_count: result.payments.length,
        });
        // Reset calendar to the requested focus date (if set), otherwise first payment.
        if (result.payments.length > 0) {
            const focusIso = pendingCalendarFocusIso ?? result.payments[0].paid;
            const focusDate = new Date(focusIso + "T00:00:00Z");
            currentCalendarMonth = focusDate.getUTCMonth();
            currentCalendarYear = focusDate.getUTCFullYear();
        }
        pendingCalendarFocusIso = null;
    }

    // --- Event handlers ---

    function handleResetAll() {
        clearAllAppStorage();
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
        selectedCountry = "none";
        ukRegion = "GB-ENG+GB-WLS";
        additionalHolidays = {};
        isLoadingAdditionalHolidays = false;
        additionalHolidaysError = "";
        lastAdditionalHolidaysKey = "";
        additionalHolidaysRequestSeq = 0;
        ukHolidaysRequestSeq = 0;
        pendingCalendarFocusIso = null;
        minPaymentIso = null;
        lastFirstPaymentAfterSpaKey = null;
        currentCalendarMonth = new Date().getMonth();
        currentCalendarYear = new Date().getFullYear();
        // Follow saved preference if present, otherwise device setting.
        darkMode = readDarkModeFromStorage();
        result = null;
        error = "";
        hasUserCommittedInputs = false;
        hasLoadedPersistedInputs = true;
    }

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
        isLoadingAdditionalHolidays = true;
        const result = await loadAdditionalHolidays(
            country,
            startYear,
            numberOfYears,
            requestId,
            () => additionalHolidaysRequestSeq
        );
        if (result === null) return; // superseded by a newer request
        additionalHolidays = result.holidays;
        additionalHolidaysError = result.error;
        isLoadingAdditionalHolidays = false;
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
        startYear = Math.min(isoYear(payment.due), isoYear(payment.paid));
        pendingCalendarFocusIso = payment.paid;
        generate("spa_auto_focus");
        // Persist the auto-adjusted year range so the UI comes back the same next time.
        if (hasUserCommittedInputs) persistInputs();
    }

    async function handleInstallClick() {
        capturePosthog("install_click", {
            is_android: isAndroid,
            can_install_pwa: canInstallPwa,
            show_ios_help: showIosInstallHelp,
            is_standalone: isStandalone,
            in_app_browser: isFacebookInAppBrowser,
        });
        if (isFacebookInAppBrowser || isStandalone) return;
        if (isAndroid) {
            capturePosthog("install_play_store_opened");
            window.location.assign(ANDROID_PLAY_STORE_URL);
            return;
        }
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
            } catch { /* ignore */ }
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
<TopBar title="UK State Pension Calendar" showInAppBanner={isFacebookInAppBrowser}>
    <svelte:fragment slot="actions">
        <Button
            color="light"
            size="xs"
            class="toolbar-btn"
            onclick={handleHelpClick}
        >
            Help
        </Button>
        <ShareButton
            shareText="Calculate your State Pension Age and payment calendar, including bank holiday adjustments."
            size="xs"
            buttonClass="toolbar-btn"
        />
        {#if showInstallCta}
            <Button
                color="blue"
                size="xs"
                class="toolbar-btn"
                onclick={handleInstallClick}
                title={installButtonTitle}
                aria-label={installButtonTitle}
            >
                {installButtonLabel}
            </Button>
        {/if}
        <!-- Dark mode toggle button -->
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

{#if showInstallHelpModal}
    <Modal title="Install on iPhone/iPad" bind:open={showInstallHelpModal} size="md">
        <div class="space-y-3">
            <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                In Safari, tap the Share button, then choose
                <span class="font-semibold">Add to Home Screen</span>.
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
                If you're viewing inside an in-app browser, use "Open in browser" first.
            </p>
            <div class="flex justify-end">
                <Button
                    color="light"
                    class="toolbar-btn"
                    onclick={() => (showInstallHelpModal = false)}
                >
                    Close
                </Button>
            </div>
        </div>
    </Modal>
{/if}

<!-- --- Main Content --- -->
<div
    class="app-page-bg page-bottom-safe-area min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100"
>
    <div class="page-container-app">
        <!-- Header section -->
        <div class="mb-6 sm:mb-8 print-hide">
            <div
                class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
                <div>
                    <h1
                        class="text-2xl min-[390px]:text-[1.75rem] sm:text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white mb-2"
                    >
                        UK State Pension Payment Calendar
                    </h1>
                    <p class="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
                        Check your State Pension age and expected payment dates using your NI code and date of birth.
                    </p>
                    <p class="mt-1 text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        Print or export your payment calendar when you&rsquo;re ready.
                    </p>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Privacy: your details stay on this device and are not sent to a server.
                        Read our <a href="/privacy" class="underline hover:no-underline">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>

        <!-- Inputs + Summary (single cohesive card) -->
        <Card
            size="xl"
            class="card-surface w-full mb-6 sm:mb-8 input-section"
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
                            {statePensionApplyInfo}
                            {spaDateIso}
                            {isWithinThreeMonthsOfSpa}
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
                        class="card-surface w-full calendar-print-wrapper"
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
    <title>UK State Pension Payment Dates & Age Calculator</title>

    <meta name="description"
        content="Calculate your UK State Pension age and payment dates from your date of birth and NI suffix, with UK bank holiday adjustments and CSV/ICS export." />

    <meta property="og:title"
        content="UK State Pension Payment Dates & Age Calculator" />

    <meta property="og:description"
        content="Calculate your UK State Pension age and payment dates from your date of birth and NI suffix, with UK bank holiday adjustments and CSV/ICS export." />

    <meta property="og:url" content="https://ukspcal.vercel.app" />

    <meta property="og:type" content="website" />
</svelte:head>
