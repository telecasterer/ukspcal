<script lang="ts">
    // SummaryCard.svelte: Shows a summary of the generated pension schedule
    import type { PensionResult } from "$lib/pensionEngine";
    import SummaryCardContent from "$lib/components/SummaryCardContent.svelte";

    export let result: PensionResult;
    export let embedded: boolean = false;
    export let spaDate: string = "";
    export let nextPaymentDate: string = "";

</script>

{#if embedded}
    <!-- Embedded summary (used in main input card) -->
    <div class="p-6 summary-section">
        <SummaryCardContent {result} {spaDate} {nextPaymentDate} />
    </div>
{:else}
    <!-- Standalone summary card (used in results section) -->
    <div class="w-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 summary-section rounded-lg">
        <div class="p-6">
            <SummaryCardContent {result} {spaDate} {nextPaymentDate} />
        </div>
    </div>
{/if}
