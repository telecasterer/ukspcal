<script lang="ts">
    import { generatePayments, type PensionResult } from "$lib/pensionEngine";
    import { Card } from "flowbite-svelte";
    import PensionForm from "$lib/components/PensionForm.svelte";
    import SummaryCard from "$lib/components/SummaryCard.svelte";
    import StatePensionAgeCard from "$lib/components/StatePensionAgeCard.svelte";
    import CalendarView from "$lib/components/CalendarView.svelte";
    import type { DateFormat } from "$lib/utils/dateFormatting";
    import "../styles/calendar.css";

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

    let { data } = $props();
    const { bankHolidays } = $derived(data);

    let result: PensionResult | null = $state(null);
    let error = $state("");

    let currentCalendarMonth = $state(new Date().getMonth());
    let currentCalendarYear = $state(new Date().getFullYear());

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

        result = generatePayments(ni, startYear, endYear, cycleDays, bankHolidays);

        // Reset calendar to first payment's month if available
        if (result && result.payments.length > 0) {
            const firstPayment = new Date(result.payments[0].paid + "T00:00:00Z");
            currentCalendarMonth = firstPayment.getUTCMonth();
            currentCalendarYear = firstPayment.getUTCFullYear();
        }
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
                Privacy: this app saves no personal data. Everything runs in your browser.
            </p>
        </div>

        <!-- Input and Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-start input-section">
            <div class="space-y-6">
                <StatePensionAgeCard bind:dob onUseSpaYear={(y) => {
                    startYear = y;
                    endYear = y + 1;
                }} />

                <Card class="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <PensionForm
                        bind:ni
                        bind:startYear
                        bind:endYear
                        bind:cycleDays
                        bind:error
                        onGenerate={generate}
                    />
                </Card>
            </div>

            {#if result}
                <SummaryCard {result} />
            {/if}
        </div>

        <!-- Results Section -->
        {#if result}
            {#key `${result.ni}:${startYear}:${endYear}:${cycleDays}`}
                <div class="w-full space-y-6 max-w-5xl mx-auto">
                    <!-- Calendar View -->
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
                </div>
            {/key}
        {/if}
    </div>
</div>
