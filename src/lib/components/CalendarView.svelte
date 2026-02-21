<script lang="ts">
    // CalendarView.svelte: Renders the multi-month calendar, export, and print controls
    import { Button, Dropdown, DropdownItem, Label, Modal, Input, Select } from "flowbite-svelte";
    import { previousMonth } from "$lib/utils/calendarHelpers";
    import CalendarMonth from "./CalendarMonth.svelte";
    import CalendarPager from "./CalendarPager.svelte";
    import { Checkbox as FlowbiteCheckbox } from "flowbite-svelte";
    import type { Payment } from "$lib/pensionEngine";
    import type { PensionResult } from "$lib/pensionEngine";
    import { exportCSV, generateICS } from "$lib/utils/exportHelpers";
    import IcsReminderDialog from "./IcsAlarmDialog.svelte";
    import {
        loadIcsAlarmSettings as loadIcsReminderSettings,
        saveIcsAlarmSettings as saveIcsReminderSettings,
        type IcsAlarmSettings as IcsReminderSettings,
    } from "$lib/utils/icsAlarmPersistence";
    import { loadIcsEventTime, saveIcsEventTime } from "$lib/utils/icsEventTimePersistence";
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "$lib/utils/clipboard";
    import { DATE_FORMAT_OPTIONS, type DateFormat } from "$lib/utils/dateFormatting";
    import { detectFacebookInAppBrowserFromWindow } from "$lib/utils/inAppBrowser";
    import { capturePosthog } from "$lib/utils/posthog";
    import { onMount, tick } from "svelte";

    // --- Constants ---
    const pageSize = 6; // Number of months to show at once
    const navStep = 6; // How many months to jump on navigation

    // --- Props ---
    export let result: PensionResult;
    export let payments: Payment[];
    export let bankHolidays: Record<string, string>;
    export let showBankHolidays: boolean;
    export let currentMonth: number;
    export let currentYear: number;
    export let csvDateFormat: DateFormat;
    export let icsEventName: string;
    export let icsCategory: string;
    export let icsColor: string;
    export let onPersist: (() => void) | undefined;
    export let startYearSelect: string;
    export let numberOfYearsInput: string;
    export let years: number[];
    export let applyStartYear: () => void;
    export let applyNumberOfYears: () => void;
    export let extendRangeByOneYear: () => boolean = () => false;
    export let selectedCountry: string;
    export let additionalHolidays: Record<string, string>;
    export let isLoadingAdditionalHolidays: boolean = false;
    export let additionalHolidaysError: string = "";
    export let onCountryChange: ((country: string) => void) | undefined;
    export let detectedCountry: string = "none";

    // --- State ---
    let renderPrintAllMonths = false; // Only render all months for print
    let printUnsupportedOpen = false;
    let isFacebookInAppBrowser = false;
    let copyLinkStatus = "";

    // ICS Reminder dialog state
    let reminderDialogOpen = false;
    let reminderSettings: IcsReminderSettings = loadIcsReminderSettings();

    /**
     * Copy the current page URL to clipboard
     */
    async function copyLinkToClipboard() {
        copyLinkStatus = "";
        const ok = await copyLinkToClipboardUtil();
        copyLinkStatus = ok
            ? "Link copied."
            : "Couldn't copy automatically — please copy the address bar URL.";
    }

    // ICS Event time (persistent, default midday)
    let icsEventTime = loadIcsEventTime();
    $: if (icsEventTime) saveIcsEventTime(icsEventTime);

    /**
     * Print the calendar (rendering all months if needed)
     */
    async function handlePrint() {
        // Facebook/Messenger iOS in-app browsers frequently block print dialogs.
        if (isFacebookInAppBrowser) {
            capturePosthog("print_blocked", { reason: "in_app_browser" });
            printUnsupportedOpen = true;
            return;
        }
        renderPrintAllMonths = true;
        await tick();
        try {
            capturePosthog("print_attempt", {
                payments_count: payments.length,
            });
            window.print();
        } catch {
            capturePosthog("print_failed");
            printUnsupportedOpen = true;
        }
    }

    // --- Print event listeners and Facebook in-app browser detection ---
    onMount(() => {
        isFacebookInAppBrowser = detectFacebookInAppBrowserFromWindow();

        const onBeforePrint = () => {
            renderPrintAllMonths = true;
        };
        const onAfterPrint = () => {
            renderPrintAllMonths = false;
        };

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

    // Local drafts so we only commit/persist on blur.
    let icsEventNameDraft = "";
    let icsCategoryDraft = "";
    let icsColorDraft = "";
    let isEditingIcsEventName = false;
    let isEditingIcsCategory = false;
    let isEditingIcsColorText = false;

    $: if (!isEditingIcsEventName) icsEventNameDraft = icsEventName;
    $: if (!isEditingIcsCategory) icsCategoryDraft = icsCategory;
    $: if (!isEditingIcsColorText) icsColorDraft = icsColor;

    let allMonths: Array<{ month: number; year: number }> = [];
    let focusedIndex = -1;
    let visibleMonths: Array<{ month: number; year: number }> = [];
    let visibleRangeLabel = "";
    let fullRangeLabel = "";
    let canJumpToToday = false;
    const shortMonthName = (month: number) =>
        new Date(2000, month, 1).toLocaleDateString("en-GB", {
            month: "short",
        });

    let exportMenuOpen = false;
    let csvModalOpen = false;
    let icsModalOpen = false;
    let screenGridEl: HTMLDivElement | null = null;

    function openCsvModal() {
        exportMenuOpen = false;
        csvModalOpen = true;
    }

    function openIcsModal() {
        exportMenuOpen = false;
        icsModalOpen = true;
    }

    function handleExportCsv() {
        capturePosthog("export_csv", {
            payments_count: payments.length,
            date_format: csvDateFormat,
        });
        exportCSV(payments, result, csvDateFormat);
        csvModalOpen = false;
    }

    function handleExportIcs() {
        capturePosthog("export_ics", {
            payments_count: payments.length,
            alarm_enabled: reminderSettings.alarmEnabled,
            alarm_days_before: reminderSettings.daysBefore,
            event_time: icsEventTime,
        });
        generateICS(payments, result, {
            csvDateFormat,
            icsEventName,
            icsCategory,
            icsColor,
            icsAlarmEnabled: reminderSettings.alarmEnabled,
            icsAlarmDaysBefore: reminderSettings.daysBefore,
            icsEventTime,
        });
        icsModalOpen = false;
    }

    function openReminderDialog() {
        reminderDialogOpen = true;
    }

    function handleReminderDialogSave(e: CustomEvent<IcsReminderSettings>) {
        reminderSettings = e.detail;
        saveIcsReminderSettings(reminderSettings);
    }

    function handlePreviousMonth() {
        if (focusedIndex > 0) {
            const targetIndex = Math.max(0, focusedIndex - navStep);
            const prev = allMonths[targetIndex];
            currentMonth = prev.month;
            currentYear = prev.year;
            return;
        }

        // Fallback (should rarely be hit)
        const newMonth = previousMonth(currentMonth, currentYear);
        currentMonth = newMonth.month;
        currentYear = newMonth.year;
    }

    function handleNextMonth() {
        if (focusedIndex !== -1 && focusedIndex + navStep < allMonths.length) {
            const targetIndex = focusedIndex + navStep;
            const next = allMonths[targetIndex];
            currentMonth = next.month;
            currentYear = next.year;
            return;
        }

        // At end of generated range: auto-extend by 1 year and regenerate.
        extendRangeByOneYear();
    }

    /**
     * Get all months from first to last payment
     */
    function getAllMonthsToDisplay(): Array<{ month: number; year: number }> {
        if (payments.length === 0) return [];

        const first = new Date(payments[0].paid + "T00:00:00Z");
        const last = new Date(payments[payments.length - 1].paid + "T00:00:00Z");

        const months: Array<{ month: number; year: number }> = [];
        let current = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));

        while (current <= last) {
            months.push({
                month: current.getUTCMonth(),
                year: current.getUTCFullYear(),
            });
            current.setUTCMonth(current.getUTCMonth() + 1);
        }

        return months;
    }

    $: allMonths = getAllMonthsToDisplay();
    $: focusedIndex = allMonths.findIndex(
        (m) => m.year === currentYear && m.month === currentMonth
    );
    $: {
        const idx = focusedIndex === -1 ? 0 : focusedIndex;
        const maxStart = Math.max(0, allMonths.length - pageSize);
        const start = Math.min(Math.max(0, idx), maxStart);
        visibleMonths = allMonths.slice(start, start + pageSize);
    }
    $: {
        if (!visibleMonths.length) {
            visibleRangeLabel = "";
        } else {
            const first = visibleMonths[0];
            const last = visibleMonths[visibleMonths.length - 1];
            const fmt = (m: { month: number; year: number }) =>
                `${shortMonthName(m.month)} ${m.year}`;
            visibleRangeLabel =
                first.month === last.month && first.year === last.year
                    ? fmt(first)
                    : `${fmt(first)} – ${fmt(last)}`;
        }
    }
    $: {
        if (!allMonths.length) {
            fullRangeLabel = "";
        } else {
            const first = allMonths[0];
            const last = allMonths[allMonths.length - 1];
            const fmt = (m: { month: number; year: number }) =>
                `${shortMonthName(m.month)} ${m.year}`;
            fullRangeLabel =
                first.month === last.month && first.year === last.year
                    ? fmt(first)
                    : `${fmt(first)} – ${fmt(last)}`;
        }
    }
    $: {
        const now = new Date();
        const todayMonth = now.getUTCMonth();
        const todayYear = now.getUTCFullYear();
        canJumpToToday = allMonths.some(
            (m) => m.month === todayMonth && m.year === todayYear
        );
    }

    function handleJumpToToday() {
        if (!canJumpToToday) return;
        const now = new Date();
        const todayMonth = now.getUTCMonth();
        const todayYear = now.getUTCFullYear();
        currentMonth = todayMonth;
        currentYear = todayYear;
        capturePosthog("calendar_jump_today", {
            month: todayMonth + 1,
            year: todayYear,
        });
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
            const fullyVisible = rect.top >= 0 && rect.bottom <= viewportHeight;
            if (fullyVisible) return;

            monthNode.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
            });
        });
    }
</script>

<div class="space-y-3">
    <div class="w-full calendar-controls">
        <div
            class="bg-white/95 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-3 space-y-3"
        >
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-center sm:text-left">
                    <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Payment calendar
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {payments.length} payments · {fullRangeLabel}
                    </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <Button
                        id="export-menu"
                        color="light"
                        class="px-2.5 py-2 text-xs min-[390px]:text-sm"
                        title="Export"
                        aria-label="Export"
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
                                <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2h16v-2" />
                            </svg>
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
                            onclick={openCsvModal}>Download spreadsheet (CSV)</DropdownItem
                        >
                        <DropdownItem
                            class="text-gray-700 dark:text-gray-100"
                            onclick={openIcsModal}>Add to calendar (ICS)</DropdownItem
                        >
                    </Dropdown>
                    <Button
                        onclick={handlePrint}
                        color="light"
                        class="px-2.5 py-2 text-xs min-[390px]:text-sm"
                        title="Print calendar"
                        aria-label="Print calendar"
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
                                <path d="M6 9V3h12v6M6 18h12v3H6zM6 14H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1" />
                            </svg>
                            <span>Print</span>
                        </span>
                    </Button>
                </div>
            </div>

            <div class="flex flex-wrap items-end gap-3">
                <div>
                    <Label
                        for="start-year"
                        class="block mb-1 text-xs min-[390px]:text-sm text-gray-700 dark:text-gray-300"
                    >
                        Start year
                    </Label>
                    <Select
                        id="start-year"
                        bind:value={startYearSelect}
                        oninput={applyStartYear}
                        onchange={applyStartYear}
                        class="w-24"
                        classes={{
                            select: "text-xs min-[390px]:text-sm !h-8 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                        }}
                    >
                        {#each years as year}
                            <option value={String(year)}>{year}</option>
                        {/each}
                    </Select>
                </div>
                <div>
                    <Label
                        for="number-of-years"
                        class="block mb-1 text-xs min-[390px]:text-sm text-gray-700 dark:text-gray-300"
                    >
                        Duration
                    </Label>
                    <Select
                        id="number-of-years"
                        bind:value={numberOfYearsInput}
                        oninput={applyNumberOfYears}
                        onchange={applyNumberOfYears}
                        class="w-24"
                        classes={{
                            select: "text-xs min-[390px]:text-sm !h-8 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                        }}
                    >
                        {#each Array.from({ length: 50 }, (_, i) => i + 1) as y}
                            <option value={String(y)}>{y} years</option>
                        {/each}
                    </Select>
                </div>
            </div>

            <div class="flex flex-wrap gap-4 items-center">
                <Label class="flex items-center gap-2 cursor-pointer text-xs min-[390px]:text-sm">
                    <FlowbiteCheckbox
                        bind:checked={showBankHolidays}
                        onchange={() => onPersist?.()}
                    />
                    <span>UK holidays</span>
                </Label>
                <div class="flex flex-wrap items-center gap-2">
                    <Label class="flex items-center gap-2 cursor-pointer text-xs min-[390px]:text-sm">
                        <FlowbiteCheckbox
                            checked={selectedCountry !== "none"}
                            onchange={(e: Event) => {
                                const target = e.target as HTMLInputElement;
                                if (target.checked && selectedCountry === "none") {
                                    const countryToUse =
                                        detectedCountry !== "none" ? detectedCountry : "FR";
                                    selectedCountry = countryToUse;
                                    onCountryChange?.(countryToUse);
                                } else if (!target.checked) {
                                    selectedCountry = "none";
                                    onCountryChange?.("none");
                                }
                                onPersist?.();
                            }}
                        />
                        <span>Additional holidays</span>
                    </Label>
                    {#if selectedCountry !== "none"}
                        <Select
                            id="country-holidays"
                            bind:value={selectedCountry}
                            onchange={() => {
                                onCountryChange?.(selectedCountry);
                                onPersist?.();
                            }}
                            class="w-40"
                            classes={{
                                select: "text-xs min-[390px]:text-sm !h-8 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                            }}
                        >
                            <option value="GB-SCT">Scotland</option>
                            <option value="GB-NIR">Northern Ireland</option>
                            <option value="FR">France</option>
                            <option value="DE">Germany</option>
                            <option value="ES">Spain</option>
                            <option value="IT">Italy</option>
                            <option value="NL">Netherlands</option>
                            <option value="BE">Belgium</option>
                            <option value="AT">Austria</option>
                            <option value="PT">Portugal</option>
                            <option value="IE">Ireland</option>
                            <option value="SE">Sweden</option>
                            <option value="DK">Denmark</option>
                            <option value="NO">Norway</option>
                            <option value="CH">Switzerland</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                            <option value="NZ">New Zealand</option>
                            <option value="JP">Japan</option>
                        </Select>
                    {/if}
                </div>
            </div>
            {#if selectedCountry !== "none" && isLoadingAdditionalHolidays}
                <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400" role="status">
                    Loading additional holidays...
                </p>
            {:else if selectedCountry !== "none" && additionalHolidaysError}
                <p class="text-xs min-[390px]:text-sm text-amber-700 dark:text-amber-300" role="alert">
                    {additionalHolidaysError}
                </p>
            {/if}
        </div>
    </div>

    <!-- --- CSV Export Modal --- -->
    <Modal title="Download spreadsheet (CSV)" bind:open={csvModalOpen} size="md">
        <div class="space-y-4">
            <div>
                <Label for="csv-format" class="block mb-2 text-sm">Date format</Label>
                <Select
                    id="csv-format"
                    bind:value={csvDateFormat}
                    onchange={() => onPersist?.()}
                    class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {#each DATE_FORMAT_OPTIONS as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </Select>
                <p class="mt-1 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
                    Best for Excel or Google Sheets.
                </p>
            </div>

            <div class="flex gap-2 justify-end">
                <Button color="light" onclick={() => (csvModalOpen = false)}>Cancel</Button>
                <Button color="blue" onclick={handleExportCsv}>Download CSV</Button>
            </div>
        </div>
    </Modal>

    <!-- --- ICS Export Modal --- -->
    <Modal title="Add to calendar (ICS)" bind:open={icsModalOpen} size="md">
        <div class="space-y-4">
            <div>
                <Label for="ics-name" class="block mb-2 text-sm">Event name</Label>
                <Input
                    id="ics-name"
                    bind:value={icsEventNameDraft}
                    onfocus={() => {
                        isEditingIcsEventName = true;
                    }}
                    onblur={() => {
                        isEditingIcsEventName = false;
                        icsEventName = icsEventNameDraft;
                        onPersist?.();
                    }}
                    class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>
            <div>
                <Label for="ics-category" class="block mb-2 text-sm">Category</Label>
                <Input
                    id="ics-category"
                    bind:value={icsCategoryDraft}
                    onfocus={() => {
                        isEditingIcsCategory = true;
                    }}
                    onblur={() => {
                        isEditingIcsCategory = false;
                        icsCategory = icsCategoryDraft;
                        onPersist?.();
                    }}
                    class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p class="mt-1 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
                    Some calendar apps ignore categories or don’t display them.
                </p>
            </div>
            <div>
                <Label for="ics-event-time" class="block mb-2 text-sm">Event time</Label>
                <Input
                    id="ics-event-time"
                    type="time"
                    bind:value={icsEventTime}
                    class="w-28 mb-4"
                />
            </div>
            <div>
                <Label class="block mb-2 text-sm">Colour</Label>
                <div class="flex gap-3 items-center">
                    <input
                        id="ics-color"
                        type="color"
                        bind:value={icsColor}
                        onchange={() => onPersist?.()}
                        class="h-12 w-24 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <Input
                        type="text"
                        bind:value={icsColorDraft}
                        onfocus={() => {
                            isEditingIcsColorText = true;
                        }}
                        onblur={() => {
                            isEditingIcsColorText = false;
                            icsColor = icsColorDraft;
                            onPersist?.();
                        }}
                        class="flex-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="#22c55e"
                    />
                </div>
                <p class="mt-1 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
                    Best-effort: Apple Calendar may use this; Google Calendar often ignores event
                    colour from ICS imports.
                </p>
            </div>
            <div>
                <Button color="light" onclick={openReminderDialog}>Reminder settings</Button>
                {#if reminderSettings.alarmEnabled}
                    <span class="ml-2 text-xs min-[390px]:text-sm text-green-600 dark:text-green-400"
                        >Reminder: {reminderSettings.daysBefore} day(s) before</span
                    >
                {/if}
            </div>
            <div class="flex gap-2 justify-end">
                <Button color="light" onclick={() => (icsModalOpen = false)}>Cancel</Button>
                <Button color="blue" onclick={handleExportIcs}>Download ICS</Button>
            </div>
        </div>
    </Modal>

    <IcsReminderDialog
        bind:open={reminderDialogOpen}
        alarmEnabled={reminderSettings.alarmEnabled}
        daysBefore={reminderSettings.daysBefore}
        on:save={handleReminderDialogSave}
        on:close={() => (reminderDialogOpen = false)}
    />

    <CalendarPager
        {visibleRangeLabel}
        {canJumpToToday}
        canGoPrevious={focusedIndex > 0}
        canGoNext={focusedIndex !== -1 && focusedIndex < allMonths.length - 1}
        onPrevious={handlePreviousMonth}
        onNext={handleNextMonth}
        onToday={handleJumpToToday}
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
