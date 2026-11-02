import type { Payment, PensionResult } from "#lib/pensionEngine";
import { formatDateForCSV } from "#lib/utils/dateFormatting";
import { formatSpaAge } from "#lib/utils/statePensionAge";

export type StatePensionApplyInfo = {
    applyFromIso: string;
    applyFromFormatted: string;
    countdownDays: number;
    applyNow: boolean;
};

export type SpaPreviewData = {
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

export type SummaryInput = {
    result: PensionResult | null;
    nextPaymentDate: string;
    statePensionApplyInfo: StatePensionApplyInfo | null;
    spaPreviewData: SpaPreviewData | null;
};

/** "12 days to go" / "1 day to go". */
export function formatDaysToGo(days: number): string {
    return `${days} day${days === 1 ? "" : "s"} to go`;
}

export function escapeHtml(input: string): string {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const SUMMARY_TITLE = "Schedule Summary - UK State Pension Calendar";
const PAYMENT_LIST_TITLE = "Payment Dates - UK State Pension Calendar";

export function buildSummaryText({
    result,
    nextPaymentDate,
    statePensionApplyInfo,
    spaPreviewData,
}: SummaryInput): string {
    const lines: string[] = [SUMMARY_TITLE, ""];
    if (spaPreviewData) {
        lines.push(`State Pension age:  ${spaPreviewData.spaDateFormatted}`);
        if (spaPreviewData.spaSource !== "fixed") {
            lines.push(
                `                    ${formatSpaAge(spaPreviewData.spaAgeYears, spaPreviewData.spaAgeMonths)}`
            );
        }
        if (spaPreviewData.firstPayment) {
            lines.push("");
            lines.push(`First payment:      ${spaPreviewData.firstPayment.dueFormatted}`);
            lines.push(`                    ${spaPreviewData.firstPayment.comprisingText}`);
            if (spaPreviewData.firstPayment.isEarly) {
                lines.push(
                    `                    Paid early on ${spaPreviewData.firstPayment.paidFormatted}`
                );
            }
        }
        if (spaPreviewData.secondPayment) {
            lines.push(`Second payment:     ${spaPreviewData.secondPayment.dueFormatted}`);
            if (spaPreviewData.secondPayment.isEarly) {
                lines.push(
                    `                    Paid early on ${spaPreviewData.secondPayment.paidFormatted}`
                );
            }
        }
    }
    if (result) {
        if (spaPreviewData) lines.push("");
        lines.push(`NI number suffix:   ${result.ni}`);
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
            lines.push(
                `Apply from:         ${statePensionApplyInfo.applyFromFormatted} (${formatDaysToGo(statePensionApplyInfo.countdownDays)})`
            );
        }
    }
    return lines.join("\n");
}

export function buildSummaryHtml({
    result,
    nextPaymentDate,
    statePensionApplyInfo,
    spaPreviewData,
}: SummaryInput): string {
    const rows: string[] = [];
    if (spaPreviewData) {
        rows.push(`<tr class="section-head"><th colspan="2">State Pension</th></tr>`);
        rows.push(
            `<tr><th>State Pension age</th><td>${escapeHtml(spaPreviewData.spaDateFormatted)}</td></tr>`
        );
        if (spaPreviewData.spaSource !== "fixed") {
            rows.push(
                `<tr><th></th><td>${formatSpaAge(spaPreviewData.spaAgeYears, spaPreviewData.spaAgeMonths)}</td></tr>`
            );
        }
        if (spaPreviewData.firstPayment) {
            rows.push(
                `<tr><th>First payment</th><td>${escapeHtml(spaPreviewData.firstPayment.dueFormatted)}</td></tr>`
            );
            rows.push(
                `<tr><th></th><td>${escapeHtml(spaPreviewData.firstPayment.comprisingText)}</td></tr>`
            );
            if (spaPreviewData.firstPayment.isEarly) {
                rows.push(
                    `<tr><th></th><td>Paid early on ${escapeHtml(spaPreviewData.firstPayment.paidFormatted)}</td></tr>`
                );
            }
        }
        if (spaPreviewData.secondPayment) {
            rows.push(
                `<tr><th>Second payment</th><td>${escapeHtml(spaPreviewData.secondPayment.dueFormatted)}</td></tr>`
            );
            if (spaPreviewData.secondPayment.isEarly) {
                rows.push(
                    `<tr><th></th><td>Paid early on ${escapeHtml(spaPreviewData.secondPayment.paidFormatted)}</td></tr>`
                );
            }
        }
    }
    if (result) {
        rows.push(`<tr class="section-head"><th colspan="2">Payment schedule</th></tr>`);
        rows.push(`<tr><th>NI number suffix</th><td>${escapeHtml(result.ni)}</td></tr>`);
        rows.push(`<tr><th>Payment day</th><td>${escapeHtml(result.normalDay)}</td></tr>`);
        rows.push(`<tr><th>Payment cycle</th><td>${result.cycleDays} days</td></tr>`);
        if (nextPaymentDate) {
            rows.push(`<tr><th>Next payment</th><td>${escapeHtml(nextPaymentDate)}</td></tr>`);
        }
    }
    if (statePensionApplyInfo) {
        rows.push(`<tr class="section-head"><th colspan="2">Claiming</th></tr>`);
        if (statePensionApplyInfo.applyNow) {
            rows.push(
                `<tr><th>Apply now</th><td>from ${escapeHtml(statePensionApplyInfo.applyFromFormatted)}</td></tr>`
            );
        } else {
            rows.push(
                `<tr><th>Apply from</th><td>${escapeHtml(statePensionApplyInfo.applyFromFormatted)} (${formatDaysToGo(statePensionApplyInfo.countdownDays)})</td></tr>`
            );
        }
    }
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${SUMMARY_TITLE}</title>
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
<h1>${SUMMARY_TITLE}</h1>
<table>${rows.join("")}</table>
</body>
</html>`;
}

export function buildPaymentListText(payments: Payment[]): string {
    const lines: string[] = [PAYMENT_LIST_TITLE, `Total payments: ${payments.length}`, ""];

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

export function buildPaymentListHtml(text: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${PAYMENT_LIST_TITLE}</title>
<style>
body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
h1 { font-size: 18px; margin: 0 0 12px; }
pre { white-space: pre-wrap; font-size: 14px; line-height: 1.45; margin: 0; }
</style>
</head>
<body>
<h1>${PAYMENT_LIST_TITLE}</h1>
<pre>${escapeHtml(text)}</pre>
</body>
</html>`;
}

/** Download `text` as a plain-text file. */
export function downloadTextFile(text: string, filename: string): void {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Open `html` in a new window and print it. Returns false if the pop-up was blocked.
 */
export function printHtmlDocument(html: string): boolean {
    if (typeof window === "undefined") return false;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        return false;
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
    printWindow.addEventListener("load", () => runPrint(), { once: true });

    // Safety fallback in case the load event is missed.
    setTimeout(() => {
        try {
            runPrint();
        } finally {
            cleanup();
        }
    }, 1000);
    return true;
}
