<script lang="ts">
    import { formatSpaAge } from "#lib/utils/statePensionAge";
    import { formatDateForCSV } from "#lib/utils/dateFormatting";
    import {
        buildPaymentListHtml,
        buildPaymentListText,
        buildSummaryHtml,
        buildSummaryText,
        downloadTextFile,
        formatDaysToGo,
        printHtmlDocument,
        type SpaPreviewData,
        type StatePensionApplyInfo,
        type SummaryInput,
    } from "#lib/utils/summaryDocuments";
    import {
        ChevronDownOutline,
        ClipboardOutline,
        DownloadOutline,
        PrinterOutline,
        InfoCircleOutline,
    } from "flowbite-svelte-icons";
    import { Tooltip } from "flowbite-svelte";
    import type { PensionResult } from "#lib/pensionEngine";
    import { copyTextToClipboard } from "#lib/utils/clipboard";
    import { exportSingleDateICS } from "#lib/utils/exportHelpers";

    export let result: PensionResult | null = null;
    export let nextPaymentDate: string = "";
    export let statePensionApplyInfo: StatePensionApplyInfo | null = null;
    export let spaDateIso: string = "";
    export let isWithinThreeMonthsOfSpa: boolean = false;
    export let spaPreviewData: SpaPreviewData | null = null;
    let listActionStatus = "";
    let listActionStatusTimeout: ReturnType<typeof setTimeout> | null = null;
    let summaryActionStatus = "";
    let summaryActionStatusTimeout: ReturnType<typeof setTimeout> | null = null;

    // No JS-driven animation for the summary details: rely on native behaviour
    function setListActionStatus(message: string): void {
        listActionStatus = message;
        if (listActionStatusTimeout) clearTimeout(listActionStatusTimeout);
        listActionStatusTimeout = setTimeout(() => {
            listActionStatus = "";
            listActionStatusTimeout = null;
        }, 4000);
    }

    function setSummaryActionStatus(message: string): void {
        summaryActionStatus = message;
        if (summaryActionStatusTimeout) clearTimeout(summaryActionStatusTimeout);
        summaryActionStatusTimeout = setTimeout(() => {
            summaryActionStatus = "";
            summaryActionStatusTimeout = null;
        }, 4000);
    }

    function summaryInput(): SummaryInput {
        return { result, nextPaymentDate, statePensionApplyInfo, spaPreviewData };
    }

    async function handleCopySummary(): Promise<void> {
        const ok = await copyTextToClipboard(buildSummaryText(summaryInput()));
        setSummaryActionStatus(
            ok ? "Summary copied." : "Couldn't copy automatically — please try again."
        );
    }

    function handleSaveSummary(): void {
        downloadTextFile(buildSummaryText(summaryInput()), "pension-schedule-summary.txt");
        setSummaryActionStatus("Summary saved.");
    }

    function handlePrintSummary(): void {
        if (!printHtmlDocument(buildSummaryHtml(summaryInput()))) {
            setSummaryActionStatus("Pop-up blocked. Allow pop-ups to print.");
        }
    }

    async function handleCopyPaymentList(): Promise<void> {
        if (!result) return;
        const ok = await copyTextToClipboard(buildPaymentListText(result.payments));
        setListActionStatus(
            ok ? "Payment list copied." : "Couldn't copy automatically — please try again."
        );
    }

    function handleSavePaymentList(): void {
        if (!result) return;
        downloadTextFile(buildPaymentListText(result.payments), "pension-payment-dates.txt");
        setListActionStatus("Payment list saved.");
    }

    function handlePrintPaymentList(): void {
        if (!result) return;
        const html = buildPaymentListHtml(buildPaymentListText(result.payments));
        if (!printHtmlDocument(html)) {
            setListActionStatus("Pop-up blocked. Allow pop-ups to print this list.");
        }
    }
</script>

<div
    class="mb-3 border-l-4 border-blue-400 dark:border-blue-500 pl-2 flex items-start justify-between gap-2"
>
    <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule summary</h3>
        <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-300">
            Generated from the payment calendar inputs.
        </p>
    </div>
    {#if spaPreviewData || result}
        <div class="flex gap-1 shrink-0 pt-0.5">
            <button
                onclick={handleCopySummary}
                title="Copy summary"
                aria-label="Copy summary"
                class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
                <ClipboardOutline class="h-4 w-4" ariaLabel="Copy summary" />
            </button>
            <button
                onclick={handleSaveSummary}
                title="Save summary"
                aria-label="Save summary"
                class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
                <DownloadOutline class="h-4 w-4" ariaLabel="Save summary" />
            </button>
            <button
                onclick={handlePrintSummary}
                title="Print summary"
                aria-label="Print summary"
                class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
                <PrinterOutline class="h-4 w-4" ariaLabel="Print summary" />
            </button>
        </div>
    {/if}
</div>
{#if summaryActionStatus}
    <p
        class="mb-2 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300"
        role="status"
        aria-live="polite"
    >
        {summaryActionStatus}
    </p>
{/if}

{#if !spaPreviewData && !result}
    <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
        Enter your NI number suffix and date of birth to see your schedule summary.
    </p>
{/if}

{#if result}
    <div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <!-- Payment Day -->
        <div>
            <p
                class="text-xs min-[390px]:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
            >
                Payment Day
            </p>
            <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                {result.normalDay}
            </p>
        </div>
        {#if nextPaymentDate}
            <!-- Next Payment Date (only shown when user is already past SPA) -->
            <div>
                <p
                    class="text-xs min-[390px]:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                    Next Payment
                </p>
                <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                    {nextPaymentDate}
                </p>
            </div>
        {/if}
    </div>
{/if}

<!-- SPA details block -->
{#if spaPreviewData}
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {#if spaPreviewData.showPre2016Warning}
            <div
                role="alert"
                class="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs min-[390px]:text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100"
            >
                This calculator assumes your State Pension age is on or after <strong
                    >6 April 2016</strong
                >. Your SPA appears to be earlier, so results may be inaccurate.
            </div>
        {/if}
        <div class="flex items-center justify-between">
            <div>
                <p
                    class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                    State Pension Age
                </p>
                <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                    {spaPreviewData.spaDateFormatted}
                </p>
            </div>
            {#if spaDateIso}
                <button
                    onclick={() =>
                        exportSingleDateICS(
                            spaDateIso,
                            "State Pension Age",
                            "Reached UK State Pension Age"
                        )}
                    class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
                >
                    Add to calendar
                </button>
            {/if}
        </div>
        {#if spaPreviewData.spaSource !== "fixed"}
            <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">
                {formatSpaAge(spaPreviewData.spaAgeYears, spaPreviewData.spaAgeMonths)}
            </p>
        {/if}
        {#if spaPreviewData.firstPayment}
            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-1.5">
                    <p
                        class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                        First payment
                    </p>
                    <button
                        id="first-payment-info"
                        type="button"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <InfoCircleOutline class="w-3.5 h-3.5 outline-none" />
                        <span class="sr-only">Info about first payment</span>
                    </button>
                    <Tooltip
                        triggeredBy="#first-payment-info"
                        placement="top"
                        class="max-w-xs z-50 font-normal text-xs"
                    >
                        The UK State Pension is paid in arrears. Your first payment typically
                        arrives at the end of your first full payment cycle after your State Pension
                        Age.
                    </Tooltip>
                </div>
                <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                    {spaPreviewData.firstPayment.dueFormatted}
                </p>
                <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">
                    {spaPreviewData.firstPayment.comprisingText}
                </p>
                {#if spaPreviewData.firstPayment.isEarly}
                    <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">
                        Paid early on {spaPreviewData.firstPayment.paidFormatted}.
                    </p>
                {/if}
                {#if spaPreviewData.secondPayment}
                    <div class="mt-3">
                        <p
                            class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                        >
                            Second payment
                        </p>
                        <p class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                            {spaPreviewData.secondPayment.dueFormatted}
                        </p>
                        {#if spaPreviewData.secondPayment.isEarly}
                            <p
                                class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300"
                            >
                                Paid early on {spaPreviewData.secondPayment.paidFormatted}.
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}
{#if statePensionApplyInfo}
    {#if statePensionApplyInfo.applyNow}
        <!-- Eligible now -->
        <div
            class="mt-4 p-3 rounded-lg {isWithinThreeMonthsOfSpa
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}"
        >
            <div class="flex items-start justify-between">
                <div>
                    <p
                        class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide {isWithinThreeMonthsOfSpa
                            ? 'text-red-800 dark:text-red-400'
                            : 'text-amber-800 dark:text-amber-400'}"
                    >
                        Apply for your State Pension
                    </p>
                    <p
                        class="mt-1 text-sm min-[390px]:text-base font-medium {isWithinThreeMonthsOfSpa
                            ? 'text-red-900 dark:text-red-100'
                            : 'text-amber-900 dark:text-amber-100'}"
                    >
                        You can apply now (from {statePensionApplyInfo.applyFromFormatted}).
                    </p>
                </div>
                {#if statePensionApplyInfo.applyFromIso}
                    <button
                        onclick={() =>
                            exportSingleDateICS(
                                statePensionApplyInfo!.applyFromIso,
                                "Claim UK State Pension",
                                "Eligible to claim UK State Pension"
                            )}
                        class="text-xs underline underline-offset-2 shrink-0 ml-2 mt-1 {isWithinThreeMonthsOfSpa
                            ? 'text-red-700 hover:text-red-900 dark:text-red-400'
                            : 'text-amber-700 hover:text-amber-900 dark:text-amber-400'}"
                    >
                        Add to calendar
                    </button>
                {/if}
            </div>
            {#if isWithinThreeMonthsOfSpa}
                <p class="mt-1 text-xs min-[390px]:text-sm text-red-800 dark:text-red-300">
                    You are within 3 months of your State Pension age. If you have not claimed yet,
                    claim as soon as possible. No invitation letter? You can request an invitation
                    code on GOV.UK.
                </p>
            {/if}
            <a
                class="mt-3 inline-block font-medium text-xs min-[390px]:text-sm underline {isWithinThreeMonthsOfSpa
                    ? 'text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                    : 'text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300'}"
                href={spaDateIso
                    ? `/claiming?spaDate=${encodeURIComponent(spaDateIso)}`
                    : "/claiming"}
            >
                How to claim your State Pension &rarr;
            </a>
        </div>
    {:else}
        <!-- Not yet eligible -->
        <div
            class="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
        >
            <div class="flex items-start justify-between">
                <div>
                    <p
                        class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-400"
                    >
                        State Pension claim date
                    </p>
                    <p
                        class="mt-1 text-sm min-[390px]:text-base font-medium text-indigo-900 dark:text-indigo-100"
                    >
                        You can apply from {statePensionApplyInfo.applyFromFormatted} ({formatDaysToGo(
                            statePensionApplyInfo.countdownDays
                        )}).
                    </p>
                </div>
                {#if statePensionApplyInfo.applyFromIso}
                    <button
                        onclick={() =>
                            exportSingleDateICS(
                                statePensionApplyInfo!.applyFromIso,
                                "Claim UK State Pension",
                                "Eligible to claim UK State Pension from today"
                            )}
                        class="text-xs text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 shrink-0 ml-2 mt-1"
                    >
                        Add to calendar
                    </button>
                {/if}
            </div>
            <a
                class="mt-3 inline-block font-medium text-xs min-[390px]:text-sm underline text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                href={spaDateIso
                    ? `/claiming?spaDate=${encodeURIComponent(spaDateIso)}`
                    : "/claiming"}
            >
                Claiming your State Pension &rarr;
            </a>
        </div>
    {/if}
{/if}
{#if result}
    <div class="mt-3">
        <details
            class="custom-details group bg-gray-50/90 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-3"
        >
            <summary
                class="custom-summary flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 list-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
                <span>Show payment dates</span>
                <span class="chev" aria-hidden="true">
                    <ChevronDownOutline class="h-4 w-4" ariaLabel="Expand" />
                </span>
            </summary>

            <div class="details-content">
                <div class="mt-2 flex gap-1 justify-end">
                    <button
                        onclick={handleCopyPaymentList}
                        title="Copy list"
                        aria-label="Copy list"
                        class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        <ClipboardOutline class="h-4 w-4" ariaLabel="Copy list" />
                    </button>
                    <button
                        onclick={handleSavePaymentList}
                        title="Save list"
                        aria-label="Save list"
                        class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        <DownloadOutline class="h-4 w-4" ariaLabel="Save list" />
                    </button>
                    <button
                        onclick={handlePrintPaymentList}
                        title="Print list"
                        aria-label="Print list"
                        class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        <PrinterOutline class="h-4 w-4" ariaLabel="Print list" />
                    </button>
                </div>
                {#if listActionStatus}
                    <p
                        class="mt-2 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300"
                        role="status"
                        aria-live="polite"
                    >
                        {listActionStatus}
                    </p>
                {/if}
                <ul
                    class="mt-2 max-h-64 overflow-auto divide-y divide-gray-200 dark:divide-gray-700"
                >
                    {#each result.payments as p}
                        <li class="py-2">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDateForCSV(p.paid, "ddd, d mmmm yyyy")}
                                    </div>
                                    {#if p.early}
                                        <div
                                            class="text-xs min-[390px]:text-sm text-orange-600 dark:text-orange-300"
                                        >
                                            Early (due {formatDateForCSV(p.due, "dd-mmm-yyyy")})
                                        </div>
                                    {/if}
                                </div>
                                {#if p.holidays && p.holidays.length}
                                    <div
                                        class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400 ml-4 text-right"
                                    >
                                        {p.holidays.join(", ")}
                                    </div>
                                {/if}
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
        </details>
    </div>
{/if}
