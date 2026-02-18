<script lang="ts">
    import { Card } from "flowbite-svelte";
    import type { PensionResult } from "$lib/pensionEngine";
    import { formatDateForCSV } from "$lib/utils/dateFormatting";

    export let result: PensionResult;
    export let spaDate: string = "";
    export let nextPaymentDate: string = "";

    // No JS-driven animation for the summary details: rely on native behaviour
</script>

<div class="mb-3">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Schedule summary
    </h3>
    <p class="text-xs text-gray-500 dark:text-gray-400">
        Generated from the payment calendar inputs.
    </p>
</div>

<div class="grid grid-cols-2 gap-2">
    <!-- NI Code -->
    <Card
        size="xl"
        class="p-2 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
    >
        <p
            class="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase"
        >
            NI Code
        </p>
        <p class="text-sm font-bold text-blue-700 dark:text-blue-100">
            {result.ni}
        </p>
    </Card>
    <!-- Payment Day -->
    <Card
        size="xl"
        class="p-2 bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700"
    >
        <p
            class="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase"
        >
            Payment Day
        </p>
        <p class="text-sm font-bold text-emerald-700 dark:text-emerald-100">
            {result.normalDay}
        </p>
    </Card>
    <!-- Cycle -->
    <Card
        size="xl"
        class="p-2 bg-violet-50 dark:bg-violet-900 border-violet-200 dark:border-violet-700"
    >
        <p
            class="text-xs font-semibold text-violet-600 dark:text-violet-300 uppercase"
        >
            Cycle
        </p>
        <p class="text-sm font-bold text-violet-700 dark:text-violet-100">
            {result.cycleDays}d
        </p>
    </Card>
    <!-- First Payment Date After SPA -->
    <Card
        size="xl"
        class="p-2 bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700"
    >
        <p
            class="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase"
        >
            First Payment
        </p>
        <p class="text-sm font-bold text-orange-700 dark:text-orange-100">
            {spaDate}
        </p>
    </Card>
    {#if nextPaymentDate}
        <!-- Next Payment Date (if already past SPA) -->
        <Card
            size="xl"
            class="p-2 bg-cyan-50 dark:bg-cyan-900 border-cyan-200 dark:border-cyan-700"
        >
            <p
                class="text-xs font-semibold text-cyan-600 dark:text-cyan-300 uppercase"
            >
                Next Payment
            </p>
            <p class="text-sm font-bold text-cyan-700 dark:text-cyan-100">
                {nextPaymentDate}
            </p>
        </Card>
    {/if}
</div>
<div class="mt-3">
    <details class="custom-details group bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md p-3">
        <summary class="custom-summary flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 list-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
            <span>Show payment dates ({result.payments.length})</span>
                <span class="chev" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </span>
        </summary>

        <div class="details-content">
            <ul class="mt-2 max-h-64 overflow-auto divide-y divide-gray-100 dark:divide-gray-800">
            {#each result.payments as p}
                <li class="py-2">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDateForCSV(p.paid, 'ddd, d mmmm yyyy')}
                            </div>
                            {#if p.early}
                                <div class="text-xs text-orange-600 dark:text-orange-300">
                                    Early (due {formatDateForCSV(p.due, 'dd-mmm-yyyy')})
                                </div>
                            {/if}
                        </div>
                        {#if p.holidays && p.holidays.length}
                            <div class="text-xs text-gray-500 dark:text-gray-400 ml-4 text-right">
                                {p.holidays.join(', ')}
                            </div>
                        {/if}
                    </div>
                </li>
            {/each}
            </ul>
        </div>
    </details>
</div>

<style>
    /* hide default marker and animate our chevron with smoother easing */
    summary::-webkit-details-marker { display: none; }
    summary::marker { display: none; }
    .custom-summary { transition: none; }
    .custom-summary:hover { background-color: rgba(0,0,0,0.03); }
    :global(.dark) .custom-summary:hover { background-color: rgba(255,255,255,0.03); }
    .custom-summary .chev { transition: none; }
    .custom-details[open] > .custom-summary .chev { transform: rotate(180deg); }

    /* No animation: native details/summary behaviour */
    .details-content {
        display: block;
        max-height: none;
        opacity: 1;
        transform: none;
        overflow: visible;
        transition: none;
    }
</style>
