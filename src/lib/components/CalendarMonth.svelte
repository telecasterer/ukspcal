<script lang="ts">
    // CalendarMonth.svelte: Renders a single month grid with payment and holiday highlights
    import {
        generateCalendarDays,
        monthName,
    } from "$lib/utils/calendarHelpers";
    import { getFlagSvg } from "$lib/utils/countryFlags";
    import type { Payment } from "$lib/pensionEngine";
    import { onMount } from "svelte";

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
    let monthEl: HTMLDivElement | null = null;
    let tooltipInfo = $state<{ dateLabel: string; items: string[] } | null>(
        null
    );
    let tooltipStyle = $state("");
    let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;
    let supportsHoverTooltip = $state(false);
    let hoverMediaQuery: MediaQueryList | null = null;

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
        const iso = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
        return paymentsByPaid.get(iso) ?? null;
    }

    function getIsoForDay(day: number): string {
        return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
    }

    function formatIsoForAria(iso: string): string {
        const date = new Date(iso + "T00:00:00Z");
        return date.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    /**
     * Get bank holiday name for a given day (if any)
     */
    function getBankHolidayForDate(day: number): string | null {
        const iso = getIsoForDay(day);
        return bankHolidays[iso] || null;
    }

    /**
     * Get additional country holiday name for a given day (if any)
     */
    function getAdditionalHolidayForDate(day: number): string | null {
        const iso = getIsoForDay(day);
        return additionalHolidays[iso] || null;
    }

    /**
     * True if the given day is a weekend (UTC)
     */
    function isWeekendDay(day: number): boolean {
        const date = new Date(Date.UTC(year, month, day));
        const dow = date.getUTCDay();
        return dow === 0 || dow === 6;
    }

    function buildDayAriaLabel(
        day: number | null,
        payment: Payment | null,
        holiday: string | null,
        additionalHoliday: string | null,
        weekend: boolean
    ): string {
        if (!day) return "Empty day";

        const iso = getIsoForDay(day);
        const parts: string[] = [formatIsoForAria(iso)];
        if (iso === todayIso) parts.push("Today.");

        if (payment) {
            if (payment.early && payment.paid !== payment.due) {
                parts.push(
                    `Early payment. Due ${formatIsoForAria(payment.due)}.`
                );
            } else {
                parts.push("Payment day.");
            }
        } else {
            if (holiday) parts.push(`UK bank holiday: ${holiday}.`);
            if (additionalHoliday) {
                parts.push(`${selectedCountryName} holiday: ${additionalHoliday}.`);
            }
            if (weekend) parts.push("Weekend.");
            if (!holiday && !additionalHoliday && !weekend) {
                parts.push("No payment or holiday.");
            }
        }

        return parts.join(" ");
    }

    // --- Calendar grid for this month (array of day numbers/nulls) ---
    const calendarDays = $derived(generateCalendarDays(year, month));

    // --- Derived: flag svg for selected country ---
    const flagSvg = $derived.by(() =>
        selectedCountry !== "none" ? getFlagSvg(selectedCountry) : ""
    );
    const countryCodeToName: Record<string, string> = {
        "GB-SCT": "Scotland",
        "GB-NIR": "Northern Ireland",
        FR: "France",
        DE: "Germany",
        ES: "Spain",
        IT: "Italy",
        NL: "Netherlands",
        BE: "Belgium",
        AT: "Austria",
        PT: "Portugal",
        IE: "Ireland",
        SE: "Sweden",
        DK: "Denmark",
        NO: "Norway",
        CH: "Switzerland",
        US: "United States",
        CA: "Canada",
        AU: "Australia",
        NZ: "New Zealand",
        JP: "Japan",
    };
    const selectedCountryName = $derived.by(
        () => countryCodeToName[selectedCountry] ?? selectedCountry
    );
    const todayIso = new Date().toISOString().slice(0, 10);
    const hasPaymentInMonth = $derived.by(() =>
        calendarDays.some((day) => {
            if (!day) return false;
            const payment = getPaymentForDate(day);
            return !!payment && !payment.early;
        })
    );
    const hasEarlyPaymentInMonth = $derived.by(() =>
        calendarDays.some((day) => {
            if (!day) return false;
            return !!getPaymentForDate(day)?.early;
        })
    );
    const hasHolidayInMonth = $derived.by(() => {
        if (!showBankHolidays) return false;
        return calendarDays.some((day) => {
            if (!day) return false;
            return !!getBankHolidayForDate(day) && !getPaymentForDate(day);
        });
    });
    const hasAdditionalHolidayInMonth = $derived.by(() => {
        if (selectedCountry === "none") return false;
        return calendarDays.some((day) => {
            if (!day) return false;
            const additionalHoliday = getAdditionalHolidayForDate(day);
            const holiday = showBankHolidays ? getBankHolidayForDate(day) : null;
            const payment = getPaymentForDate(day);
            return !!additionalHoliday && !holiday && !payment;
        });
    });
    const hasLegendItems = $derived(
        hasPaymentInMonth ||
            hasEarlyPaymentInMonth ||
            hasHolidayInMonth ||
            hasAdditionalHolidayInMonth
    );

    /**
     * Compute extra CSS classes for a calendar day cell
     */
    function getDayExtraClasses(
        day: number | null,
        isToday: boolean,
        weekend: boolean,
        payment: Payment | null,
        holiday: string | null,
        additionalHoliday: string | null
    ): string {
        return [
            !day ? "empty" : "",
            isToday ? "today" : "",
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

    function getDayInfoItems(
        payment: Payment | null,
        holiday: string | null,
        additionalHoliday: string | null
    ): string[] {
        const items: string[] = [];
        if (payment) {
            if (payment.early && payment.paid !== payment.due) {
                items.push(`Early payment (due ${formatIsoForAria(payment.due)}).`);
            } else {
                items.push("Payment day.");
            }
        }
        if (holiday) items.push(`UK bank holiday: ${holiday}.`);
        if (additionalHoliday) {
            items.push(`${selectedCountryName} holiday: ${additionalHoliday}.`);
        }
        return items;
    }

    function hideTooltip(): void {
        tooltipInfo = null;
        tooltipStyle = "";
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
    }

    function clearTooltipTimer(): void {
        if (!tooltipTimeout) return;
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }

    function showTooltipAtCell(cellEl: HTMLElement): void {
        if (!monthEl) return;
        const monthRect = monthEl.getBoundingClientRect();
        const cellRect = cellEl.getBoundingClientRect();
        const tooltipWidth = 224;
        const minMargin = 8;
        const left = Math.min(
            Math.max(
                cellRect.left - monthRect.left + cellRect.width / 2 - tooltipWidth / 2,
                minMargin
            ),
            Math.max(minMargin, monthRect.width - tooltipWidth - minMargin)
        );

        const aboveSpace = cellRect.top - monthRect.top;
        const belowSpace = monthRect.bottom - cellRect.bottom;
        const placeAbove = aboveSpace > 96 || belowSpace < 96;
        const top = placeAbove
            ? cellRect.top - monthRect.top - 8
            : cellRect.bottom - monthRect.top + 8;
        tooltipStyle = `left:${left}px; top:${top}px; transform:${placeAbove ? "translateY(-100%)" : "none"};`;
    }

    function handleDayInfo(
        day: number | null,
        payment: Payment | null,
        holiday: string | null,
        additionalHoliday: string | null,
        cellEl: HTMLElement | null,
        autoHideMs = 5000
    ): void {
        if (!day) return;
        const items = getDayInfoItems(payment, holiday, additionalHoliday);
        if (!items.length) return;
        if (!cellEl) return;
        tooltipInfo = {
            dateLabel: formatIsoForAria(getIsoForDay(day)),
            items,
        };
        showTooltipAtCell(cellEl);
        clearTooltipTimer();
        if (autoHideMs > 0) {
            tooltipTimeout = setTimeout(() => {
                hideTooltip();
            }, autoHideMs);
        }
    }

    function handleDayMouseEnter(
        day: number | null,
        payment: Payment | null,
        holiday: string | null,
        additionalHoliday: string | null,
        cellEl: HTMLElement | null
    ): void {
        if (!supportsHoverTooltip) return;
        handleDayInfo(day, payment, holiday, additionalHoliday, cellEl, 0);
    }

    function handleDayMouseLeave(): void {
        if (!supportsHoverTooltip) return;
        hideTooltip();
    }

    function handleDayKeyDown(
        event: KeyboardEvent,
        day: number | null,
        payment: Payment | null,
        holiday: string | null,
        additionalHoliday: string | null
    ): void {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        handleDayInfo(
            day,
            payment,
            holiday,
            additionalHoliday,
            event.currentTarget instanceof HTMLElement ? event.currentTarget : null
        );
    }

    onMount(() => {
        hoverMediaQuery = window.matchMedia?.("(hover: hover) and (pointer: fine)") ?? null;
        const applyHoverSupport = () => {
            supportsHoverTooltip = !!hoverMediaQuery?.matches;
            if (!supportsHoverTooltip && tooltipInfo) hideTooltip();
        };
        applyHoverSupport();

        const onHoverMediaChange = () => applyHoverSupport();
        hoverMediaQuery?.addEventListener?.("change", onHoverMediaChange);

        const onPointerDown = () => {
            if (tooltipInfo) hideTooltip();
        };
        window.addEventListener("pointerdown", onPointerDown, true);
        return () => {
            window.removeEventListener("pointerdown", onPointerDown, true);
            hoverMediaQuery?.removeEventListener?.("change", onHoverMediaChange);
            if (tooltipTimeout) clearTimeout(tooltipTimeout);
        };
    });
</script>

<div
    class="calendar-month relative bg-white/95 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden shadow-sm"
    bind:this={monthEl}
>
    <!-- Month Header -->
    <div
        class="bg-gray-50/90 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 p-3"
    >
        <h4 class="text-center font-bold text-gray-900 dark:text-white">
            {monthName(month)}
            {year}
        </h4>
    </div>

    <!-- Day Headers -->
    <div
        class="grid grid-cols-7 bg-gray-50/90 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700"
    >
        {#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as day}
            <div
                class="p-2 text-center text-xs min-[390px]:text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
                {day}
            </div>
        {/each}
    </div>

    <!-- Calendar Days -->
    <div
        class="grid grid-cols-7"
        role="grid"
        aria-label={`${monthName(month)} ${year} payment calendar`}
    >
        {#each calendarDays as day}
            {@const payment = day ? getPaymentForDate(day) : null}
            {@const holiday = day ? (showBankHolidays ? getBankHolidayForDate(day) : null) : null}
            {@const additionalHoliday = day
                ? getAdditionalHolidayForDate(day)
                : null}
            {@const weekend = day ? isWeekendDay(day) : false}
            {@const isToday = day ? getIsoForDay(day) === todayIso : false}

            <!-- Calendar day cell: highlights payment, early, holiday, weekend -->
            <div
                class={`calendar-day relative aspect-square border border-gray-200 dark:border-gray-600 p-2 flex flex-col justify-between bg-white dark:bg-gray-800 hover:ring-2 hover:ring-blue-400 transition overflow-hidden ${(payment || holiday || additionalHoliday) && day ? "cursor-pointer" : ""} ${getDayExtraClasses(day, isToday, weekend, payment, holiday, additionalHoliday)}`}
                title={holiday && !payment
                    ? holiday
                    : additionalHoliday
                      ? additionalHoliday
                      : undefined}
                role="gridcell"
                aria-label={buildDayAriaLabel(
                    day,
                    payment,
                    holiday,
                    additionalHoliday,
                    weekend
                )}
                tabindex={day ? 0 : undefined}
                aria-hidden={day ? undefined : "true"}
                onclick={(event) =>
                    handleDayInfo(
                        day,
                        payment,
                        holiday,
                        additionalHoliday,
                        event.currentTarget instanceof HTMLElement
                            ? event.currentTarget
                            : null
                    )}
                onmouseenter={(event) =>
                    handleDayMouseEnter(
                        day,
                        payment,
                        holiday,
                        additionalHoliday,
                        event.currentTarget instanceof HTMLElement
                            ? event.currentTarget
                            : null
                    )}
                onmouseleave={handleDayMouseLeave}
                onkeydown={(event) =>
                    handleDayKeyDown(
                        event,
                        day,
                        payment,
                        holiday,
                        additionalHoliday
                    )}
            >
                {#if day}
                    <div class="flex items-start">
                        <div class={`text-xs min-[390px]:text-sm font-semibold min-w-[1.25rem] flex-shrink-0 ${isToday ? "today-number" : ""}`}>{day}</div>
                    </div>
                    {#if additionalHoliday && !payment && flagSvg}
                        <img
                            src={flagSvg}
                            alt={`${selectedCountryName} flag`}
                            class="absolute top-1 right-1 pointer-events-none border border-gray-200"
                            title={additionalHoliday}
                            style="width:clamp(1rem,30%,1.8rem); height:auto;"
                        />
                    {/if}
                {/if}
            </div>
        {/each}
    </div>
    {#if tooltipInfo}
        <div
            class="absolute z-30 w-56 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/95 dark:bg-blue-900/90 px-3 py-2 shadow-lg pointer-events-none"
            style={tooltipStyle}
            role="status"
            aria-live="polite"
        >
            <p class="text-xs min-[390px]:text-sm font-semibold text-blue-900 dark:text-blue-100">
                {tooltipInfo.dateLabel}
            </p>
            {#each tooltipInfo.items as item}
                <p class="text-xs text-blue-800 dark:text-blue-200">
                    {item}
                </p>
            {/each}
        </div>
    {/if}

    {#if hasLegendItems}
        <!-- Month Legend -->
        <div
            class="px-3 py-2 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300 border-t border-gray-300 dark:border-gray-700 space-y-1"
        >
            <div class="flex flex-wrap gap-2 justify-center">
                {#if hasPaymentInMonth}
                    <span class="inline-flex items-center gap-1">
                        <span class="w-3 h-3 rounded legend-item payment"></span>
                        <span>Payment</span>
                    </span>
                {/if}
                {#if hasEarlyPaymentInMonth}
                    <span class="inline-flex items-center gap-1">
                        <span class="w-3 h-3 rounded legend-item early-payment"></span>
                        <span>Early</span>
                    </span>
                {/if}
                {#if hasHolidayInMonth}
                    <span class="inline-flex items-center gap-1">
                        <span class="w-3 h-3 rounded legend-item holiday"></span>
                        <span>UK Holiday</span>
                    </span>
                {/if}
                {#if hasAdditionalHolidayInMonth}
                    <span class="inline-flex items-center gap-1">
                        {#if flagSvg}
                            <img
                                src={flagSvg}
                                alt={`${selectedCountryName} flag`}
                                class="w-4 h-4 border border-gray-200"
                            />
                        {/if}
                        <span>{selectedCountryName} Holiday</span>
                    </span>
                {/if}
            </div>
        </div>
    {/if}
</div>
