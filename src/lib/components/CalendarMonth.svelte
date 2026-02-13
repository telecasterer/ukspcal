<script lang="ts">
    // CalendarMonth.svelte: Renders a single month grid with payment and holiday highlights
    import {
        generateCalendarDays,
        monthName,
    } from "$lib/utils/calendarHelpers";
    import { getFlagSvg } from "$lib/utils/countryFlags";
    import type { Payment } from "$lib/pensionEngine";

    // --- Props ---
    type Props = {
        year: number;
        month: number;
        showBankHolidays: boolean;
        payments: Payment[];
        bankHolidays: Record<string, string>;
        additionalHolidays?: Record<string, string>;
        selectedCountry?: string;
    };
    let {
        year,
        month,
        showBankHolidays,
        payments,
        bankHolidays,
        additionalHolidays = {},
        selectedCountry = "none",
    }: Props = $props();

    // --- Derived: Map of paid date to Payment ---
    const paymentsByPaid = $derived.by(() => {
        const map = new Map<string, Payment>();
        for (const p of payments) map.set(p.paid, p);
        return map;
    });

    /**
     * Get payment for a given day of this month (if any)
     */
    function getPaymentForDate(day: number): Payment | null {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return paymentsByPaid.get(dateStr) ?? null;
    }

    /**
     * Get bank holiday name for a given day (if any)
     */
    function getBankHolidayForDate(day: number): string | null {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return bankHolidays[dateStr] || null;
    }

    /**
     * Get additional country holiday name for a given day (if any)
     */
    function getAdditionalHolidayForDate(day: number): string | null {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return additionalHolidays[dateStr] || null;
    }

    /**
     * True if the given day is a weekend (UTC)
     */
    function isWeekendDay(day: number): boolean {
        const date = new Date(Date.UTC(year, month, day));
        const dow = date.getUTCDay();
        return dow === 0 || dow === 6;
    }

    // --- Calendar grid for this month (array of day numbers/nulls) ---
    const calendarDays = $derived(generateCalendarDays(year, month));

    // --- Derived: flag svg for selected country ---
    const flagSvg = $derived.by(() =>
        selectedCountry !== "none" ? getFlagSvg(selectedCountry) : ""
    );

    /**
     * Compute extra CSS classes for a calendar day cell
     */
    function getDayExtraClasses(
        day: number | null,
        weekend: boolean,
        payment: Payment | null,
        holiday: string | null,
        additionalHoliday: string | null
    ): string {
        return [
            !day ? "empty" : "",
            weekend && day && !payment && !holiday ? "weekend" : "",
            payment && !payment.early ? "payment" : "",
            payment?.early ? "early-payment" : "",
            holiday && !payment ? "holiday" : "",
            additionalHoliday && !payment && !holiday
                ? "additional-holiday"
                : "",
        ]
            .filter(Boolean)
            .join(" ");
    }
</script>

<div
    class="calendar-month bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
>
    <!-- Month Header -->
    <div
        class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3"
    >
        <h4 class="text-center font-bold text-gray-900 dark:text-white">
            {monthName(month)}
            {year}
        </h4>
    </div>

    <!-- Day Headers -->
    <div
        class="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
    >
        {#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as day}
            <div
                class="p-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
                {day}
            </div>
        {/each}
    </div>

    <!-- Calendar Days -->
    <div class="grid grid-cols-7">
        {#each calendarDays as day}
            {@const payment = day ? getPaymentForDate(day) : null}
            {@const holiday = day ? getBankHolidayForDate(day) : null}
            {@const additionalHoliday = day
                ? getAdditionalHolidayForDate(day)
                : null}
            {@const weekend = day ? isWeekendDay(day) : false}

            <!-- Calendar day cell: highlights payment, early, holiday, weekend -->
            <div
                class={`calendar-day relative aspect-square border border-gray-200 dark:border-gray-600 p-2 flex flex-col justify-between bg-white dark:bg-gray-800 hover:ring-2 hover:ring-blue-400 transition overflow-hidden ${getDayExtraClasses(day, weekend, payment, holiday, additionalHoliday)}`}
                title={holiday && !payment
                    ? holiday
                    : additionalHoliday
                      ? additionalHoliday
                      : undefined}
            >
                {#if day}
                    <div class="flex items-start">
                        <div class="text-sm font-semibold min-w-[1.25rem] flex-shrink-0">{day}</div>
                    </div>
                    {#if additionalHoliday && !payment && flagSvg}
                        <img
                            src={flagSvg}
                            alt={`${selectedCountry} flag`}
                            class="absolute top-1 right-1 pointer-events-none"
                            title={additionalHoliday}
                            style="width:clamp(0.8rem,25%,1.6rem); height:auto;"
                        />
                    {/if}
                {/if}
            </div>
        {/each}
    </div>

    <!-- Month Legend -->
    <div
        class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 space-y-1"
    >
        <div class="flex flex-wrap gap-2 justify-center">
            <span class="inline-flex items-center gap-1">
                <span class="w-3 h-3 rounded legend-item payment"></span>
                <span>Payment</span>
            </span>
            <span class="inline-flex items-center gap-1">
                <span class="w-3 h-3 rounded legend-item early-payment"></span>
                <span>Early</span>
            </span>
            <span class="inline-flex items-center gap-1">
                <span class="w-3 h-3 rounded legend-item holiday"></span>
                <span>UK-Holiday</span>
            </span>
            <span class="inline-flex items-center gap-1">
                <span
                    class="w-3 h-3 rounded legend-item weekend border border-gray-300"
                ></span>
                <span>Weekend</span>
            </span>
            {#if selectedCountry !== "none"}
                <span class="inline-flex items-center gap-1">
                    {#if flagSvg}
                        <img
                            src={flagSvg}
                            alt={`${selectedCountry} flag`}
                            class="w-4 h-4"
                        />
                    {/if}
                    <span>{selectedCountry}-Holiday</span>
                </span>
            {/if}
        </div>
    </div>
</div>
