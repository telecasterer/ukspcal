<script lang="ts">
    import { Card } from "flowbite-svelte";
    import type { PensionResult } from "$lib/pensionEngine";

    export let result: PensionResult;
    export let spaDate: string = "";
    export let nextPaymentDate: string = "";
</script>

<div class="mb-3">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule summary</h3>
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
    <!-- First Payment Date After SPA -->
    <Card size="xl" class="p-2 bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700">
        <p class="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase">First Payment</p>
        <p class="text-sm font-bold text-orange-700 dark:text-orange-100">{spaDate}</p>
    </Card>
    {#if nextPaymentDate}
        <!-- Next Payment Date (if already past SPA) -->
        <Card size="xl" class="p-2 bg-cyan-50 dark:bg-cyan-900 border-cyan-200 dark:border-cyan-700">
            <p class="text-xs font-semibold text-cyan-600 dark:text-cyan-300 uppercase">Next Payment</p>
            <p class="text-sm font-bold text-cyan-700 dark:text-cyan-100">{nextPaymentDate}</p>
        </Card>
    {/if}
</div>
