// Default values for ICS alarm
export const DEFAULT_ICS_ALARM_TITLE = "Upcoming UK State Pension Payment";
export const DEFAULT_ICS_ALARM_DESCRIPTION = "Your UK state pension payment is due soon.";
/**
 * Export utilities for CSV, ICS, and print functionality
 *
 * Includes helpers for formatting dates, escaping text, and folding lines for iCalendar export.
 */

import type { PensionResult, Payment } from "$lib/pensionEngine";
import { formatDateForCSV, type DateFormat } from "./dateFormatting";

/**
 * Options for export (CSV, ICS, etc.)
 */
export interface ExportOptions {
    csvDateFormat: DateFormat;
    icsEventName: string;
    icsCategory: string;
    icsColor: string;
    icsAlarmEnabled?: boolean;
    icsAlarmDaysBefore?: number;
    icsAlarmTitle?: string;
    icsAlarmDescription?: string;
}

/**
 * Format a Date as YYYYMMDD (for ICS export).
 */
function formatDateYYYYMMDD(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Format a Date as UTC timestamp (YYYYMMDDTHHMMSSZ) for ICS export.
 */
function formatUtcTimestampYYYYMMDDTHHMMSSZ(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * Escape text values for iCalendar (RFC 5545).
 */
function escapeICSText(text: string): string {
    return String(text ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * Fold a single iCalendar content line to 75 octets (RFC 5545).
 */
function foldICSLine(line: string, maxOctets = 75): string[] {
    const encoder = new TextEncoder();
    const out: string[] = [];
    let remaining = line;
    let prefix = "";
    while (remaining.length > 0) {
        let cut = remaining.length;
        while (cut > 0) {
            const candidate = prefix + remaining.slice(0, cut);
            if (encoder.encode(candidate).length <= maxOctets) {
                break;
            }
            cut -= 1;
        }
        // Fallback: ensure progress even if a single codepoint exceeds the limit.
        if (cut === 0) {
            cut = 1;
        }
        out.push(prefix + remaining.slice(0, cut));
        remaining = remaining.slice(cut);
        prefix = " ";
    }

    return out;
}

/**
 * Get payment status description
 */
function getPaymentStatus(payment: Payment, result: PensionResult): string {
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
    const sortedPayments = [...payments].sort((a, b) => a.paid.localeCompare(b.paid));
    const standardPayments = sortedPayments.filter((p) => !p.early);
    const earlyPayments = sortedPayments.filter((p) => p.early);

    if (standardPayments.length === 0) {
        alert("No standard payments found to create calendar event");
        return;
    }

    const now = new Date();
    const dtstamp = formatUtcTimestampYYYYMMDDTHHMMSSZ(now);

    const icsLines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//UK Pension Calendar//NONSGML v1.0//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ];

    const firstPayment = new Date(standardPayments[0].paid + "T00:00:00Z");
    const lastPayment = standardPayments[standardPayments.length - 1];
    const endDate = formatDateYYYYMMDD(new Date(lastPayment.paid + "T00:00:00Z"));

    // Use the actual early payment dates as EXDATEs.
    // This matches the legacy GAS export and avoids edge-cases where inferring a "due date"
    // from neighbouring payments can be wrong (e.g. consecutive early payments).
    const exdates = earlyPayments.map((p) => formatDateYYYYMMDD(new Date(p.paid + "T00:00:00Z")));

    const eventName = escapeICSText((options.icsEventName ?? "").trim());
    const category = escapeICSText((options.icsCategory ?? "").trim());
    const color = (options.icsColor ?? "").trim();
    const isHexColor = /^#[0-9a-f]{6}$/i.test(color);

    // ---- Recurring event (standard schedule) ----

    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:uksp-recurring-${escapeICSText(result.ni)}@ukspcal`);
    icsLines.push(`DTSTAMP:${dtstamp}`);
    icsLines.push(`DTSTART;VALUE=DATE:${formatDateYYYYMMDD(firstPayment)}`);
    icsLines.push(`DTEND;VALUE=DATE:${formatDateYYYYMMDD(new Date(firstPayment.getTime() + 86400000))}`);
    icsLines.push(`RRULE:FREQ=DAILY;INTERVAL=${result.cycleDays};UNTIL=${endDate}`);
    icsLines.push(`SUMMARY:${eventName || "UK State Pension"}`);

    if (category) {
        icsLines.push(`CATEGORIES:${category}`);
    }

    if (color) {
        if (isHexColor) {
            icsLines.push(`X-APPLE-CALENDAR-COLOR:${color}`);
        } else {
            icsLines.push(`COLOR:${escapeICSText(color)}`);
        }
    }

    for (const exdate of exdates) {
        icsLines.push(`EXDATE;VALUE=DATE:${exdate}`);
    }

    // --- Add VALARM for recurring event if enabled ---
    if (options.icsAlarmEnabled && options.icsAlarmDaysBefore && options.icsAlarmDaysBefore > 0) {
        const trigger = `-P${options.icsAlarmDaysBefore}D`;
        icsLines.push("BEGIN:VALARM");
        icsLines.push("ACTION:DISPLAY");
        icsLines.push(`DESCRIPTION:${escapeICSText(options.icsAlarmDescription || DEFAULT_ICS_ALARM_DESCRIPTION)}`);
        icsLines.push(`SUMMARY:${escapeICSText(options.icsAlarmTitle || DEFAULT_ICS_ALARM_TITLE)}`);
        icsLines.push(`TRIGGER:${trigger}`);
        icsLines.push("END:VALARM");
    }

    icsLines.push("END:VEVENT");

    // ---- Early payment overrides (explicit single events) ----

    for (const earlyPayment of earlyPayments) {
        const paidDate = new Date(earlyPayment.paid + "T00:00:00Z");
        const note = getPaymentStatus(earlyPayment, result);

        icsLines.push("BEGIN:VEVENT");
        icsLines.push(`UID:uksp-early-${formatDateYYYYMMDD(paidDate)}-${escapeICSText(result.ni)}@ukspcal`);
        icsLines.push(`DTSTAMP:${dtstamp}`);
        icsLines.push(`DTSTART;VALUE=DATE:${formatDateYYYYMMDD(paidDate)}`);
        icsLines.push(`DTEND;VALUE=DATE:${formatDateYYYYMMDD(new Date(paidDate.getTime() + 86400000))}`);
        icsLines.push(`SUMMARY:${(eventName || "UK State Pension") + " (paid early)"}`);
        icsLines.push(`DESCRIPTION:${escapeICSText(note)}`);

        if (category) {
            icsLines.push(`CATEGORIES:${category}`);
        }
        if (color && isHexColor) {
            icsLines.push(`X-APPLE-CALENDAR-COLOR:${color}`);
        }

        // --- Add VALARM for early payment if enabled ---
        if (options.icsAlarmEnabled && options.icsAlarmDaysBefore && options.icsAlarmDaysBefore > 0) {
            const trigger = `-P${options.icsAlarmDaysBefore}D`;
            icsLines.push("BEGIN:VALARM");
            icsLines.push("ACTION:DISPLAY");
            icsLines.push(`DESCRIPTION:${escapeICSText(options.icsAlarmDescription || DEFAULT_ICS_ALARM_DESCRIPTION)}`);
            icsLines.push(`SUMMARY:${escapeICSText(options.icsAlarmTitle || DEFAULT_ICS_ALARM_TITLE)}`);
            icsLines.push(`TRIGGER:${trigger}`);
            icsLines.push("END:VALARM");
        }

        icsLines.push("END:VEVENT");
    }

    icsLines.push("END:VCALENDAR");

    const foldedLines = icsLines.flatMap((line) => foldICSLine(line));
    const icsContent = foldedLines.join("\r\n");
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
