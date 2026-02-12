// Default values for ICS alarm
export const DEFAULT_ICS_ALARM_TITLE = "Upcoming UK State Pension Payment";
export const DEFAULT_ICS_ALARM_DESCRIPTION =
    "Your UK state pension payment is due soon.";
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
    icsEventTime?: string; // e.g. '12:00'
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
    return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
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

    // Compute days early as difference between scheduled due date and actual paid date.
    const dueDate = new Date(payment.due + "T00:00:00Z");
    const paidDate = new Date(payment.paid + "T00:00:00Z");
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysEarly = Math.round((dueDate.getTime() - paidDate.getTime()) / msPerDay);

    // If holiday names are available on the payment, return a friendly phrase
    // like "(3 days early due to Christmas Day)". Otherwise, fall back to
    // weekend-aware or generic phrasing.
    const holidayNames = payment.holidays && payment.holidays.length
        ? payment.holidays.join(", ")
        : null;
    const plural = daysEarly === 1 ? "day" : "days";
    if (holidayNames) {
        return `Early (${daysEarly} ${plural} early due to ${holidayNames})`;
    }

    // If the due date itself falls on a weekend, indicate that.
    const dueDow = dueDate.getUTCDay();
    if (dueDow === 0)
        return `Early (${daysEarly} ${plural} early due to Sunday)`;
    if (dueDow === 6)
        return `Early (${daysEarly} ${plural} early due to Saturday)`;

    return `Early (${daysEarly} ${plural} early)`;
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
            notes,
        ]);
    });

    const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
            row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
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
    const sortedPayments = [...payments].sort((a, b) =>
        a.paid.localeCompare(b.paid)
    );
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
        "METHOD:PUBLISH",
    ];

    const firstPayment = new Date(standardPayments[0].paid + "T00:00:00Z");
    const lastPayment = standardPayments[standardPayments.length - 1];
    const endDate = formatDateYYYYMMDD(
        new Date(lastPayment.paid + "T00:00:00Z")
    );

    // Parse event time (HH:mm) or default to 12:00
    let eventTime = options.icsEventTime || "12:00";
    let [eventHour, eventMinute] = eventTime.split(":").map(Number);
    if (isNaN(eventHour) || isNaN(eventMinute)) {
        eventHour = 12;
        eventMinute = 0;
    }

    // Use the actual early payment dates as EXDATEs.
    // This matches the legacy GAS export and avoids edge-cases where inferring a "due date"
    // from neighbouring payments can be wrong (e.g. consecutive early payments).
    const exdates = earlyPayments.map((p) =>
        formatDateYYYYMMDD(new Date(p.paid + "T00:00:00Z"))
    );

    const eventName = escapeICSText((options.icsEventName ?? "").trim());
    const category = escapeICSText((options.icsCategory ?? "").trim());
    const color = (options.icsColor ?? "").trim();
    const isHexColor = /^#[0-9a-f]{6}$/i.test(color);

    // ---- Recurring event (standard schedule) ----

    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:uksp-recurring-${escapeICSText(result.ni)}@ukspcal`);
    icsLines.push(`DTSTAMP:${dtstamp}`);
    // DTSTART/DTEND as date-time with time
    const dtStartDate = new Date(firstPayment);
    dtStartDate.setUTCHours(eventHour, eventMinute, 0, 0);
    const dtEndDate = new Date(dtStartDate.getTime() + 60 * 60 * 1000); // 1 hour event
    function formatLocalTimeICS(date: Date) {
        // YYYYMMDDTHHMMSS (no Z, no TZID)
        const pad = (n: number) => n.toString().padStart(2, "0");
        return (
            date.getFullYear().toString() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            "T" +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds())
        );
    }
    icsLines.push(`DTSTART:${formatLocalTimeICS(dtStartDate)}`);
    icsLines.push(`DTEND:${formatLocalTimeICS(dtEndDate)}`);
    icsLines.push(
        `RRULE:FREQ=DAILY;INTERVAL=${result.cycleDays};UNTIL=${endDate}`
    );
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
    if (
        options.icsAlarmEnabled &&
        options.icsAlarmDaysBefore &&
        options.icsAlarmDaysBefore > 0
    ) {
        const trigger = `-P${options.icsAlarmDaysBefore}D`;
        icsLines.push("BEGIN:VALARM");
        icsLines.push("ACTION:DISPLAY");
        icsLines.push(
            `DESCRIPTION:${escapeICSText(DEFAULT_ICS_ALARM_DESCRIPTION)}`
        );
        icsLines.push(`SUMMARY:${escapeICSText(DEFAULT_ICS_ALARM_TITLE)}`);
        icsLines.push(`TRIGGER:${trigger}`);
        icsLines.push("END:VALARM");
    }

    icsLines.push("END:VEVENT");

    // ---- Early payment overrides (explicit single events) ----

    for (const earlyPayment of earlyPayments) {
        const paidDate = new Date(earlyPayment.paid + "T00:00:00Z");
        const note = getPaymentStatus(earlyPayment, result);

        icsLines.push("BEGIN:VEVENT");
        icsLines.push(
            `UID:uksp-early-${formatDateYYYYMMDD(paidDate)}-${escapeICSText(result.ni)}@ukspcal`
        );
        icsLines.push(`DTSTAMP:${dtstamp}`);
        // Use event time for early payments too
        const dtStartDate = new Date(paidDate);
        dtStartDate.setUTCHours(eventHour, eventMinute, 0, 0);
        const dtEndDate = new Date(dtStartDate.getTime() + 60 * 60 * 1000);
        icsLines.push(`DTSTART:${formatLocalTimeICS(dtStartDate)}`);
        icsLines.push(`DTEND:${formatLocalTimeICS(dtEndDate)}`);
        icsLines.push(
            `SUMMARY:${(eventName || "UK State Pension") + " (paid early)"}`
        );
        icsLines.push(`DESCRIPTION:${escapeICSText(note)}`);

        if (category) {
            icsLines.push(`CATEGORIES:${category}`);
        }
        if (color && isHexColor) {
            icsLines.push(`X-APPLE-CALENDAR-COLOR:${color}`);
        }

        // --- Add VALARM for early payment if enabled ---
        if (
            options.icsAlarmEnabled &&
            options.icsAlarmDaysBefore &&
            options.icsAlarmDaysBefore > 0
        ) {
            const trigger = `-P${options.icsAlarmDaysBefore}D`;
            icsLines.push("BEGIN:VALARM");
            icsLines.push("ACTION:DISPLAY");
            icsLines.push(
                `DESCRIPTION:${escapeICSText(DEFAULT_ICS_ALARM_DESCRIPTION)}`
            );
            icsLines.push(`SUMMARY:${escapeICSText(DEFAULT_ICS_ALARM_TITLE)}`);
            icsLines.push(`TRIGGER:${trigger}`);
            icsLines.push("END:VALARM");
        }

        icsLines.push("END:VEVENT");
    }

    icsLines.push("END:VCALENDAR");

    const foldedLines = icsLines.flatMap((line) => foldICSLine(line));
    const icsContent = foldedLines.join("\r\n");
    const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8;",
    });
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
