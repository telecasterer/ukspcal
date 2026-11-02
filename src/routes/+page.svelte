<script lang="ts">
    // --- Imports ---
    import { generatePayments, type Payment, type PensionResult } from "#lib/pensionEngine";
    import { Button, Card } from "flowbite-svelte";
    import { MoonOutline, QuestionCircleOutline, SunOutline } from "flowbite-svelte-icons";
    import SummaryCard from "#lib/components/SummaryCard.svelte";
    import PensionInputsCard from "#lib/components/PensionInputsCard.svelte";
    import CalendarView from "#lib/components/CalendarView.svelte";
    import AppFooter from "#lib/components/AppFooter.svelte";
    import TopBar from "#lib/components/TopBar.svelte";
    import ShareButton from "#lib/components/ShareButton.svelte";
    import type { DateFormat } from "#lib/utils/dateFormatting";
    import type { SpaPreviewData } from "#lib/utils/summaryDocuments";
    import {
        applyDarkModeClass,
        persistDarkModeToStorage,
        readDarkModeFromStorage,
    } from "#lib/utils/darkMode";
    import { loadPersistedInputs, savePersistedInputs } from "#lib/utils/inputPersistence";
    import { migrateLegacyUkRegion } from "#lib/utils/persistedInputsMigration";
    import { calculateStatePensionAge } from "#lib/utils/statePensionAge";
    import { clearAllAppStorage } from "#lib/utils/clearAllAppStorage";
    import { loadHolidays } from "#lib/utils/loadHolidays";
    import { detectCountryFromTimezone } from "#lib/utils/timezoneDetection";
    import {
        subtractMonthsFromIso,
        formatIsoDateLong,
        formatIsoDateShort,
        daysUntilIso,
        formatDaysAway,
    } from "#lib/utils/isoDateHelpers";
    import {
        PERSIST_KEY,
        ALLOWED_CYCLE_DAYS,
        ALLOWED_DATE_FORMATS,
        MAX_NUMBER_OF_YEARS,
    } from "#lib/config";
    import { goto } from "$app/navigation";
    import { createPwaInstall } from "#lib/utils/pwaInstallState.svelte";
    import { buildUkHolidayWarnings } from "#lib/utils/holidayWarnings";
    import InstallHelpModal from "#lib/components/InstallHelpModal.svelte";
    import { onMount, untrack } from "svelte";
    import { todayStore } from "#lib/utils/todayStore.svelte";
    import "../styles/calendarPrint.css";

    // --- Props ---
    type PageProps = { bankHolidays?: Record<string, string> };

    const { bankHolidays: initialBankHolidays = {} }: PageProps = $props();

    // --- State: core inputs ---
    let ni: string = $state("");
    let dob: string = $state("");
    let startYear: number = $state(Number(todayStore.iso.slice(0, 4)));
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
    // The date of birth is pre-filled with a default, so the summary stays hidden until the
    // user has edited it, loaded a profile, or it was restored from saved inputs.
    let dobConfirmed: boolean = $state(false);
    let spaPreviewData: SpaPreviewData | null = $state(null);
    let hasLoadedPersistedInputs: boolean = $state(false);

    // --- State: calendar navigation ---
    const currentYear = $derived(Number(todayStore.iso.slice(0, 4)));
    let startYearSelect: string = $state("");
    let numberOfYearsInput: string = $state("");
    let currentCalendarMonth: number = $state(Number(todayStore.iso.slice(5, 7)) - 1);
    let currentCalendarYear: number = $state(Number(todayStore.iso.slice(0, 4)));
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
    let ukHolidaysMissingYears: number[] = $state([]);
    let ukHolidaysUnsupportedYears: number[] = $state([]);
    let holidayRetryCount: number = $state(0);

    // --- State: PWA install ---
    const pwaInstall = createPwaInstall();
    let darkMode: boolean = $state(readDarkModeFromStorage());

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

    // Start-year choices. Payments before State Pension age are never shown, so the list
    // starts at the SPA year (or the saved start year, if that is earlier).
    const years = $derived.by(() => {
        const first = Math.min(startYear, spaDateIso ? isoYear(spaDateIso) : currentYear - 15);
        const last = Math.max(currentYear, first) + 35;
        return Array.from({ length: last - first + 1 }, (_, i) => first + i);
    });

    const hasPassedSpa = $derived.by(() => {
        if (!spaDateIso) return false;
        return todayStore.iso >= spaDateIso;
    });

    const nextPaymentDateFormatted = $derived.by(() => {
        if (!result || result.payments.length === 0 || !hasPassedSpa) return "";
        const todayIso = todayStore.iso;
        const nextPayment = result.payments.find((p) => p.paid >= todayIso);
        if (!nextPayment) return "";
        return `${formatIsoDateShort(nextPayment.paid)} (${formatDaysAway(daysUntilIso(nextPayment.paid, todayIso))})`;
    });

    const statePensionApplyInfo = $derived.by(() => {
        if (!spaDateIso || hasPassedSpa) return null;
        const applyFromIso = subtractMonthsFromIso(spaDateIso, 4);
        const applyNow = applyFromIso <= todayStore.iso;
        return {
            applyFromIso,
            applyFromFormatted: formatIsoDateLong(applyFromIso),
            countdownDays: applyNow ? 0 : daysUntilIso(applyFromIso, todayStore.iso),
            applyNow,
        };
    });

    const isWithinThreeMonthsOfSpa = $derived.by(() => {
        if (!spaDateIso || hasPassedSpa) return false;
        return daysUntilIso(spaDateIso, todayStore.iso) <= 92;
    });

    const ukHolidaysWarnings = $derived(
        buildUkHolidayWarnings(ukHolidaysUnsupportedYears, ukHolidaysMissingYears)
    );

    // --- Lifecycle ---
    onMount(() => {
        const unmountPwaInstall = pwaInstall.mount();

        // Retry holidays that failed to load once the connection is back.
        const onOnline = () => {
            if (ukHolidaysMissingYears.length > 0) holidayRetryCount += 1;
            if (selectedCountry !== "none" && additionalHolidaysError) {
                handleCountryChange(selectedCountry);
            }
        };

        window.addEventListener("online", onOnline);

        try {
            migrateLegacyUkRegion(localStorage, PERSIST_KEY);
            const persisted = loadPersistedInputs(localStorage, PERSIST_KEY, {
                allowedCycleDays: ALLOWED_CYCLE_DAYS,
                allowedDateFormats: ALLOWED_DATE_FORMATS,
            });

            if (persisted.ni !== undefined) ni = persisted.ni;
            if (persisted.dob !== undefined) dob = persisted.dob;
            if (persisted.dob) dobConfirmed = true;
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
            if (persisted.selectedCountry !== undefined)
                selectedCountry = persisted.selectedCountry;
        } catch {
            // Ignore invalid/corrupt stored values.
        } finally {
            hasLoadedPersistedInputs = true;
        }

        return () => {
            unmountPwaInstall();
            window.removeEventListener("online", onOnline);
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

    // Load UK bank holidays (cached, with an offline fallback) for the selected region
    // and year range. Re-runs when `holidayRetryCount` is bumped (back online).
    // Note: `ukRegion` is intentionally NOT persisted — always defaults to GB-ENG+GB-WLS.
    $effect.pre(() => {
        if (!ukRegion || !hasLoadedPersistedInputs) return;
        void holidayRetryCount;
        const region = ukRegion;
        const firstYear = startYear;
        const yearCount = numberOfYears;
        const requestId = ++ukHolidaysRequestSeq;
        (async () => {
            const loaded = await loadHolidays(
                region,
                firstYear,
                yearCount,
                requestId,
                () => ukHolidaysRequestSeq
            );
            if (loaded === null) return; // superseded by a newer request
            bankHolidays = loaded.holidays;
            ukHolidaysMissingYears = loaded.missingYears;
            ukHolidaysUnsupportedYears = loaded.unsupportedYears;
        })();
    });

    // The holiday fetch above is async, so it can resolve after persisted inputs have
    // already generated the schedule (slow network / TWA cold start). Re-adjust the
    // existing payments when holidays change, without moving the calendar view.
    $effect.pre(() => {
        void bankHolidays;
        untrack(() => {
            if (result) result = computeResult(result.ni, result.cycleDays);
        });
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

    function computeResult(niCode: string, cycle: number): PensionResult {
        const generated = generatePayments(
            niCode,
            startYear,
            startYear + numberOfYears - 1,
            cycle,
            bankHolidays
        );
        const filteredPayments = minPaymentIso
            ? generated.payments.filter((p) => p.paid >= minPaymentIso!)
            : generated.payments;
        return { ...generated, payments: filteredPayments };
    }

    function generate() {
        error = "";
        if (!/^\d{2}[A-D]$/i.test(ni)) {
            error = "NI number suffix must be 2 digits followed by a letter A–D (e.g. 22D)";
            result = null;
            return;
        }
        result = computeResult(ni, cycleDays);
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
        startYear = Number(todayStore.iso.slice(0, 4));
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
        ukHolidaysMissingYears = [];
        ukHolidaysUnsupportedYears = [];
        pendingCalendarFocusIso = null;
        minPaymentIso = null;
        lastFirstPaymentAfterSpaKey = null;
        currentCalendarMonth = Number(todayStore.iso.slice(5, 7)) - 1;
        currentCalendarYear = Number(todayStore.iso.slice(0, 4));
        // Follow saved preference if present, otherwise device setting.
        darkMode = readDarkModeFromStorage();
        result = null;
        error = "";
        hasUserCommittedInputs = false;
        dobConfirmed = false;
        hasLoadedPersistedInputs = true;
    }

    function applyStartYear() {
        const n = Number.parseInt(startYearSelect, 10);
        if (Number.isFinite(n)) {
            startYear = n;
            persistInputs();
            generate();
        }
    }

    function applyNumberOfYears() {
        const n = Number.parseInt(numberOfYearsInput, 10);
        if (Number.isFinite(n) && n > 0 && n <= MAX_NUMBER_OF_YEARS) {
            numberOfYears = n;
            persistInputs();
            generate();
        }
    }

    function extendNumberOfYearsByOne(): boolean {
        if (numberOfYears >= MAX_NUMBER_OF_YEARS) return false;
        pendingCalendarFocusIso = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, "0")}-01`;
        numberOfYears += 1;
        numberOfYearsInput = String(numberOfYears);
        persistInputs();
        generate();
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
        const loaded = await loadHolidays(
            country,
            startYear,
            numberOfYears,
            requestId,
            () => additionalHolidaysRequestSeq
        );
        if (loaded === null) return; // superseded by a newer request
        additionalHolidays = loaded.holidays;
        additionalHolidaysError =
            loaded.missingYears.length > 0
                ? "Couldn't load additional holidays right now. Try again."
                : "";
        isLoadingAdditionalHolidays = false;
    }

    function handleSpaPreviewData(data: SpaPreviewData | null): void {
        spaPreviewData = data;
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
        if (hasPassedSpa) {
            // Already past SPA: default the view to today rather than the
            // (possibly long-past) first payment. Grow the generated range
            // if needed so today's month actually has data (and stays
            // reachable via Next/Previous) — never shrinks an existing
            // larger range. The user can still navigate back to the SPA
            // month manually.
            // Capped at MAX_NUMBER_OF_YEARS so a very early SPA can't generate
            // centuries of payments (and one holiday request per year); if today is
            // then out of range, focus the first payment instead.
            const todayYear = Number(todayStore.iso.slice(0, 4));
            numberOfYears = Math.min(
                MAX_NUMBER_OF_YEARS,
                Math.max(numberOfYears, todayYear - startYear + 1)
            );
            pendingCalendarFocusIso =
                todayYear < startYear + numberOfYears ? todayStore.iso : payment.paid;
        } else {
            pendingCalendarFocusIso = payment.paid;
        }
        generate();
        // Persist the auto-adjusted year range so the UI comes back the same next time.
        if (hasUserCommittedInputs) persistInputs();
    }

    function handleHelpClick() {
        goto("/help");
    }

    function handleInputsRecalculate() {
        generate();
    }
</script>

<!-- --- Navigation Bar --- -->
<TopBar
    title="UK State Pension Calendar"
    shortTitle="Pension Calendar"
    showInAppBanner={pwaInstall.isFacebookInAppBrowser}
>
    {#snippet menu()}
        <Button color="light" size="xs" class="toolbar-btn" onclick={handleHelpClick}>
            <span class="inline-flex items-center gap-1.5">
                <QuestionCircleOutline class="h-4 w-4" />
                <span>Help</span>
            </span>
        </Button>
        <ShareButton
            shareText="Calculate your State Pension Age and payment calendar, including bank holiday adjustments."
            size="xs"
            buttonClass="toolbar-btn"
        />
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
            <span class="inline-flex items-center gap-1.5">
                {#if darkMode}
                    <SunOutline class="h-4 w-4" ariaLabel="Light mode" />
                {:else}
                    <MoonOutline class="h-4 w-4" ariaLabel="Dark mode" />
                {/if}
                <span class="min-[520px]:hidden">{darkMode ? "Light mode" : "Dark mode"}</span>
            </span>
        </Button>
    {/snippet}
    {#snippet actions()}
        {#if pwaInstall.showInstallCta}
            <Button
                color="blue"
                size="xs"
                class="toolbar-btn"
                onclick={pwaInstall.handleInstallClick}
                title={pwaInstall.buttonTitle}
                aria-label={pwaInstall.buttonTitle}
            >
                <span class="min-[520px]:hidden">{pwaInstall.shortButtonLabel}</span>
                <span class="hidden min-[520px]:inline">{pwaInstall.buttonLabel}</span>
            </Button>
        {/if}
    {/snippet}
</TopBar>

{#if pwaInstall.showInstallHelpModal}
    <InstallHelpModal bind:open={pwaInstall.showInstallHelpModal} />
{/if}

<!-- --- Main Content --- -->
<div
    class="app-page-bg page-bottom-safe-area min-h-screen py-4 sm:py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100"
>
    <div class="page-container-app">
        <!-- Header section -->
        <div class="mb-4 sm:mb-8 print-hide max-w-3xl">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 sm:mb-3">
                <h1
                    class="text-xl min-[390px]:text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
                >
                    UK State Pension Calendar
                </h1>
                <span
                    class="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                    Unofficial
                </span>
            </div>
            <p class="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Calculate your State Pension age and generate a personalised payment schedule. All
                data stays safely on your device.
            </p>
        </div>

        <!-- Inputs + Summary (single cohesive card) -->
        <Card size="xl" class="card-surface w-full mb-6 sm:mb-8 input-section overflow-hidden">
            <div
                class="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700"
            >
                <!-- Pension input form -->
                <div class="lg:col-span-7">
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
                        onSpaPreviewData={handleSpaPreviewData}
                        onDobEdited={() => (dobConfirmed = true)}
                        onPersist={persistInputs}
                        onRecalculate={handleInputsRecalculate}
                    />
                </div>

                <!-- Summary card -->
                <div class="lg:col-span-5 bg-gray-50/30 dark:bg-gray-800/20">
                    <SummaryCard
                        result={dobConfirmed ? result : null}
                        embedded
                        nextPaymentDate={dobConfirmed ? nextPaymentDateFormatted : ""}
                        statePensionApplyInfo={dobConfirmed ? statePensionApplyInfo : null}
                        spaDateIso={dobConfirmed ? spaDateIso : ""}
                        isWithinThreeMonthsOfSpa={dobConfirmed && isWithinThreeMonthsOfSpa}
                        spaPreviewData={dobConfirmed ? spaPreviewData : null}
                    />
                    {#if !dobConfirmed}
                        <p
                            class="px-4 pb-4 sm:px-6 sm:pb-6 text-sm text-gray-600 dark:text-gray-300"
                        >
                            Enter your date of birth to see your State Pension age and payment
                            summary.
                        </p>
                    {/if}
                </div>
            </div>
        </Card>

        <!-- Results Section: Calendar and payments -->
        {#if result}
            {#key `${result.ni}:${startYear}:${numberOfYears}:${cycleDays}`}
                <div class="w-full space-y-6 max-w-7xl mx-auto">
                    <!-- Calendar -->
                    <Card size="xl" class="card-surface w-full calendar-print-wrapper">
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
                            {ukHolidaysWarnings}
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
    <title>UK State Pension Calendar</title>

    <meta
        name="description"
        content="Calculate your UK State Pension age and payment dates from your date of birth and NI number suffix, with UK bank holiday adjustments and CSV/ICS export."
    />

    <meta property="og:title" content="UK State Pension Calendar" />

    <meta
        property="og:description"
        content="Calculate your UK State Pension age and payment dates from your date of birth and NI number suffix, with UK bank holiday adjustments and CSV/ICS export."
    />

    <meta property="og:url" content="https://ukspcal.vercel.app" />

    <meta property="og:type" content="website" />
</svelte:head>
