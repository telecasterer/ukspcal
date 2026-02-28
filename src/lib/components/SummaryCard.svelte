<script lang="ts">
    // SummaryCard.svelte: Shows a summary of the generated pension schedule
    import type { PensionResult } from "$lib/pensionEngine";
    import SummaryCardContent from "$lib/components/SummaryCardContent.svelte";

    type StatePensionApplyInfo = {
        applyFromIso: string;
        applyFromFormatted: string;
        countdownDays: number;
        applyNow: boolean;
    };

    export let result: PensionResult;
    export let embedded: boolean = false;
    export let spaDate: string = "";
    export let nextPaymentDate: string = "";
    export let statePensionApplyInfo: StatePensionApplyInfo | null = null;
    export let spaDateIso: string = "";
    export let isWithinThreeMonthsOfSpa: boolean = false;
</script>

{#if embedded}
    <!-- Embedded summary (used in main input card) -->
    <div class="p-6 summary-section">
        <SummaryCardContent
            {result}
            {spaDate}
            {nextPaymentDate}
            {statePensionApplyInfo}
            {spaDateIso}
            {isWithinThreeMonthsOfSpa}
        />
    </div>
{:else}
    <!-- Standalone summary card (used in results section) -->
    <div
        class="w-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 summary-section rounded-lg"
    >
        <div class="p-6">
            <SummaryCardContent
                {result}
                {spaDate}
                {nextPaymentDate}
                {statePensionApplyInfo}
                {spaDateIso}
                {isWithinThreeMonthsOfSpa}
            />
        </div>
    </div>
{/if}
