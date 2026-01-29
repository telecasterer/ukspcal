<script lang="ts">
    // SummaryCard.svelte: Shows a summary of the generated pension schedule
    import { Card } from "flowbite-svelte";
    import type { PensionResult } from "$lib/pensionEngine";

    export let result: PensionResult;
    export let embedded: boolean = false;
</script>

{#if embedded}
    <!-- Embedded summary (used in main input card) -->
    <div class="p-6 summary-section">
        <div class="mb-3">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule summary</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Generated from the payment calendar inputs.</p>
        </div>
        <div class="grid grid-cols-2 gap-2">
            <!-- NI Code -->
            <Card size="xl" class="p-2 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
                <p class="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase">NI Code</p>
                <p class="text-sm font-bold text-blue-700 dark:text-blue-100">{result.ni}</p>
            </Card>
            <!-- Payment Day -->
            <Card size="xl" class="p-2 bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700">
                <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase">Payment Day</p>
                <p class="text-sm font-bold text-emerald-700 dark:text-emerald-100">{result.normalDay}</p>
            </Card>
            <!-- Cycle -->
            <Card size="xl" class="p-2 bg-violet-50 dark:bg-violet-900 border-violet-200 dark:border-violet-700">
                <p class="text-xs font-semibold text-violet-600 dark:text-violet-300 uppercase">Cycle</p>
                <p class="text-sm font-bold text-violet-700 dark:text-violet-100">{result.cycleDays}d</p>
            </Card>
            <!-- Payments count -->
            <Card size="xl" class="p-2 bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700">
                <p class="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase">Payments</p>
                <p class="text-sm font-bold text-orange-700 dark:text-orange-100">{result.payments.length}</p>
            </Card>
        </div>
    </div>
{:else}
    <!-- Standalone summary card (used in results section) -->
    <Card size="xl" class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 summary-section">
        <div class="p-6">
            <div class="mb-3">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule summary</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Generated from the payment calendar inputs.</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <!-- NI Code -->
                <Card size="xl" class="p-2 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
                    <p class="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase">NI Code</p>
                    <p class="text-sm font-bold text-blue-700 dark:text-blue-100">{result.ni}</p>
                </Card>
                <!-- Payment Day -->
                <Card size="xl" class="p-2 bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700">
                    <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase">Payment Day</p>
                    <p class="text-sm font-bold text-emerald-700 dark:text-emerald-100">{result.normalDay}</p>
                </Card>
                <!-- Cycle -->
                <Card size="xl" class="p-2 bg-violet-50 dark:bg-violet-900 border-violet-200 dark:border-violet-700">
                    <p class="text-xs font-semibold text-violet-600 dark:text-violet-300 uppercase">Cycle</p>
                    <p class="text-sm font-bold text-violet-700 dark:text-violet-100">{result.cycleDays}d</p>
                </Card>
                <!-- Payments count -->
                <Card size="xl" class="p-2 bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700">
                    <p class="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase">Payments</p>
                    <p class="text-sm font-bold text-orange-700 dark:text-orange-100">{result.payments.length}</p>
                </Card>
            </div>
        </div>
    </Card>
{/if}
