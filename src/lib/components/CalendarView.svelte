<script lang="ts">
    // CalendarView: Renders the multi-month calendar, export, and print controls
    import {
        Button,
        Dropdown,
        DropdownItem,
        Label,
        Modal,
        Select,
    } from "flowbite-svelte";
    import { DownloadOutline, PrinterOutline, ArrowLeftOutline, ArrowRightOutline } from "flowbite-svelte-icons";
    import { previousMonth } from "$lib/utils/calendarHelpers";
    import CalendarMonth from "./CalendarMonth.svelte";
    import CalendarPager from "./CalendarPager.svelte";
    import { Checkbox as FlowbiteCheckbox } from "flowbite-svelte";
    import type { Payment } from "$lib/pensionEngine";
    import type { PensionResult } from "$lib/pensionEngine";
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "$lib/utils/clipboard";
    import type { DateFormat } from "$lib/utils/dateFormatting";
    import { detectFacebookInAppBrowserFromWindow } from "$lib/utils/inAppBrowser";
    import { onMount, tick } from "svelte";
    import CsvExportModal from "./CsvExportModal.svelte";
    import IcsExportModal from "./IcsExportModal.svelte";
    import CountryHolidaySelector from "./CountryHolidaySelector.svelte";

    // --- Constants ---
    const pageSize = 6; // Number of months to show at once
    const navStep = 6; // How many months to jump on navigation

    // --- Props ---
    type Props = {
        result: PensionResult;
        payments: Payment[];
        bankHolidays: Record<string, string>;
        showBankHolidays: boolean;
        currentMonth: number;
        currentYear: number;
        csvDateFormat: DateFormat;
        icsEventName: string;
        icsCategory: string;
        icsColor: string;
        onPersist?: () => void;
        startYearSelect: string;
        numberOfYearsInput: string;
        years: number[];
        applyStartYear: () => void;
        applyNumberOfYears: () => void;
        extendRangeByOneYear?: () => boolean;
        selectedCountry: string;
        additionalHolidays: Record<string, string>;
        isLoadingAdditionalHolidays?: boolean;
        additionalHolidaysError?: string;
        onCountryChange?: (country: string) => void;
        detectedCountry?: string;
    };

    let {
        result,
        payments,
        bankHolidays,
        showBankHolidays = $bindable(),
        currentMonth = $bindable(),
        currentYear = $bindable(),
        csvDateFormat = $bindable(),
        icsEventName = $bindable(),
        icsCategory = $bindable(),
        icsColor = $bindable(),
        onPersist,
        startYearSelect = $bindable(),
        numberOfYearsInput = $bindable(),
        years,
        applyStartYear,
        applyNumberOfYears,
        extendRangeByOneYear = () => false,
        selectedCountry = $bindable(),
        additionalHolidays,
        isLoadingAdditionalHolidays = false,
        additionalHolidaysError = "",
        onCountryChange,
        detectedCountry = "none",
    }: Props = $props();

    // --- State ---
    let renderPrintAllMonths = $state(false);
    let printUnsupportedOpen = $state(false);
    let isFacebookInAppBrowser = $state(false);
    let copyLinkStatus = $state("");
    let exportMenuOpen = $state(false);
    let csvModalOpen = $state(false);
    let icsModalOpen = $state(false);
    let screenGridEl: HTMLDivElement | null = $state(null);

    // --- Derived values ---
    const allMonths = $derived.by(() => {
        if (payments.length === 0) return [];
        const first = new Date(payments[0].paid + "T00:00:00Z");
        const last = new Date(payments[payments.length - 1].paid + "T00:00:00Z");
        const months: Array<{ month: number; year: number }> = [];
        let current = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
        while (current <= last) {
            months.push({ month: current.getUTCMonth(), year: current.getUTCFullYear() });
            current.setUTCMonth(current.getUTCMonth() + 1);
        }
        return months;
    });

    const focusedIndex = $derived(
        allMonths.findIndex((m) => m.year === currentYear && m.month === currentMonth)
    );

    const visibleMonths = $derived.by(() => {
        const idx = focusedIndex === -1 ? 0 : focusedIndex;
        const maxStart = Math.max(0, allMonths.length - pageSize);
        const start = Math.min(Math.max(0, idx), maxStart);
        return allMonths.slice(start, start + pageSize);
    });

    const shortMonthName = (month: number) =>
        new Date(2000, month, 1).toLocaleDateString("en-GB", { month: "short" });

    const fmtMonth = (m: { month: number; year: number }) =>
        `${shortMonthName(m.month)} ${m.year}`;

    const visibleRangeLabel = $derived.by(() => {
        if (!visibleMonths.length) return "";
        const first = visibleMonths[0];
        const last = visibleMonths[visibleMonths.length - 1];
        return first.month === last.month && first.year === last.year
            ? fmtMonth(first)
            : `${fmtMonth(first)} – ${fmtMonth(last)}`;
    });

    const fullRangeLabel = $derived.by(() => {
        if (!allMonths.length) return "";
        const first = allMonths[0];
        const last = allMonths[allMonths.length - 1];
        return first.month === last.month && first.year === last.year
            ? fmtMonth(first)
            : `${fmtMonth(first)} – ${fmtMonth(last)}`;
    });

    const canJumpToToday = $derived.by(() => {
        const now = new Date();
        return allMonths.some(
            (m) => m.month === now.getUTCMonth() && m.year === now.getUTCFullYear()
        );
    });

    // --- Lifecycle ---
    onMount(() => {
        isFacebookInAppBrowser = detectFacebookInAppBrowserFromWindow();

        const onBeforePrint = () => { renderPrintAllMonths = true; };
        const onAfterPrint = () => { renderPrintAllMonths = false; };

        window.addEventListener("beforeprint", onBeforePrint);
        window.addEventListener("afterprint", onAfterPrint);

        // Fallback for browsers that don't reliably fire beforeprint/afterprint.
        const mql = window.matchMedia?.("print");
        const onMqlChange = (e: MediaQueryListEvent) => {
            renderPrintAllMonths = e.matches;
        };
        if (mql) {
            if ("addEventListener" in mql) {
                mql.addEventListener("change", onMqlChange);
            } else {
                // @ts-expect-error Legacy Safari
                mql.addListener(onMqlChange);
            }
        }

        return () => {
            window.removeEventListener("beforeprint", onBeforePrint);
            window.removeEventListener("afterprint", onAfterPrint);
            if (mql) {
                if ("removeEventListener" in mql) {
                    mql.removeEventListener("change", onMqlChange);
                } else {
                    // @ts-expect-error Legacy Safari
                    mql.removeListener(onMqlChange);
                }
            }
        };
    });

    // --- Functions ---
    async function copyLinkToClipboard() {
        copyLinkStatus = "";
        const ok = await copyLinkToClipboardUtil();
        copyLinkStatus = ok
            ? "Link copied."
            : "Couldn't copy automatically — please copy the address bar URL.";
    }

    async function handlePrint() {
        // Facebook/Messenger iOS in-app browsers frequently block print dialogs.
        if (isFacebookInAppBrowser) {
            printUnsupportedOpen = true;
            return;
        }
        renderPrintAllMonths = true;
        await tick();
        try {
            window.print();
        } catch {
            printUnsupportedOpen = true;
        }
    }

    function handlePreviousMonth() {
        if (focusedIndex > 0) {
            const prev = allMonths[Math.max(0, focusedIndex - navStep)];
            currentMonth = prev.month;
            currentYear = prev.year;
            return;
        }
        const newMonth = previousMonth(currentMonth, currentYear);
        currentMonth = newMonth.month;
        currentYear = newMonth.year;
    }

    function handleNextMonth() {
        if (focusedIndex !== -1 && focusedIndex + navStep < allMonths.length) {
            const next = allMonths[focusedIndex + navStep];
            currentMonth = next.month;
            currentYear = next.year;
            return;
        }
        // At end of generated range: auto-extend by 1 year and regenerate.
        extendRangeByOneYear();
    }

    function handleJumpToToday() {
        if (!canJumpToToday) return;
        const now = new Date();
        const todayMonth = now.getUTCMonth();
        const todayYear = now.getUTCFullYear();
        currentMonth = todayMonth;
        currentYear = todayYear;
        void scrollTodayMonthIntoView(todayMonth, todayYear);
    }

    async function scrollTodayMonthIntoView(month: number, year: number): Promise<void> {
        await tick();
        requestAnimationFrame(() => {
            const key = `${year}-${month}`;
            const monthNode = screenGridEl?.querySelector<HTMLElement>(
                `[data-month-key="${key}"]`
            );
            if (!monthNode) return;
            const rect = monthNode.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            if (rect.top >= 0 && rect.bottom <= viewportHeight) return;
            monthNode.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        });
    }
</script>

<div class="space-y-3">
    <div class="w-full calendar-controls print-hide">
        <div
            class="bg-white/95 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-3 lg:p-4 space-y-4"
        >
            <!-- Top Row: Title & Export -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="text-center sm:text-left">
                    <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Payment calendar
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {payments.length} payments · {fullRangeLabel}
                    </p>
                </div>
                <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2">
                    <Button
                        id="export-menu"
                        color="light"
                        class="w-full px-2.5 py-2 text-xs min-[390px]:text-sm"
                        title="Export"
                        aria-label="Export"
                    >
                        <span class="inline-flex items-center gap-1.5">
                            <DownloadOutline class="h-4 w-4" ariaLabel="Export" />
                            <span>Export</span>
                        </span>
                    </Button>
                    <Dropdown
                        triggeredBy="#export-menu"
                        bind:isOpen={exportMenuOpen}
                        class="z-50 border border-gray-200 dark:border-gray-600 dark:!bg-gray-600"
                    >
                        <DropdownItem
                            class="text-gray-700 dark:text-gray-100"
                            onclick={() => { exportMenuOpen = false; csvModalOpen = true; }}
                        >Download spreadsheet (CSV)</DropdownItem>
                        <DropdownItem
                            class="text-gray-700 dark:text-gray-100"
                            onclick={() => { exportMenuOpen = false; icsModalOpen = true; }}
                        >Add to calendar (ICS)</DropdownItem>
                    </Dropdown>
                    <Button
                        onclick={handlePrint}
                        color="light"
                        class="w-full px-2.5 py-2 text-xs min-[390px]:text-sm"
                        title="Print calendar"
                        aria-label="Print calendar"
                    >
                        <span class="inline-flex items-center gap-1.5">
                            <PrinterOutline class="h-4 w-4" ariaLabel="Print" />
                            <span>Print</span>
                        </span>
                    </Button>
                </div>
            </div>

            <!-- Middle Row: Navigation and Settings -->
            <div class="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <!-- Navigation -->
                <div class="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        onclick={handlePreviousMonth}
                        color="light"
                        class="w-auto min-w-[2.5rem] px-2.5 py-2 text-xs min-[390px]:text-sm"
                        disabled={!(focusedIndex > 0)}
                        title="Previous"
                        aria-label="Previous"
                    >
                        <ArrowLeftOutline class="h-4 w-4" ariaLabel="Previous" />
                    </Button>
                    <div
                        class="flex-1 min-w-[140px] px-2.5 h-9 inline-flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs min-[390px]:text-sm font-semibold text-gray-900 dark:text-white"
                    >
                        {visibleRangeLabel}
                    </div>
                    <Button
                        onclick={handleNextMonth}
                        color="light"
                        class="w-auto min-w-[2.5rem] px-2.5 py-2 text-xs min-[390px]:text-sm"
                        disabled={!(focusedIndex !== -1 && focusedIndex < allMonths.length - 1)}
                        title="Next"
                        aria-label="Next"
                    >
                        <ArrowRightOutline class="h-4 w-4" ariaLabel="Next" />
                    </Button>
                    <Button
                        onclick={handleJumpToToday}
                        color="light"
                        class="w-auto px-3 py-2 text-xs min-[390px]:text-sm"
                        disabled={!canJumpToToday}
                        title={canJumpToToday ? "Jump to current month" : "Current month is outside this calendar range"}
                        aria-label="Today"
                    >
                        Today
                    </Button>
                </div>

                <!-- Settings -->
                <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div class="flex items-center gap-2">
                        <Label for="start-year" class="text-xs min-[390px]:text-sm text-gray-700 dark:text-gray-300">Start year</Label>
                        <Select
                            id="start-year"
                            bind:value={startYearSelect}
                            oninput={applyStartYear}
                            onchange={applyStartYear}
                            class="w-24"
                            classes={{ select: "text-xs min-[390px]:text-sm !h-9 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" }}
                        >
                            {#each years as year}
                                <option value={String(year)}>{year}</option>
                            {/each}
                        </Select>
                    </div>
                    <div class="flex items-center gap-2">
                        <Label for="number-of-years" class="text-xs min-[390px]:text-sm text-gray-700 dark:text-gray-300">Duration</Label>
                        <Select
                            id="number-of-years"
                            bind:value={numberOfYearsInput}
                            oninput={applyNumberOfYears}
                            onchange={applyNumberOfYears}
                            class="w-24"
                            classes={{ select: "text-xs min-[390px]:text-sm !h-9 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" }}
                        >
                            {#each Array.from({ length: 50 }, (_, i) => i + 1) as y}
                                <option value={String(y)}>{y} years</option>
                            {/each}
                        </Select>
                    </div>
                </div>
            </div>

            <!-- Bottom Row: Holiday toggles -->
            <div class="flex flex-wrap items-center gap-4 pt-1">
                <Label class="flex items-center gap-2 cursor-pointer text-xs min-[390px]:text-sm">
                    <FlowbiteCheckbox
                        bind:checked={showBankHolidays}
                        onchange={() => onPersist?.()}
                    />
                    <span>UK holidays</span>
                </Label>
                <CountryHolidaySelector
                    bind:selectedCountry
                    {detectedCountry}
                    {isLoadingAdditionalHolidays}
                    {additionalHolidaysError}
                    {onCountryChange}
                    {onPersist}
                />
            </div>
        </div>
    </div>

    <CsvExportModal
        bind:open={csvModalOpen}
        {payments}
        {result}
        bind:csvDateFormat
        {onPersist}
    />

    <IcsExportModal
        bind:open={icsModalOpen}
        {payments}
        {result}
        {csvDateFormat}
        bind:icsEventName
        bind:icsCategory
        bind:icsColor
        {onPersist}
    />

    <!-- --- Multiple Month Calendar Grid (screen) --- -->
    {#if !renderPrintAllMonths}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full calendar-grid screen-only"
            bind:this={screenGridEl}
        >
            {#each visibleMonths as monthData (monthData.year * 12 + monthData.month)}
                <div data-month-key={`${monthData.year}-${monthData.month}`}>
                    <CalendarMonth
                        year={monthData.year}
                        month={monthData.month}
                        {showBankHolidays}
                        {payments}
                        {bankHolidays}
                        {additionalHolidays}
                        {selectedCountry}
                    />
                </div>
            {/each}
        </div>
    {/if}

    <!-- --- Print: all months from start to end --- -->
    {#if renderPrintAllMonths}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full calendar-grid print-only"
        >
            {#each allMonths as monthData (monthData.year * 12 + monthData.month)}
                <CalendarMonth
                    year={monthData.year}
                    month={monthData.month}
                    {showBankHolidays}
                    {payments}
                    {bankHolidays}
                    {additionalHolidays}
                    {selectedCountry}
                />
            {/each}
        </div>
    {/if}

    <CalendarPager
        {visibleRangeLabel}
        {canJumpToToday}
        canGoPrevious={focusedIndex > 0}
        canGoNext={focusedIndex !== -1 && focusedIndex < allMonths.length - 1}
        onPrevious={handlePreviousMonth}
        onNext={handleNextMonth}
        onToday={handleJumpToToday}
    />

    <!-- --- Print Unsupported Modal (Facebook in-app browser) --- -->
    <Modal title="Printing not available" bind:open={printUnsupportedOpen} size="md">
        <div class="space-y-3">
            <p class="text-sm text-gray-700 dark:text-gray-200">
                The Facebook/Messenger in-app browser often blocks the system print dialog.
            </p>
            <p class="text-sm text-gray-700 dark:text-gray-200">
                For printing, open this page in Safari/Chrome ("Open in browser") and try again.
            </p>
            <div class="flex items-center gap-2 justify-end">
                <Button color="light" onclick={() => copyLinkToClipboard()}>Copy link</Button>
                <Button color="blue" onclick={() => (printUnsupportedOpen = false)}>OK</Button>
            </div>
            {#if copyLinkStatus}
                <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
                    {copyLinkStatus}
                </p>
            {/if}
        </div>
    </Modal>
</div>
