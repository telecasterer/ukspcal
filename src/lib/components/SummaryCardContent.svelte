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
    } from "flowbite-svelte-icons";
    import type { PensionResult } from "#lib/pensionEngine";
    import { copyTextToClipboard } from "#lib/utils/clipboard";
    import { exportSingleDateICS } from "#lib/utils/exportHelpers";

    type Props = {
        result?: PensionResult | null;
        nextPaymentDate?: string;
        statePensionApplyInfo?: StatePensionApplyInfo | null;
        spaDateIso?: string;
        isWithinThreeMonthsOfSpa?: boolean;
        spaPreviewData?: SpaPreviewData | null;
    };

    let {
        result = null,
        nextPaymentDate = "",
        statePensionApplyInfo = null,
        spaDateIso = "",
        isWithinThreeMonthsOfSpa = false,
        spaPreviewData = null,
    }: Props = $props();

    let listActionStatus = $state("");
    let listActionStatusTimeout: ReturnType<typeof setTimeout> | null = null;
    let summaryActionStatus = $state("");
    let summaryActionStatusTimeout: ReturnType<typeof setTimeout> | null = null;

    // The payment list grows with the page instead of scrolling inside it (nested
    // scrolling is fiddly on phones), so it starts short.
    const INITIAL_LIST_LENGTH = 8;
    let showAllPayments = $state(false);
    const visiblePayments = $derived(
        result && !showAllPayments
            ? result.payments.slice(0, INITIAL_LIST_LENGTH)
            : (result?.payments ?? [])
    );

    // Labelled buttons at least 44px high, so they are easy to hit with a thumb.
    const actionButtonClass =
        "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";
    const calendarLinkClass =
        "inline-flex min-h-11 shrink-0 items-center -my-2 -mr-2 px-2 text-sm underline underline-offset-2";

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

<div class="mb-3 border-l-4 border-blue-400 dark:border-blue-500 pl-2">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule summary</h3>
    <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-300">
        Generated from the payment calendar inputs.
    </p>
</div>

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
                    class="{calendarLinkClass} text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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
                <p
                    class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                    First payment
                </p>
                <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                    {spaPreviewData.firstPayment.dueFormatted}
                </p>
                <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">
                    {spaPreviewData.firstPayment.comprisingText}
                </p>
                <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">
                    The State Pension is paid in arrears, so the first payment comes at the end of
                    your first payment cycle.
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
            class="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 {isWithinThreeMonthsOfSpa
                ? 'border-l-4 border-l-amber-500 dark:border-l-amber-500'
                : ''}"
        >
            <div class="flex items-start justify-between">
                <div>
                    <p
                        class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400"
                    >
                        Apply for your State Pension
                    </p>
                    <p
                        class="mt-1 text-sm min-[390px]:text-base font-medium text-amber-900 dark:text-amber-100"
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
                        class="{calendarLinkClass} ml-2 text-amber-800 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                        Add to calendar
                    </button>
                {/if}
            </div>
            {#if isWithinThreeMonthsOfSpa}
                <p class="mt-1 text-xs min-[390px]:text-sm text-amber-900 dark:text-amber-200">
                    You are within 3 months of your State Pension age. If you have not claimed yet,
                    claim as soon as possible. No invitation letter? You can request an invitation
                    code on GOV.UK.
                </p>
            {/if}
            <a
                class="mt-1 inline-flex min-h-11 items-center font-medium text-xs min-[390px]:text-sm underline text-amber-800 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-300"
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
                        class="{calendarLinkClass} ml-2 text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        Add to calendar
                    </button>
                {/if}
            </div>
            <a
                class="mt-1 inline-flex min-h-11 items-center font-medium text-xs min-[390px]:text-sm underline text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                href={spaDateIso
                    ? `/claiming?spaDate=${encodeURIComponent(spaDateIso)}`
                    : "/claiming"}
            >
                Claiming your State Pension &rarr;
            </a>
        </div>
    {/if}
{/if}
{#if spaPreviewData || result}
    <div class="mt-4 flex gap-2">
        <button onclick={handleCopySummary} aria-label="Copy summary" class={actionButtonClass}>
            <ClipboardOutline class="h-4 w-4" />
            <span>Copy</span>
        </button>
        <button onclick={handleSaveSummary} aria-label="Save summary" class={actionButtonClass}>
            <DownloadOutline class="h-4 w-4" />
            <span>Save</span>
        </button>
        <button onclick={handlePrintSummary} aria-label="Print summary" class={actionButtonClass}>
            <PrinterOutline class="h-4 w-4" />
            <span>Print</span>
        </button>
    </div>
    {#if summaryActionStatus}
        <p
            class="mt-2 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300"
            role="status"
            aria-live="polite"
        >
            {summaryActionStatus}
        </p>
    {/if}
{/if}
{#if result}
    <div class="mt-3">
        <details
            class="custom-details group bg-gray-50/90 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md"
        >
            <summary
                class="custom-summary flex min-h-11 items-center justify-between px-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 list-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
                <span>Show payment dates</span>
                <span class="chev" aria-hidden="true">
                    <ChevronDownOutline class="h-4 w-4" ariaLabel="Expand" />
                </span>
            </summary>

            <div class="details-content px-3 pb-3">
                <ul class="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                    {#each visiblePayments as p (p.due)}
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
                {#if result.payments.length > INITIAL_LIST_LENGTH}
                    <button
                        type="button"
                        onclick={() => (showAllPayments = !showAllPayments)}
                        aria-expanded={showAllPayments}
                        class="mt-1 inline-flex min-h-11 w-full items-center justify-center text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        {showAllPayments
                            ? "Show fewer"
                            : `Show all ${result.payments.length} payments`}
                    </button>
                {/if}
                <div class="mt-2 flex gap-2">
                    <button
                        onclick={handleCopyPaymentList}
                        aria-label="Copy list"
                        class={actionButtonClass}
                    >
                        <ClipboardOutline class="h-4 w-4" />
                        <span>Copy</span>
                    </button>
                    <button
                        onclick={handleSavePaymentList}
                        aria-label="Save list"
                        class={actionButtonClass}
                    >
                        <DownloadOutline class="h-4 w-4" />
                        <span>Save</span>
                    </button>
                    <button
                        onclick={handlePrintPaymentList}
                        aria-label="Print list"
                        class={actionButtonClass}
                    >
                        <PrinterOutline class="h-4 w-4" />
                        <span>Print</span>
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
            </div>
        </details>
    </div>
{/if}
