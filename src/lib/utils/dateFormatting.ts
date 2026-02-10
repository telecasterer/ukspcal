/**
 * Date formatting utilities for CSV export and display
 */

/**
 * Supported date formats for export and display.
 */
export type DateFormat =
    | "dd/mm/yyyy"
    | "dd-mmm-yyyy"
    | "yyyy-mm-dd"
    | "mm/dd/yyyy"
    | "ddd, d mmmm yyyy";

/**
 * Format a date string (ISO yyyy-mm-dd) for CSV export, using the given format.
 */
export function formatDateForCSV(dateStr: string, format: DateFormat): string {
    const date = new Date(dateStr + "T00:00:00Z");
    const day = date.getUTCDate().toString().padStart(2, "0");
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = date.getUTCFullYear();
    const monthName = date
        .toLocaleDateString("en-GB", { month: "short" })
        .toUpperCase();
    const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
    const fullMonthName = date.toLocaleDateString("en-GB", { month: "long" });
    switch (format) {
        case "dd/mm/yyyy":
            return `${day}/${month}/${year}`;
        case "dd-mmm-yyyy":
            return `${day}-${monthName}-${year}`;
        case "yyyy-mm-dd":
            return `${year}-${month}-${day}`;
        case "mm/dd/yyyy":
            return `${month}/${day}/${year}`;
        case "ddd, d mmmm yyyy":
            return `${dayName}, ${parseInt(day)} ${fullMonthName} ${year}`;
        default:
            return `${day}/${month}/${year}`;
    }
}

/**
 * List of supported date formats and their display labels.
 */
export const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
    { value: "dd/mm/yyyy", label: "dd/mm/yyyy" },
    { value: "dd-mmm-yyyy", label: "dd-mmm-yyyy" },
    { value: "yyyy-mm-dd", label: "yyyy-mm-dd" },
    { value: "mm/dd/yyyy", label: "mm/dd/yyyy (US)" },
    { value: "ddd, d mmmm yyyy", label: "ddd, dd MMMM yyyy" },
];
