<script lang="ts">
    import { generatePayments, type PensionResult, type Payment } from "$lib/pensionEngine";
    import { fetchUKBankHolidays } from "$lib/fetchBankHolidays";
    import { Button, Label, Input, Select, Card, Table, TableBody, TableHead, TableHeadCell, TableBodyCell, Alert, Tabs, TabItem, Checkbox, Accordion, AccordionItem, Navbar, NavBrand, NavUl, NavLi } from "flowbite-svelte";

    let ni = $state("");
    let startYear = $state(new Date().getFullYear());
    let endYear = $state(new Date().getFullYear() + 1);
    let cycleDays = $state<number>(28);
    let showWeekends = $state(true);
    let showBankHolidays = $state(true);
    let csvDateFormat = $state("dd/mm/yyyy");
    let icsEventName = $state("UK State Pension Payment");
    let icsCategory = $state("Finance");
    let icsColor = $state("#22c55e");
    let darkMode = $state(
        typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true'
    );
    
    let { data } = $props();

    const { bankHolidays } = $derived(data);

    let result: PensionResult | null = $state(null);
    let error = $state("");

    let currentCalendarMonth = $state(new Date().getMonth());
    let currentCalendarYear = $state(new Date().getFullYear());

    $effect.pre(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('darkMode', darkMode.toString());
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });

    function generate() {
        error = "";

        if (!/^\d{2}[A-D]$/i.test(ni)) {
            error = "NI code must be 2 digits followed by A–D (e.g. 22D)";
            result = null;
            return;
        }

        if (endYear < startYear) {
            error = "End year must be after start year";
            result = null;
            return;
        }

        result = generatePayments(ni, startYear, endYear, cycleDays, bankHolidays);
        
        // Reset calendar to first payment's month if available
        if (result && result.payments.length > 0) {
            const firstPayment = new Date(result.payments[0].paid + "T00:00:00Z");
            currentCalendarMonth = firstPayment.getUTCMonth();
            currentCalendarYear = firstPayment.getUTCFullYear();
        }
    }

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr + "T00:00:00Z");
        return date.toLocaleDateString("en-GB", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getDayName(dateStr: string): string {
        const date = new Date(dateStr + "T00:00:00Z");
        return date.toLocaleDateString("en-GB", { weekday: "long" });
    }

    // Calendar helpers
    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year: number, month: number): number {
        const dow = new Date(Date.UTC(year, month, 1)).getUTCDay();
        // Convert Sunday=0 to Monday=0 format
        return dow === 0 ? 6 : dow - 1;
    }

    function getPaymentForDate(year: number, month: number, day: number): Payment | null {
        if (!result) return null;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return result.payments.find(p => p.paid === dateStr) || null;
    }

    function getBankHolidayForDate(year: number, month: number, day: number): string | null {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return bankHolidays[dateStr] || null;
    }

    function isWeekend(day: number): boolean {
        const date = new Date(Date.UTC(currentCalendarYear, currentCalendarMonth, day));
        const dow = date.getUTCDay();
        return dow === 0 || dow === 6;
    }

    function monthName(month: number): string {
        return new Date(2000, month, 1).toLocaleDateString("en-GB", { month: "long" });
    }

    function previousMonth() {
        if (currentCalendarMonth === 0) {
            currentCalendarMonth = 11;
            currentCalendarYear--;
        } else {
            currentCalendarMonth--;
        }
    }

    function nextMonth() {
        if (currentCalendarMonth === 11) {
            currentCalendarMonth = 0;
            currentCalendarYear++;
        } else {
            currentCalendarMonth++;
        }
    }

    function generateCalendarDays() {
        const daysInMonth = getDaysInMonth(currentCalendarYear, currentCalendarMonth);
        const firstDay = getFirstDayOfMonth(currentCalendarYear, currentCalendarMonth);
        const days = [];

        // Empty cells before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    }

    function generateCalendarDaysForMonth(year: number, month: number): (number | null)[] {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty cells before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    }

    function getAllMonthsToDisplay(): Array<{ year: number; month: number }> {
        if (!result) return [];
        
        const months: Array<{ year: number; month: number }> = [];
        let year = currentCalendarYear;
        let month = currentCalendarMonth;
        
        // Get first payment date
        const firstPayment = new Date(result.payments[0].paid + "T00:00:00Z");
        const lastPayment = new Date(result.payments[result.payments.length - 1].paid + "T00:00:00Z");
        
        year = firstPayment.getUTCFullYear();
        month = firstPayment.getUTCMonth();
        
        const endYear = lastPayment.getUTCFullYear();
        const endMonth = lastPayment.getUTCMonth();
        
        while (year < endYear || (year === endYear && month <= endMonth)) {
            months.push({ year, month });
            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
        }
        
        return months;
    }

    function isWeekendForMonth(year: number, month: number, day: number): boolean {
        const date = new Date(Date.UTC(year, month, day));
        const dow = date.getUTCDay();
        return dow === 0 || dow === 6;
    }

    // Export helpers
    function formatDateForCSV(dateStr: string, format: string): string {
        const date = new Date(dateStr + "T00:00:00Z");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const monthName = date.toLocaleDateString("en-GB", { month: "short" });
        const monthFull = date.toLocaleDateString("en-GB", { month: "long" });
        const year = date.getUTCFullYear();
        const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
        const dayNameFull = date.toLocaleDateString("en-GB", { weekday: "long" });

        switch (format) {
            case "dd/mm/yyyy":
                return `${day}/${month}/${year}`;
            case "dd-mmm-yyyy":
                return `${day}-${monthName}-${year}`;
            case "yyyy-mm-dd":
                return `${year}-${month}-${day}`;
            case "mm/dd/yyyy":
                return `${month}/${day}/${year}`;
            case "ddd, d mmmm yyyy":
                return `${dayName}, ${day} ${monthFull} ${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    }

    function getPaymentStatus(payment: Payment): string {
        if (!payment.early) return "On Schedule";
        if (payment.holidays && payment.holidays.length > 0) {
            return `Early payment due to ${payment.holidays.join(", ")}`;
        }
        return "Early payment due to weekend";
    }

    function exportCSV() {
        if (!result) return;

        const headers = ["Date", "Day", "Status", "Notes"];
        const rows = result.payments.map(payment => [
            formatDateForCSV(payment.paid, csvDateFormat),
            getDayName(payment.paid),
            payment.early ? "Early" : "On Time",
            getPaymentStatus(payment)
        ]);

        const csv = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pension-schedule-${result.ni}-${new Date().getTime()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function generateICS() {
        if (!result) return;

        const standardPayments = result.payments.filter(p => !p.early);
        const earlyPayments = result.payments.filter(p => p.early);

        if (standardPayments.length === 0) return;

        const firstPayment = new Date(standardPayments[0].paid + "T00:00:00Z");
        const icsLines: string[] = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//UK Pension Calendar//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:UK Pension Payments",
            "X-WR-TIMEZONE:Europe/London",
            "X-WR-CALDESC:UK State Pension Payment Schedule"
        ];

        const uid = `pension-${result.ni}-${Date.now()}@ukspcal`;
        const startDate = firstPayment.toISOString().split("T")[0].replace(/-/g, "");
        const lastPayment = standardPayments[standardPayments.length - 1];
        const endDate = new Date(lastPayment.paid + "T00:00:00Z").toISOString().split("T")[0].replace(/-/g, "");

        const exdates = earlyPayments.map((p, pIdx) => {
            const date = new Date(p.paid + "T00:00:00Z");
            const nextIdx = result!.payments.indexOf(p) + 1;
            if (nextIdx < result!.payments.length) {
                const nextDate = new Date(result!.payments[nextIdx].paid + "T00:00:00Z");
                const originalDate = new Date(nextDate);
                originalDate.setUTCDate(originalDate.getUTCDate() - result!.cycleDays);
                return originalDate.toISOString().split("T")[0].replace(/-/g, "");
            }
            return null;
        }).filter(d => d !== null);

        icsLines.push(
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `DTSTART;VALUE=DATE:${startDate}`,
            `RRULE:FREQ=DAILY;INTERVAL=${result.cycleDays}`,
            ...exdates.map(date => `EXDATE;VALUE=DATE:${date}`),
            `SUMMARY:${icsEventName} (${result.ni})`,
            `DESCRIPTION:${icsEventName} for NI code ${result.ni}`,
            `CATEGORIES:${icsCategory}`,
            `COLOR:${icsColor}`,
            "TRANSP:TRANSPARENT",
            "END:VEVENT"
        );

        earlyPayments.forEach((payment, idx) => {
            const paymentDate = new Date(payment.paid + "T00:00:00Z");
            const date = paymentDate.toISOString().split("T")[0].replace(/-/g, "");
            const summary = payment.holidays?.length ? `${icsEventName} - Early (${payment.holidays.join(", ")})` : `${icsEventName} - Early (Weekend)`;

            icsLines.push(
                "BEGIN:VEVENT",
                `UID:${uid}-early-${idx}`,
                `DTSTART;VALUE=DATE:${date}`,
                `DTEND;VALUE=DATE:${date}`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${getPaymentStatus(payment)}`,
                `CATEGORIES:${icsCategory}`,
                `COLOR:${icsColor}`,
                "TRANSP:TRANSPARENT",
                "END:VEVENT"
            );
        });

        icsLines.push("END:VCALENDAR");
        const ics = icsLines.join("\r\n");

        const blob = new Blob([ics], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pension-schedule-${result.ni}-${new Date().getTime()}.ics`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function printCalendar() {
        window.print();
    }
</script>

<style>
    .calendar-day {
        @apply relative aspect-square border border-gray-200 dark:border-gray-600 p-2 flex flex-col justify-start;
        @apply bg-white dark:bg-gray-800 hover:ring-2 hover:ring-blue-400 transition;
        min-height: 80px;
    }
    .calendar-day.empty {
        @apply bg-gray-50 dark:bg-gray-900;
    }
    .calendar-day.weekend {
        @apply bg-gray-100 dark:bg-gray-900/50;
    }
    .calendar-day.payment {
        @apply bg-green-400 dark:bg-green-600 text-white font-bold;
    }
    .calendar-day.early-payment {
        @apply bg-amber-400 dark:bg-amber-600 text-white font-bold;
    }
    .calendar-day.holiday {
        @apply bg-blue-300 dark:bg-blue-700;
    }
    .day-number {
        @apply text-sm font-semibold;
    }
    .holiday-label {
        @apply text-xs mt-1 opacity-90;
    }
    /* Restore button styles */
    /* Custom button styles removed - using Flowbite Button component instead */
    .calendar-container {
        display: grid;
        gap: 1.5rem;
        width: 100%;
    }
    @media (min-width: 768px) {
        .calendar-container {
            grid-template-columns: repeat(1, 1fr);
        }
    }
    @media (min-width: 1024px) {
        .calendar-container {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (min-width: 1440px) {
        .calendar-container {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    /* Grid layout handled by Tailwind grid-cols-* classes */
    @media print {
        * {
            box-shadow: none !important;
            page-break-inside: avoid !important;
        }
        nav {
            display: none !important;
        }
        .input-section {
            display: none !important;
        }
        .summary-section {
            display: none !important;
        }
        .mb-8 {
            display: none !important;
        }
        /* Hide export card specifically */
        .space-y-6 > div:first-child {
            display: none !important;
        }
        .max-w-7xl {
            max-width: 100% !important;
        }
        .calendar-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
        }
        body, html {
            background: white !important;
        }
    }
</style>

<!-- Navigation -->
<Navbar class="border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
    <NavBrand href="#" class="text-2xl font-bold">
        <span class="text-blue-600 dark:text-blue-400">📅 Pension Calendar</span>
    </NavBrand>
    <NavUl class="ml-auto">
        <NavLi>
            <Button
                onclick={() => { darkMode = !darkMode; }}
                color="none"
                class="text-2xl p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Toggle dark mode"
            >
                {#if darkMode}
                    ☀️
                {:else}
                    🌙
                {/if}
            </Button>
        </NavLi>
    </NavUl>
</Navbar>

<!-- Main Content -->
<div class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
    <div class="max-w-7xl mx-auto">
        <div class="w-full">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">UK State Pension Payment Calendar</h1>
                <p class="text-lg text-gray-600 dark:text-gray-300">Calculate your pension payment schedule based on your NI code</p>
            </div>

            <!-- Input and Summary - Flex Layout -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 input-section">
                <!-- Input Card -->
                <Card class="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div class="p-6">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate Schedule</h2>
                        
                        <form onsubmit={(e) => { e.preventDefault(); generate(); }} class="space-y-3">
                            <div class="space-y-3">
                                <!-- NI Code Input -->
                                <div>
                                    <Label for="ni-code" class="block mb-1 text-sm">NI Code</Label>
                                    <Input
                                        id="ni-code"
                                        bind:value={ni}
                                        placeholder="e.g. 22D"
                                        autocomplete="off"
                                        class="uppercase text-sm"
                                    />
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 3 chars</p>
                                </div>

                                <!-- Start Year -->
                                <div>
                                    <Label for="start-year" class="block mb-1 text-sm">From Year</Label>
                                    <Input
                                        id="start-year"
                                        type="number"
                                        bind:value={startYear}
                                        class="text-sm"
                                    />
                                </div>

                                <!-- End Year -->
                                <div>
                                    <Label for="end-year" class="block mb-1 text-sm">To Year</Label>
                                    <Input
                                        id="end-year"
                                        type="number"
                                        bind:value={endYear}
                                        class="text-sm"
                                    />
                                </div>

                                <!-- Payment Cycle -->
                                <div>
                                    <Label for="cycle" class="block mb-1 text-sm">Cycle</Label>
                                    <Select id="cycle" bind:value={cycleDays} class="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value={28}>Every 28 days</option>
                                        <option value={14}>Every 14 days</option>
                                        <option value={7}>Every 7 days</option>
                                    </Select>
                                </div>

                                <!-- Submit Button -->
                                <Button type="submit" class="w-full" color="blue">
                                    Generate
                                </Button>
                            </div>
                        </form>

                        {#if error}
                            <Alert color="red" class="mt-4 dark:bg-red-900 dark:text-red-200 text-sm">
                                <span class="font-medium">Error:</span> {error}
                            </Alert>
                        {/if}
                    </div>
                </Card>

                <!-- Summary Card -->
                {#if result}
                    <Card class="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 summary-section">
                        <div class="p-6">
                            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h2>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="bg-blue-50 dark:bg-blue-900 p-2 rounded border border-blue-200 dark:border-blue-700">
                                    <p class="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase">NI Code</p>
                                    <p class="text-sm font-bold text-blue-700 dark:text-blue-100">{result.ni}</p>
                                </div>
                                <div class="bg-emerald-50 dark:bg-emerald-900 p-2 rounded border border-emerald-200 dark:border-emerald-700">
                                    <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase">Payment Day</p>
                                    <p class="text-sm font-bold text-emerald-700 dark:text-emerald-100">{result.normalDay}</p>
                                </div>
                                <div class="bg-violet-50 dark:bg-violet-900 p-2 rounded border border-violet-200 dark:border-violet-700">
                                    <p class="text-xs font-semibold text-violet-600 dark:text-violet-300 uppercase">Cycle</p>
                                    <p class="text-sm font-bold text-violet-700 dark:text-violet-100">{result.cycleDays}d</p>
                                </div>
                                <div class="bg-orange-50 dark:bg-orange-900 p-2 rounded border border-orange-200 dark:border-orange-700">
                                    <p class="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase">Payments</p>
                                    <p class="text-sm font-bold text-orange-700 dark:text-orange-100">{result.payments.length}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                {/if}
            </div>
            <!-- Results Section - Calendar Only -->
            {#if result}
                <div class="w-full space-y-6 max-w-5xl mx-auto">
                    <!-- Export Control Area - Using Accordion -->
                    <Accordion class="print:hidden max-w-2xl mx-auto w-full">
                        <AccordionItem>
                            <svelte:fragment slot="header">
                                📤 Export & Print
                            </svelte:fragment>
                            
                            <!-- CSV Options -->
                            <div class="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">CSV Export</h4>
                                <div class="space-y-3">
                                    <div>
                                        <Label for="csv-format" class="block mb-2 text-sm">Date Format</Label>
                                        <Select id="csv-format" bind:value={csvDateFormat} class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                                            <option value="dd-mmm-yyyy">dd-mmm-yyyy</option>
                                            <option value="yyyy-mm-dd">yyyy-mm-dd</option>
                                            <option value="mm/dd/yyyy">mm/dd/yyyy (US)</option>
                                            <option value="ddd, d mmmm yyyy">ddd, dd MMMM yyyy</option>
                                        </Select>
                                    </div>
                                    <Button onclick={exportCSV} class="w-full" color="blue">
                                        📥 Export as CSV
                                    </Button>
                                </div>
                            </div>

                            <!-- ICS Options -->
                            <div class="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Calendar Export (ICS)</h4>
                                <div class="space-y-4">
                                    <div>
                                        <Label for="ics-name" class="block mb-2 text-sm">Event Name</Label>
                                        <Input
                                            id="ics-name"
                                            bind:value={icsEventName}
                                            class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label for="ics-category" class="block mb-2 text-sm">Category</Label>
                                        <Input
                                            id="ics-category"
                                            bind:value={icsCategory}
                                            class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label class="block mb-2 text-sm">Color</Label>
                                        <div class="flex gap-3 items-center">
                                            <input
                                                id="ics-color"
                                                type="color"
                                                bind:value={icsColor}
                                                class="h-12 w-24 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                bind:value={icsColor}
                                                class="flex-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="#22c55e"
                                            />
                                        </div>
                                    </div>
                                    <Button onclick={generateICS} class="w-full" color="blue">
                                        📅 Export as ICS
                                    </Button>
                                </div>
                            </div>

                            <!-- Print -->
                            <Button onclick={printCalendar} class="w-full" color="blue">
                                🖨️ Print Calendar
                            </Button>
                        </AccordionItem>
                    </Accordion>

                    <!-- Calendar View -->
                    <div class="w-full">
                        <!-- Calendar Controls -->
                        <div class="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center gap-4">
                                <button onclick={previousMonth} class="btn-icon text-xl" aria-label="Previous month">
                                    ←
                                </button>
                                <h3 class="text-xl font-bold min-w-[180px] text-center">
                                    {monthName(currentCalendarMonth)} {currentCalendarYear}
                                </h3>
                                <button onclick={nextMonth} class="btn-icon text-xl" aria-label="Next month">
                                    →
                                </button>
                            </div>
                            <div class="flex flex-wrap gap-4">
                                <label class="flex items-center gap-2 cursor-pointer text-sm">
                                    <Checkbox bind:checked={showWeekends} />
                                    <span>Weekends</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer text-sm">
                                    <Checkbox bind:checked={showBankHolidays} />
                                    <span>Holidays</span>
                                </label>
                            </div>
                        </div>

                        <!-- Multiple Month Calendar Grid -->
                        <div class="calendar-container">
                            {#each getAllMonthsToDisplay() as monthData (monthData.year * 12 + monthData.month)}
                                {@const displayMonth = monthData.month}
                                {@const displayYear = monthData.year}
                                
                                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                    <!-- Month Header -->
                                    <div class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3">
                                        <h4 class="text-center font-bold text-gray-900 dark:text-white">
                                            {monthName(displayMonth)} {displayYear}
                                        </h4>
                                    </div>
                                    
                                    <!-- Day Headers -->
                                    <div class="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        {#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as day}
                                            <div class="p-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {day}
                                            </div>
                                        {/each}
                                    </div>

                                    <!-- Calendar Days -->
                                    <div class="grid grid-cols-7">
                                        {#each generateCalendarDaysForMonth(displayYear, displayMonth) as day}
                                            {@const payment = day ? getPaymentForDate(displayYear, displayMonth, day) : null}
                                            {@const holiday = day && showBankHolidays ? getBankHolidayForDate(displayYear, displayMonth, day) : null}
                                            {@const weekend = day ? isWeekendForMonth(displayYear, displayMonth, day) : false}
                                            
                                            <div class="calendar-day" 
                                                 class:empty={!day}
                                                 class:weekend={weekend && showWeekends && day && !payment && !holiday}
                                                 class:payment={payment && !payment.early}
                                                 class:early-payment={payment?.early}
                                                 class:holiday={holiday && !payment}>
                                                
                                                {#if day}
                                                    <div class="day-number">{day}</div>
                                                    {#if holiday && !payment}
                                                        <div class="holiday-label truncate" title={holiday}>
                                                            {holiday}
                                                        </div>
                                                    {/if}
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>

                                    <!-- Month Legend -->
                                    <div class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 space-y-1">
                                        <div class="flex flex-wrap gap-2 justify-center">
                                            <span class="inline-flex items-center gap-1">
                                                <span class="w-2 h-2 rounded bg-green-400 dark:bg-green-600"></span>
                                                <span>Payment</span>
                                            </span>
                                            <span class="inline-flex items-center gap-1">
                                                <span class="w-2 h-2 rounded bg-amber-400 dark:bg-amber-600"></span>
                                                <span>Early</span>
                                            </span>
                                            {#if showBankHolidays}
                                                <span class="inline-flex items-center gap-1">
                                                    <span class="w-2 h-2 rounded bg-blue-300 dark:bg-blue-700"></span>
                                                    <span>Holiday</span>
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

