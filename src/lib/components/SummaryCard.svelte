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

    type SpaPreviewData = {
        spaDateFormatted: string;
        spaAgeYears: number;
        spaAgeMonths: number;
        spaSource: string;
        showPre2016Warning: boolean;
        firstPayment: {
            dueFormatted: string;
            paidFormatted: string;
            isEarly: boolean;
            comprisingText: string;
        } | null;
        secondPayment: {
            dueFormatted: string;
            paidFormatted: string;
            isEarly: boolean;
        } | null;
    };

    export let result: PensionResult | null = null;
    export let embedded: boolean = false;
    export let nextPaymentDate: string = "";
    export let statePensionApplyInfo: StatePensionApplyInfo | null = null;
    export let spaDateIso: string = "";
    export let isWithinThreeMonthsOfSpa: boolean = false;
    export let spaPreviewData: SpaPreviewData | null = null;
</script>

{#if embedded}
    <!-- Embedded summary (used in main input card) -->
    <div class="p-6 summary-section">
        <SummaryCardContent
            {result}
            {nextPaymentDate}
            {statePensionApplyInfo}
            {spaDateIso}
            {isWithinThreeMonthsOfSpa}
            {spaPreviewData}
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
                {nextPaymentDate}
                {statePensionApplyInfo}
                {spaDateIso}
                {isWithinThreeMonthsOfSpa}
                {spaPreviewData}
            />
        </div>
    </div>
{/if}
