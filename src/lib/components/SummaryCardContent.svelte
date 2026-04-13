<script lang="ts">
    import { Card } from "flowbite-svelte";
    import {
        ChevronDownOutline,
        ClipboardOutline,
        DownloadOutline,
        PrinterOutline,
    } from "flowbite-svelte-icons";
    import type { Payment, PensionResult } from "$lib/pensionEngine";
    import { formatDateForCSV } from "$lib/utils/dateFormatting";
    import { copyTextToClipboard } from "$lib/utils/clipboard";

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

    function buildSummaryText(): string {
        const lines: string[] = ["UK State Pension Schedule Summary", ""];
        if (spaPreviewData) {
            lines.push(`State Pension age:  ${spaPreviewData.spaDateFormatted}`);
            if (spaPreviewData.spaSource !== "fixed") {
                lines.push(`                    Age ${spaPreviewData.spaAgeYears}${spaPreviewData.spaAgeMonths ? ` years ${spaPreviewData.spaAgeMonths} months` : ""}`);
            }
            if (spaPreviewData.firstPayment) {
                lines.push("");
                lines.push(`First payment:      ${spaPreviewData.firstPayment.dueFormatted}`);
                lines.push(`                    ${spaPreviewData.firstPayment.comprisingText}`);
                if (spaPreviewData.firstPayment.isEarly) {
                    lines.push(`                    Paid early on ${spaPreviewData.firstPayment.paidFormatted}`);
                }
            }
            if (spaPreviewData.secondPayment) {
                lines.push(`Second payment:     ${spaPreviewData.secondPayment.dueFormatted}`);
                if (spaPreviewData.secondPayment.isEarly) {
                    lines.push(`                    Paid early on ${spaPreviewData.secondPayment.paidFormatted}`);
                }
            }
        }
        if (result) {
            if (spaPreviewData) lines.push("");
            lines.push(`NI code:            ${result.ni}`);
            lines.push(`Payment day:        ${result.normalDay}`);
            lines.push(`Payment cycle:      ${result.cycleDays} days`);
            if (nextPaymentDate) {
                lines.push(`Next payment:       ${nextPaymentDate}`);
            }
        }
        if (statePensionApplyInfo) {
            lines.push("");
            if (statePensionApplyInfo.applyNow) {
                lines.push(`Apply now:          from ${statePensionApplyInfo.applyFromFormatted}`);
            } else {
                lines.push(`Apply from:         ${statePensionApplyInfo.applyFromFormatted} (${statePensionApplyInfo.countdownDays} day${statePensionApplyInfo.countdownDays === 1 ? "" : "s"} to go)`);
            }
        }
        return lines.join("\n");
    }

    async function handleCopySummary(): Promise<void> {
        const ok = await copyTextToClipboard(buildSummaryText());
        setSummaryActionStatus(ok ? "Summary copied." : "Couldn't copy automatically — please try again.");
    }

    function handleSaveSummary(): void {
        const blob = new Blob([buildSummaryText()], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "pension-schedule-summary.txt";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSummaryActionStatus("Summary saved.");
    }

    function handlePrintSummary(): void {
        if (typeof window === "undefined") return;
        const rows: string[] = [];
        if (spaPreviewData) {
            rows.push(`<tr class="section-head"><th colspan="2">State Pension</th></tr>`);
            rows.push(`<tr><th>State Pension age</th><td>${escapeHtml(spaPreviewData.spaDateFormatted)}</td></tr>`);
            if (spaPreviewData.spaSource !== "fixed") {
                rows.push(`<tr><th></th><td>Age ${spaPreviewData.spaAgeYears}${spaPreviewData.spaAgeMonths ? ` years ${spaPreviewData.spaAgeMonths} months` : ""}</td></tr>`);
            }
            if (spaPreviewData.firstPayment) {
                rows.push(`<tr><th>First payment</th><td>${escapeHtml(spaPreviewData.firstPayment.dueFormatted)}</td></tr>`);
                rows.push(`<tr><th></th><td>${escapeHtml(spaPreviewData.firstPayment.comprisingText)}</td></tr>`);
                if (spaPreviewData.firstPayment.isEarly) {
                    rows.push(`<tr><th></th><td>Paid early on ${escapeHtml(spaPreviewData.firstPayment.paidFormatted)}</td></tr>`);
                }
            }
            if (spaPreviewData.secondPayment) {
                rows.push(`<tr><th>Second payment</th><td>${escapeHtml(spaPreviewData.secondPayment.dueFormatted)}</td></tr>`);
                if (spaPreviewData.secondPayment.isEarly) {
                    rows.push(`<tr><th></th><td>Paid early on ${escapeHtml(spaPreviewData.secondPayment.paidFormatted)}</td></tr>`);
                }
            }
        }
        if (result) {
            rows.push(`<tr class="section-head"><th colspan="2">Payment schedule</th></tr>`);
            rows.push(`<tr><th>NI code</th><td>${escapeHtml(result.ni)}</td></tr>`);
            rows.push(`<tr><th>Payment day</th><td>${escapeHtml(result.normalDay)}</td></tr>`);
            rows.push(`<tr><th>Payment cycle</th><td>${result.cycleDays} days</td></tr>`);
            if (nextPaymentDate) {
                rows.push(`<tr><th>Next payment</th><td>${escapeHtml(nextPaymentDate)}</td></tr>`);
            }
        }
        if (statePensionApplyInfo) {
            if (statePensionApplyInfo.applyNow) {
                rows.push(`<tr class="section-head"><th colspan="2">Claiming</th></tr>`);
                rows.push(`<tr><th>Apply now</th><td>from ${escapeHtml(statePensionApplyInfo.applyFromFormatted)}</td></tr>`);
            } else {
                rows.push(`<tr class="section-head"><th colspan="2">Claiming</th></tr>`);
                rows.push(`<tr><th>Apply from</th><td>${escapeHtml(statePensionApplyInfo.applyFromFormatted)} (${statePensionApplyInfo.countdownDays} day${statePensionApplyInfo.countdownDays === 1 ? "" : "s"} to go)</td></tr>`);
            }
        }
        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>UK State Pension Schedule Summary</title>
<style>
body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
h1 { font-size: 18px; margin: 0 0 16px; }
table { border-collapse: collapse; font-size: 14px; width: 100%; }
th { text-align: left; padding: 4px 16px 4px 0; color: #6b7280; font-weight: normal; white-space: nowrap; }
td { padding: 4px 0; font-weight: bold; }
tr.section-head th { padding-top: 14px; color: #111827; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; }
</style>
</head>
<body>
<h1>UK State Pension Schedule Summary</h1>
<table>${rows.join("")}</table>
</body>
</html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl, "_blank");
        if (!printWindow) {
            URL.revokeObjectURL(blobUrl);
            setSummaryActionStatus("Pop-up blocked. Allow pop-ups to print.");
            return;
        }
        const cleanup = () => URL.revokeObjectURL(blobUrl);
        let didPrint = false;
        const runPrint = () => {
            if (didPrint) return;
            didPrint = true;
            printWindow.focus();
            printWindow.print();
            setTimeout(() => { printWindow.close(); cleanup(); }, 150);
        };
        printWindow.addEventListener("load", () => { runPrint(); }, { once: true });
        setTimeout(() => { try { runPrint(); } finally { cleanup(); } }, 1000);
    }

    function buildPaymentListText(payments: Payment[]): string {
        const lines: string[] = [
            "UK State Pension Payment Dates",
            `Total payments: ${payments.length}`,
            "",
        ];

        payments.forEach((payment, index) => {
            const dateText = formatDateForCSV(payment.paid, "ddd, d mmmm yyyy");
            let line = `${index + 1}. ${dateText}`;

            if (payment.early) {
                line += ` (Early, due ${formatDateForCSV(payment.due, "dd-mmm-yyyy")})`;
            }
            if (payment.holidays?.length) {
                line += ` - ${payment.holidays.join(", ")}`;
            }

            lines.push(line);
        });

        return lines.join("\n");
    }

    async function handleCopyPaymentList(): Promise<void> {
        if (!result) return;
        const text = buildPaymentListText(result.payments);
        const ok = await copyTextToClipboard(text);
        setListActionStatus(
            ok
                ? "Payment list copied."
                : "Couldn't copy automatically — please try again."
        );
    }

    function handleSavePaymentList(): void {
        if (!result) return;
        const text = buildPaymentListText(result.payments);
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "pension-payment-dates.txt";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setListActionStatus("Payment list saved.");
    }

    function escapeHtml(input: string): string {
        return input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function handlePrintPaymentList(): void {
        if (typeof window === "undefined" || !result) return;
        const text = buildPaymentListText(result.payments);
        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>UK State Pension Payment Dates</title>
<style>
body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
h1 { font-size: 18px; margin: 0 0 12px; }
pre { white-space: pre-wrap; font-size: 14px; line-height: 1.45; margin: 0; }
</style>
</head>
<body>
<h1>UK State Pension Payment Dates</h1>
<pre>${escapeHtml(text)}</pre>
</body>
</html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl, "_blank");
        if (!printWindow) {
            URL.revokeObjectURL(blobUrl);
            setListActionStatus("Pop-up blocked. Allow pop-ups to print this list.");
            return;
        }

        const cleanup = () => URL.revokeObjectURL(blobUrl);
        let didPrint = false;
        const runPrint = () => {
            if (didPrint) return;
            didPrint = true;
            printWindow.focus();
            printWindow.print();
            setTimeout(() => {
                printWindow.close();
                cleanup();
            }, 150);
        };

        // Give the new document a moment to render before printing.
        printWindow.addEventListener("load", () => {
            runPrint();
        }, { once: true });

        // Safety fallback in case load event is missed.
        setTimeout(() => {
            try {
                runPrint();
            } finally {
                cleanup();
            }
        }, 1000);
    }
</script>

<div class="mb-3 border-l-4 border-blue-400 dark:border-blue-500 pl-2 flex items-start justify-between gap-2">
    <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule summary
        </h3>
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
    <p class="mb-2 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
        {summaryActionStatus}
    </p>
{/if}

{#if !spaPreviewData && !result}
    <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
        Enter your NI code and date of birth to see your schedule summary.
    </p>
{/if}

<!-- SPA details block -->
{#if spaPreviewData}
    <div class="mb-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/30 p-3">
        {#if spaPreviewData.showPre2016Warning}
            <div role="alert" class="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs min-[390px]:text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
                This calculator assumes your State Pension age is on or after <strong>6 April 2016</strong>. Your SPA appears to be earlier, so results may be inaccurate.
            </div>
        {/if}
        <p class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">State Pension Age</p>
        <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-white">{spaPreviewData.spaDateFormatted}</p>
        {#if spaPreviewData.spaSource !== "fixed"}
            <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">
                Age {spaPreviewData.spaAgeYears}{#if spaPreviewData.spaAgeMonths} years {spaPreviewData.spaAgeMonths} months{/if}
            </p>
        {/if}
        {#if spaPreviewData.firstPayment}
            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">First payment</p>
                <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-white">{spaPreviewData.firstPayment.dueFormatted}</p>
                <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">{spaPreviewData.firstPayment.comprisingText}</p>
                {#if spaPreviewData.firstPayment.isEarly}
                    <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">Paid early on {spaPreviewData.firstPayment.paidFormatted}.</p>
                {/if}
                {#if spaPreviewData.secondPayment}
                    <div class="mt-2">
                        <p class="text-xs min-[390px]:text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Second payment</p>
                        <p class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{spaPreviewData.secondPayment.dueFormatted}</p>
                        {#if spaPreviewData.secondPayment.isEarly}
                            <p class="mt-0.5 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300">Paid early on {spaPreviewData.secondPayment.paidFormatted}.</p>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

{#if result}
<div class="grid grid-cols-2 gap-2">
    <!-- NI Code -->
    <Card
        size="xl"
        class="p-2 bg-blue-50/90 dark:bg-blue-900/60 border-blue-200 dark:border-blue-700"
    >
        <p class="text-xs min-[390px]:text-sm font-semibold text-blue-600 dark:text-blue-300 uppercase">
            NI Code
        </p>
        <p class="text-sm font-bold text-blue-700 dark:text-blue-100">
            {result.ni}
        </p>
    </Card>
    <!-- Payment Day -->
    <Card
        size="xl"
        class="p-2 bg-emerald-50/90 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700"
    >
        <p class="text-xs min-[390px]:text-sm font-semibold text-emerald-600 dark:text-emerald-300 uppercase">
            Payment Day
        </p>
        <p class="text-sm font-bold text-emerald-700 dark:text-emerald-100">
            {result.normalDay}
        </p>
    </Card>
    <!-- Cycle — spans both columns when there is no next payment -->
    <Card
        size="xl"
        class="p-2 bg-violet-50/90 dark:bg-violet-900/60 border-violet-200 dark:border-violet-700 {nextPaymentDate ? '' : 'col-span-2'}"
    >
        <p class="text-xs min-[390px]:text-sm font-semibold text-violet-600 dark:text-violet-300 uppercase">
            Cycle
        </p>
        <p class="text-sm font-bold text-violet-700 dark:text-violet-100">
            {result.cycleDays}d
        </p>
    </Card>
    {#if nextPaymentDate}
        <!-- Next Payment Date (only shown when user is already past SPA) -->
        <Card
            size="xl"
            class="p-2 bg-cyan-50/90 dark:bg-cyan-900/60 border-cyan-200 dark:border-cyan-700"
        >
            <p class="text-xs min-[390px]:text-sm font-semibold text-cyan-600 dark:text-cyan-300 uppercase">
                Next Payment
            </p>
            <p class="text-sm font-bold text-cyan-700 dark:text-cyan-100">
                {nextPaymentDate}
            </p>
        </Card>
    {/if}
</div>
{/if}
{#if statePensionApplyInfo}
    {#if statePensionApplyInfo.applyNow}
        <!-- Eligible now: amber card (red if within 3 months of SPA) -->
        <Card
            size="xl"
            class="mt-2 p-2 {isWithinThreeMonthsOfSpa
                ? 'bg-red-50/90 dark:bg-red-900/60 border-red-300 dark:border-red-700'
                : 'bg-amber-50/90 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700'}"
        >
            <p class="text-xs min-[390px]:text-sm font-semibold uppercase {isWithinThreeMonthsOfSpa
                ? 'text-red-700 dark:text-red-200'
                : 'text-amber-700 dark:text-amber-200'}">
                Apply for your State Pension
            </p>
            <p class="mt-1 text-sm min-[390px]:text-base font-semibold {isWithinThreeMonthsOfSpa
                ? 'text-red-900 dark:text-red-100'
                : 'text-amber-900 dark:text-amber-100'}">
                You can apply now (from {statePensionApplyInfo.applyFromFormatted}).
            </p>
            {#if isWithinThreeMonthsOfSpa}
                <p class="mt-1 text-sm text-red-800 dark:text-red-200">
                    You are within 3 months of your State Pension age. If you have
                    not claimed yet, claim as soon as possible.
                </p>
            {/if}
            <a
                class="mt-2 inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium {isWithinThreeMonthsOfSpa
                    ? 'border-red-400 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-600 dark:bg-red-900/80 dark:text-red-100 dark:hover:bg-red-800'
                    : 'border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/80 dark:text-amber-100 dark:hover:bg-amber-800'}"
                href={spaDateIso ? `/claiming?spaDate=${encodeURIComponent(spaDateIso)}` : "/claiming"}
            >
                How to claim your State Pension
            </a>
        </Card>
    {:else}
        <!-- Not yet eligible: indigo countdown card -->
        <Card
            size="xl"
            class="mt-2 p-2 bg-indigo-50/90 dark:bg-indigo-900/60 border-indigo-200 dark:border-indigo-700"
        >
            <p class="text-xs min-[390px]:text-sm font-semibold text-indigo-700 dark:text-indigo-200">
                State Pension claim date
            </p>
            <p class="mt-1 text-sm text-indigo-900 dark:text-indigo-100">
                You can apply from {statePensionApplyInfo.applyFromFormatted} ({statePensionApplyInfo.countdownDays} day{statePensionApplyInfo.countdownDays === 1 ? "" : "s"} to go).
            </p>
            <a
                class="mt-2 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                href={spaDateIso ? `/claiming?spaDate=${encodeURIComponent(spaDateIso)}` : "/claiming"}
            >
                Claiming your State Pension
            </a>
        </Card>
    {/if}
{/if}
{#if result}
<div class="mt-3">
    <details class="custom-details group bg-gray-50/90 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-3">
        <summary class="custom-summary flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 list-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
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
                <p class="mt-2 text-xs min-[390px]:text-sm text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
                    {listActionStatus}
                </p>
            {/if}
            <ul class="mt-2 max-h-64 overflow-auto divide-y divide-gray-200 dark:divide-gray-700">
            {#each result.payments as p}
                <li class="py-2">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDateForCSV(p.paid, 'ddd, d mmmm yyyy')}
                            </div>
                            {#if p.early}
                                <div class="text-xs min-[390px]:text-sm text-orange-600 dark:text-orange-300">
                                    Early (due {formatDateForCSV(p.due, 'dd-mmm-yyyy')})
                                </div>
                            {/if}
                        </div>
                        {#if p.holidays && p.holidays.length}
                            <div class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400 ml-4 text-right">
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
{/if}
