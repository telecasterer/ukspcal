/**
 * Returns true if the value is a valid ISO yyyy-mm-dd date string.
 */
export function isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Subtract a number of calendar months from an ISO yyyy-mm-dd date string.
 * The day is clamped to the last day of the target month if necessary.
 */
export function subtractMonthsFromIso(iso: string, months: number): string {
    const [year, month, day] = iso.split("-").map((v) => Number.parseInt(v, 10));
    const start = Date.UTC(year, month - 1, 1);
    const target = new Date(start);
    target.setUTCMonth(target.getUTCMonth() - months);
    const targetYear = target.getUTCFullYear();
    const targetMonth = target.getUTCMonth() + 1;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    const clampedDay = Math.min(day, lastDay);
    return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

/**
 * Format an ISO yyyy-mm-dd date string as a long human-readable date
 * (e.g. "Wednesday, 1 January 2025").
 */
export function formatIsoDateLong(iso: string): string {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

/**
 * Return the number of whole days from today (UTC) until the given ISO date.
 * Returns 0 if the date is today or in the past.
 */
export function daysUntilIso(iso: string): number {
    const now = new Date();
    const todayUtc = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );
    const target = new Date(iso + "T00:00:00Z");
    const targetUtc = Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        target.getUTCDate()
    );
    return Math.max(0, Math.ceil((targetUtc - todayUtc) / 86400000));
}
