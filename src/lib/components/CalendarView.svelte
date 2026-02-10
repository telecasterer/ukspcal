<script lang="ts">
    // CalendarView.svelte: Renders the multi-month calendar, export, and print controls
    import {
        Button,
        Dropdown,
        DropdownItem,
        Label,
        Modal,
        Input,
        Select,
    } from "flowbite-svelte";
    import {
        monthName,
        previousMonth,
        nextMonth,
    } from "$lib/utils/calendarHelpers";
    import CalendarMonth from "./CalendarMonth.svelte";
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
    import {
        loadIcsEventTime,
        saveIcsEventTime,
    } from "$lib/utils/icsEventTimePersistence";
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "$lib/utils/clipboard";
    import {
        DATE_FORMAT_OPTIONS,
        type DateFormat,
    } from "$lib/utils/dateFormatting";
    import { detectFacebookInAppBrowserFromWindow } from "$lib/utils/inAppBrowser";
    import { capturePosthog } from "$lib/utils/posthog";
    import { onMount, tick } from "svelte";

    // --- Constants ---
    const pageSize = 6; // Number of months to show at once
    const navStep = 3; // How many months to jump on navigation

    // --- Props ---
    export let result: PensionResult;
    export let payments: Payment[];
    export let bankHolidays: Record<string, string>;
    export let showWeekends: boolean;
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
    export let selectedCountry: string;
    export let additionalHolidays: Record<string, string>;
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

    let rangeLabel = "";
    $: {
        if (!payments?.length) {
            rangeLabel = "";
        } else {
            const first = new Date(payments[0].paid + "T00:00:00Z");
            const last = new Date(
                payments[payments.length - 1].paid + "T00:00:00Z"
            );
            const fmt = (d: Date) =>
                d.toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                });
            rangeLabel = `${fmt(first)} - ${fmt(last)}`;
        }
    }

    let allMonths: Array<{ month: number; year: number }> = [];
    let focusedIndex = -1;
    let visibleMonths: Array<{ month: number; year: number }> = [];

    let exportMenuOpen = false;
    let csvModalOpen = false;
    let icsModalOpen = false;

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
        if (focusedIndex !== -1 && focusedIndex < allMonths.length - 1) {
            const targetIndex = Math.min(
                allMonths.length - 1,
                focusedIndex + navStep
            );
            const next = allMonths[targetIndex];
            currentMonth = next.month;
            currentYear = next.year;
            return;
        }

        // Fallback (should rarely be hit)
        const newMonth = nextMonth(currentMonth, currentYear);
        currentMonth = newMonth.month;
        currentYear = newMonth.year;
    }

    /**
     * Get all months from first to last payment
     */
    function getAllMonthsToDisplay(): Array<{ month: number; year: number }> {
        if (payments.length === 0) return [];

        const first = new Date(payments[0].paid + "T00:00:00Z");
        const last = new Date(
            payments[payments.length - 1].paid + "T00:00:00Z"
        );

        const months: Array<{ month: number; year: number }> = [];
        let current = new Date(
            Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1)
        );

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
</script>

<div class="space-y-2">
    <!-- --- Header: Title and Export/Print --- -->
    <div class="w-full calendar-controls">
        <div
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
        >
            <div
                class="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between"
            >
                <div class="text-center sm:text-left">
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white mb-1"
                    >
                        Payment calendar
                    </h3>
                    <div class="text-sm text-gray-600 dark:text-gray-300">
                        Viewing {monthName(currentMonth)}
                        {currentYear} · {payments.length} payments{#if rangeLabel}
                            · {rangeLabel}{/if}
                    </div>
                </div>

                <!-- Export/Print buttons -->
                <div class="flex flex-col items-center sm:items-end gap-1">
                    <div class="flex items-center gap-2">
                        <!-- Export menu -->
                        <Button
                            id="export-menu"
                            color="light"
                            class="px-3 py-2 text-sm"
                            title="Export"
                        >
                            ⬇️ Export
                        </Button>
                        <Dropdown
                            triggeredBy="#export-menu"
                            bind:isOpen={exportMenuOpen}
                            class="z-50 border border-gray-200 dark:border-gray-600 dark:!bg-gray-600"
                        >
                            <DropdownItem
                                class="text-gray-700 dark:text-gray-100"
                                onclick={openCsvModal}
                                >Download spreadsheet (CSV)</DropdownItem
                            >
                            <DropdownItem
                                class="text-gray-700 dark:text-gray-100"
                                onclick={openIcsModal}
                                >Add to calendar (ICS)</DropdownItem
                            >
                        </Dropdown>

                        <!-- Print button -->
                        <Button
                            onclick={handlePrint}
                            color="light"
                            class="px-3 py-2 text-sm"
                            title="Print calendar"
                        >
                            🖨️ Print
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- --- View Range and Display Filters --- -->
    <div class="w-full calendar-controls">
        <div
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2"
        >
            <!-- View Range Controls -->
            <div class="grid grid-cols-3 gap-1 items-start">
                <div>
                    <Label
                        for="start-year"
                        class="block mb-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                        Start Year
                    </Label>
                    <Select
                        id="start-year"
                        bind:value={startYearSelect}
                        oninput={applyStartYear}
                        onchange={applyStartYear}
                        class="w-20"
                        classes={{
                            select: "text-xs !h-8 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white",
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
                        class="block mb-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                        Duration (years)
                    </Label>
                    <Select
                        id="number-of-years"
                        bind:value={numberOfYearsInput}
                        oninput={applyNumberOfYears}
                        onchange={applyNumberOfYears}
                        class="w-20"
                        classes={{
                            select: "text-xs !h-8 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                        }}
                    >
                        {#each Array.from({ length: 50 }, (_, i) => i + 1) as y}
                            <option value={String(y)}>{y}</option>
                        {/each}
                    </Select>
                </div>

                <div>
                    <Label
                        for="payments-count"
                        class="block mb-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                        Payments
                    </Label>
                    <div
                        class="px-2.5 h-8 flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-900 dark:text-white w-20"
                    >
                        {payments.length}
                    </div>
                </div>
            </div>

            <!-- Weekends and Holidays filters -->
            <div class="flex flex-wrap gap-4 items-center">
                <Label class="flex items-center gap-2 cursor-pointer text-sm">
                    <FlowbiteCheckbox
                        bind:checked={showWeekends}
                        onchange={() => onPersist?.()}
                    />
                    <span>Weekends</span>
                </Label>
                <Label class="flex items-center gap-2 cursor-pointer text-sm">
                    <FlowbiteCheckbox
                        bind:checked={showBankHolidays}
                        onchange={() => onPersist?.()}
                    />
                    <span>UK Holidays</span>
                </Label>
                <div class="flex items-center gap-2">
                    <Label
                        class="flex items-center gap-2 cursor-pointer text-sm"
                    >
                        <FlowbiteCheckbox
                            checked={selectedCountry !== "none"}
                            onchange={(e: Event) => {
                                const target = e.target as HTMLInputElement;
                                if (
                                    target.checked &&
                                    selectedCountry === "none"
                                ) {
                                    const countryToUse =
                                        detectedCountry !== "none"
                                            ? detectedCountry
                                            : "FR";
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
                            class="w-24"
                            classes={{
                                select: "text-xs !h-8 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                            }}
                        >
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
        </div>
    </div>

    <!-- --- Month Navigation --- -->
    <div class="w-full calendar-controls">
        <div
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
        >
            <div class="flex items-center justify-center gap-4">
                <!-- Previous month button -->
                <Button
                    onclick={handlePreviousMonth}
                    color="light"
                    class="px-3 py-2"
                    disabled={focusedIndex <= 0}
                >
                    ← Previous
                </Button>

                <!-- Current month display -->
                <div class="text-center min-w-[120px]">
                    <div class="font-semibold text-gray-900 dark:text-white">
                        {monthName(currentMonth)}
                        {currentYear}
                    </div>
                </div>

                <!-- Next month button -->
                <Button
                    onclick={handleNextMonth}
                    color="light"
                    class="px-3 py-2"
                    disabled={focusedIndex === -1 ||
                        focusedIndex >= allMonths.length - 1}
                >
                    Next →
                </Button>
            </div>
        </div>
    </div>

    <!-- --- CSV Export Modal --- -->
    <Modal
        title="Download spreadsheet (CSV)"
        bind:open={csvModalOpen}
        size="md"
    >
        <div class="space-y-4">
            <div>
                <Label for="csv-format" class="block mb-2 text-sm"
                    >Date format</Label
                >
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
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Best for Excel or Google Sheets.
                </p>
            </div>

            <div class="flex gap-2 justify-end">
                <Button color="light" onclick={() => (csvModalOpen = false)}
                    >Cancel</Button
                >
                <Button color="blue" onclick={handleExportCsv}
                    >Download CSV</Button
                >
            </div>
        </div>
    </Modal>

    <!-- --- ICS Export Modal --- -->
    <Modal title="Add to calendar (ICS)" bind:open={icsModalOpen} size="md">
        <div class="space-y-4">
            <div>
                <Label for="ics-name" class="block mb-2 text-sm"
                    >Event name</Label
                >
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
                <Label for="ics-category" class="block mb-2 text-sm"
                    >Category</Label
                >
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
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Some calendar apps ignore categories or don’t display them.
                </p>
            </div>
            <div>
                <Label for="ics-event-time" class="block mb-2 text-sm"
                    >Event time</Label
                >
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
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Best-effort: Apple Calendar may use this; Google Calendar
                    often ignores event colour from ICS imports.
                </p>
            </div>
            <div>
                <Button color="light" onclick={openReminderDialog}
                    >Reminder settings</Button
                >
                {#if reminderSettings.alarmEnabled}
                    <span
                        class="ml-2 text-xs text-green-600 dark:text-green-400"
                        >Reminder: {reminderSettings.daysBefore} day(s) before</span
                    >
                {/if}
            </div>
            <div class="flex gap-2 justify-end">
                <Button color="light" onclick={() => (icsModalOpen = false)}
                    >Cancel</Button
                >
                <Button color="blue" onclick={handleExportIcs}
                    >Download ICS</Button
                >
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

    <!-- --- Multiple Month Calendar Grid (screen) --- -->
    {#if !renderPrintAllMonths}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full calendar-grid screen-only"
        >
            {#each visibleMonths as monthData (monthData.year * 12 + monthData.month)}
                <CalendarMonth
                    year={monthData.year}
                    month={monthData.month}
                    {showWeekends}
                    {showBankHolidays}
                    {payments}
                    {bankHolidays}
                    {additionalHolidays}
                    {selectedCountry}
                />
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
                    {showWeekends}
                    {showBankHolidays}
                    {payments}
                    {bankHolidays}
                    {additionalHolidays}
                    {selectedCountry}
                />
            {/each}
        </div>
    {/if}

    <!-- --- Print Unsupported Modal (Facebook in-app browser) --- -->
    <Modal
        title="Printing not available"
        bind:open={printUnsupportedOpen}
        size="md"
    >
        <div class="space-y-3">
            <p class="text-sm text-gray-700 dark:text-gray-200">
                The Facebook/Messenger in-app browser often blocks the system
                print dialog.
            </p>
            <p class="text-sm text-gray-700 dark:text-gray-200">
                For printing, open this page in Safari/Chrome ("Open in
                browser") and try again.
            </p>
            <div class="flex items-center gap-2 justify-end">
                <Button color="light" onclick={() => copyLinkToClipboard()}
                    >Copy link</Button
                >
                <Button
                    color="blue"
                    onclick={() => (printUnsupportedOpen = false)}>OK</Button
                >
            </div>
            {#if copyLinkStatus}
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    {copyLinkStatus}
                </p>
            {/if}
        </div>
    </Modal>
</div>
