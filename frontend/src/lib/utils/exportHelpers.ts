/**
 * Export utilities for CSV, ICS, and print functionality
 */

import type { PensionResult, Payment } from "$lib/pensionEngine";
import { formatDateForCSV, type DateFormat } from "./dateFormatting";

export interface ExportOptions {
    csvDateFormat: DateFormat;
    icsEventName: string;
    icsCategory: string;
    icsColor: string;
}

/**
 * Get payment status description
 */
export function getPaymentStatus(payment: Payment, result: PensionResult): string {
    if (!payment.early) return "On time";

    const paymentDate = new Date(payment.paid + "T00:00:00Z");
    const daysEarly = result.cycleDays - (paymentDate.getUTCDate() % result.cycleDays || result.cycleDays);

    if (paymentDate.getUTCDay() === 0) return "Early (Sunday)";
    if (paymentDate.getUTCDay() === 6) return "Early (Saturday)";
    return `Early (Holiday, ${daysEarly}d)`;
}

/**
 * Export payments as CSV
 */
export function exportCSV(
    payments: Payment[],
    result: PensionResult,
    csvDateFormat: DateFormat
): void {
    const headers = ["Date", "Day", "Status", "Notes"];
    const rows: string[][] = [];

    payments.forEach((payment) => {
        const date = new Date(payment.paid + "T00:00:00Z");
        const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });
        const status = payment.early ? "Early" : "On Time";
        const notes = getPaymentStatus(payment, result);

        rows.push([
            formatDateForCSV(payment.paid, csvDateFormat),
            dayName,
            status,
            notes
        ]);
    });

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "pension-payments.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate ICS calendar file
 */
export function generateICS(
    payments: Payment[],
    result: PensionResult,
    options: ExportOptions
): void {
    const standardPayments = payments.filter((p) => !p.early);
    const earlyPayments = payments.filter((p) => p.early);

    if (standardPayments.length === 0) {
        alert("No standard payments found to create calendar event");
        return;
    }

    const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//UK Pension Calendar//NONSGML v1.0//EN",
        "CALSCALE:GREGORIAN"
    ];

    const firstPayment = new Date(standardPayments[0].paid + "T00:00:00Z");
    const lastPayment = standardPayments[standardPayments.length - 1];
    const endDate = new Date(lastPayment.paid + "T00:00:00Z").toISOString().split("T")[0].replace(/-/g, "");

    const exdates = earlyPayments
        .map((p, pIdx) => {
            const date = new Date(p.paid + "T00:00:00Z");
            const nextIdx = payments.indexOf(p) + 1;
            if (nextIdx < payments.length) {
                const nextDate = new Date(payments[nextIdx].paid + "T00:00:00Z");
                const originalDate = new Date(nextDate);
                originalDate.setUTCDate(originalDate.getUTCDate() - result.cycleDays);
                return originalDate.toISOString().split("T")[0].replace(/-/g, "");
            }
            return null;
        })
        .filter((d) => d !== null) as string[];

    const category = (options.icsCategory ?? "").trim();
    const color = (options.icsColor ?? "").trim();
    const isHexColor = /^#[0-9a-f]{6}$/i.test(color);

    const eventLines: string[] = [
        "BEGIN:VEVENT",
        `SUMMARY:${options.icsEventName}`,
        `DTSTART;VALUE=DATE:${firstPayment.toISOString().split("T")[0].replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${new Date(firstPayment.getTime() + 86400000).toISOString().split("T")[0].replace(/-/g, "")}`,
        `RRULE:FREQ=DAILY;INTERVAL=${result.cycleDays};UNTIL=${endDate}`,
        `UID:pension-${result.ni}-${Date.now()}@ukspcal`
    ];

    if (category) {
        eventLines.splice(2, 0, `CATEGORIES:${category}`);
    }

    // COLOR is defined in RFC 7986 (typically as a CSS color name). Many clients ignore it.
    // Apple Calendar often supports X-APPLE-CALENDAR-COLOR with hex values.
    if (color) {
        if (isHexColor) {
            eventLines.splice(2, 0, `X-APPLE-CALENDAR-COLOR:${color}`);
        } else {
            eventLines.splice(2, 0, `COLOR:${color}`);
        }
    }

    icsLines.push(...eventLines);

    if (exdates.length > 0) {
        icsLines.push(`EXDATE;VALUE=DATE:${exdates.join(",")}`);
    }

    icsLines.push("END:VEVENT", "END:VCALENDAR");

    const icsContent = icsLines.join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "pension-calendar.ics");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Trigger browser print dialog
 */
export function printCalendar(): void {
    window.print();
}
