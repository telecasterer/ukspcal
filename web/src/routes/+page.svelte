<script lang="ts">
    import { generatePayments, type Payment, type PensionResult } from "$lib/pensionEngine";
    import { Card } from "flowbite-svelte";
    import SummaryCard from "$lib/components/SummaryCard.svelte";
    import PensionInputsCard from "$lib/components/PensionInputsCard.svelte";
    import CalendarView from "$lib/components/CalendarView.svelte";
    import type { DateFormat } from "$lib/utils/dateFormatting";
    import { onMount } from "svelte";
    import "../styles/calendar.css";

    const PERSIST_KEY = "ukspcal.inputs.v1";

    // State
    let ni = $state("");
    let startYear = $state(new Date().getFullYear());
    let endYear = $state(new Date().getFullYear() + 1);
    let cycleDays = $state<number>(28);
    let showWeekends = $state(true);
    let showBankHolidays = $state(true);
    let csvDateFormat = $state<DateFormat>("dd/mm/yyyy");
    let icsEventName = $state("UK State Pension Payment");
    let icsCategory = $state("Finance");
    let icsColor = $state("#22c55e");
    let dob = $state("");
    let darkMode = $state(
        typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true'
    );

    onMount(() => {
        try {
            const raw = localStorage.getItem(PERSIST_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Partial<{
                ni: unknown;
                dob: unknown;
                startYear: unknown;
                endYear: unknown;
            }>;

            const toYear = (value: unknown): number | null => {
                if (typeof value === "number" && Number.isFinite(value)) return value;
                if (typeof value === "string") {
                    const n = Number.parseInt(value, 10);
                    if (Number.isFinite(n)) return n;
                }
                return null;
            };

            if (typeof parsed.ni === "string") ni = parsed.ni;
            if (typeof parsed.dob === "string") dob = parsed.dob;

            const sy = toYear(parsed.startYear);
            if (sy !== null) startYear = sy;
            const ey = toYear(parsed.endYear);
            if (ey !== null) endYear = ey;
        } catch {
            // Ignore invalid/corrupt stored values.
        }
    });

    let { data } = $props();
    const { bankHolidays } = $derived(data);

    let result: PensionResult | null = $state(null);
    let error = $state("");

    let currentCalendarMonth = $state(new Date().getMonth());
    let currentCalendarYear = $state(new Date().getFullYear());

    let pendingCalendarFocusIso = $state<string | null>(null);

    let minPaymentIso = $state<string | null>(null);
    let lastFirstPaymentAfterSpaKey = $state<string | null>(null);

    // Dark mode effect
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

    // Persist user inputs locally (browser only).
    $effect.pre(() => {
        if (typeof window === "undefined") return;

        const payload = {
            ni,
            dob,
            startYear: Number(startYear),
            endYear: Number(endYear)
        };

        try {
            localStorage.setItem(PERSIST_KEY, JSON.stringify(payload));
        } catch {
            // Ignore storage quota / private mode errors.
        }
    });

    // Generate pension schedule
    function generate() {
        error = "";

        if (!/^\d{2}[A-D]$/i.test(ni)) {
            error = "NI code (last 3 characters of your NI number) must be 2 digits followed by A–D (e.g. 22D)";
            result = null;
            return;
        }

        if (endYear < startYear) {
            error = "End year must be after start year";
            result = null;
            return;
        }

        const generated = generatePayments(ni, startYear, endYear, cycleDays, bankHolidays);

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
    }

    function isoYear(iso: string): number {
        return Number(iso.slice(0, 4));
    }
</script>

<!-- Navigation -->
<nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">📅 Pension Calendar</div>
        <div class="flex items-center gap-2">
            <a
                href="/help"
                class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
                Help
            </a>
            <button
                onclick={() => {
                    darkMode = !darkMode;
                }}
                class="text-2xl p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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

<!-- Main Content -->
<div class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">UK State Pension Payment Calendar</h1>
            <p class="text-lg text-gray-600 dark:text-gray-300">Calculate your pension payment schedule based on your NI code</p>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Privacy: this app saves no personal data to a server.
            </p>
        </div>

        <!-- Inputs + Summary (single cohesive card) -->
        <Card size="xl" class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8 input-section">
            <div class="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
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
                    />
                </div>

                <div class="lg:col-span-4">
                    {#if result}
                        <SummaryCard {result} embedded />
                    {:else}
                        <div class="p-6">
                            <div class="mb-2">
                                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule summary</h2>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Generate a schedule to see a summary here.</p>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </Card>

        <!-- Results Section -->
        {#if result}
            {#key `${result.ni}:${startYear}:${endYear}:${cycleDays}`}
                <div class="w-full space-y-6 max-w-7xl mx-auto">
                    <Card size="xl" class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 calendar-print-wrapper">
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
                        />
                    </Card>
                </div>
            {/key}
        {/if}
    </div>
</div>
