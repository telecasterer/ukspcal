<script lang="ts">
    // SummaryCard.svelte: Shows a summary of the generated pension schedule
    import type { PensionResult } from "#lib/pensionEngine";
    import SummaryCardContent from "#lib/components/SummaryCardContent.svelte";
    import type { SpaPreviewData, StatePensionApplyInfo } from "#lib/utils/summaryDocuments";

    type Props = {
        result?: PensionResult | null;
        embedded?: boolean;
        nextPaymentDate?: string;
        statePensionApplyInfo?: StatePensionApplyInfo | null;
        spaDateIso?: string;
        isWithinThreeMonthsOfSpa?: boolean;
        spaPreviewData?: SpaPreviewData | null;
    };

    let {
        result = null,
        embedded = false,
        nextPaymentDate = "",
        statePensionApplyInfo = null,
        spaDateIso = "",
        isWithinThreeMonthsOfSpa = false,
        spaPreviewData = null,
    }: Props = $props();
</script>

{#if embedded}
    <!-- Embedded summary (used in main input card) -->
    <div class="p-4 sm:p-6 summary-section">
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
