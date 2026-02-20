<script lang="ts">
    import { Button, Card } from "flowbite-svelte";
    import type { Payment, PensionResult } from "$lib/pensionEngine";
    import { formatDateForCSV } from "$lib/utils/dateFormatting";
    import { copyTextToClipboard } from "$lib/utils/clipboard";

    export let result: PensionResult;
    export let spaDate: string = "";
    export let nextPaymentDate: string = "";
    let listActionStatus = "";
    let listActionStatusTimeout: ReturnType<typeof setTimeout> | null = null;

    // No JS-driven animation for the summary details: rely on native behaviour
    function setListActionStatus(message: string): void {
        listActionStatus = message;
        if (listActionStatusTimeout) clearTimeout(listActionStatusTimeout);
        listActionStatusTimeout = setTimeout(() => {
            listActionStatus = "";
            listActionStatusTimeout = null;
        }, 4000);
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
        const text = buildPaymentListText(result.payments);
        const ok = await copyTextToClipboard(text);
        setListActionStatus(
            ok
                ? "Payment list copied."
                : "Couldn't copy automatically — please try again."
        );
    }

    function handleSavePaymentList(): void {
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
        if (typeof window === "undefined") return;
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

<div class="mb-3">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Schedule summary
    </h3>
    <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-300">
        Generated from the payment calendar inputs.
    </p>
</div>

<div class="grid grid-cols-2 gap-2">
    <!-- NI Code -->
    <Card
        size="xl"
        class="p-2 bg-blue-50/90 dark:bg-blue-900/60 border-blue-200 dark:border-blue-700"
    >
        <p
            class="text-xs min-[390px]:text-sm font-semibold text-blue-600 dark:text-blue-300 uppercase"
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
        class="p-2 bg-emerald-50/90 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700"
    >
        <p
            class="text-xs min-[390px]:text-sm font-semibold text-emerald-600 dark:text-emerald-300 uppercase"
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
        class="p-2 bg-violet-50/90 dark:bg-violet-900/60 border-violet-200 dark:border-violet-700"
    >
        <p
            class="text-xs min-[390px]:text-sm font-semibold text-violet-600 dark:text-violet-300 uppercase"
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
        class="p-2 bg-orange-50/90 dark:bg-orange-900/60 border-orange-200 dark:border-orange-700"
    >
        <p
            class="text-xs min-[390px]:text-sm font-semibold text-orange-600 dark:text-orange-300 uppercase"
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
            class="p-2 bg-cyan-50/90 dark:bg-cyan-900/60 border-cyan-200 dark:border-cyan-700"
        >
            <p
                class="text-xs min-[390px]:text-sm font-semibold text-cyan-600 dark:text-cyan-300 uppercase"
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
    <details class="custom-details group bg-gray-50/90 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-3">
        <summary class="custom-summary flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 list-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
            <span>Show payment dates ({result.payments.length})</span>
                <span class="chev" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </span>
        </summary>

        <div class="details-content">
            <p class="mt-2 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-300">
                List actions apply to this dates list only. For full calendar files/views, use Calendar: Export and Print.
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
                <Button color="light" size="xs" onclick={handleCopyPaymentList}>
                    Copy list
                </Button>
                <Button color="light" size="xs" onclick={handleSavePaymentList}>
                    Save list
                </Button>
                <Button color="light" size="xs" onclick={handlePrintPaymentList}>
                    Print list
                </Button>
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

<style>
    /* Shared details/summary styling is defined in src/app.css */
    /* No animation: native details/summary behaviour for content */
    .details-content {
        display: block;
        max-height: none;
        opacity: 1;
        transform: none;
        overflow: visible;
        transition: none;
    }
</style>
