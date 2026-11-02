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
 * Return the number of whole days from today until the given ISO date,
 * counting from `todayIso` (defaults to the device's local date).
 * Returns 0 if the date is today or in the past.
 */
export function daysUntilIso(iso: string, todayIso: string = computeTodayIso()): number {
    const now = new Date(todayIso + "T00:00:00Z");
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const target = new Date(iso + "T00:00:00Z");
    const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
    return Math.max(0, Math.ceil((targetUtc - todayUtc) / 86400000));
}

/**
 * Describe a number of days as a short phrase: "today", "tomorrow", "in 5 days"
 * or "in 2 weeks, 3 days".
 */
export function formatDaysAway(days: number): string {
    if (days <= 0) return "today";
    if (days === 1) return "tomorrow";
    if (days < 7) return `in ${days} days`;
    const weeks = Math.floor(days / 7);
    const rest = days % 7;
    const weeksText = `${weeks} week${weeks === 1 ? "" : "s"}`;
    return rest === 0 ? `in ${weeksText}` : `in ${weeksText}, ${rest} day${rest === 1 ? "" : "s"}`;
}

/**
 * Today's calendar date (yyyy-mm-dd) in the device's local time zone.
 *
 * Deliberately not `toISOString()`: that is the UTC date, which is a day behind
 * for users east of UTC after local midnight and a day ahead for users west of
 * UTC in the evening. Payment dates elsewhere are zone-free calendar dates
 * (parsed and formatted as UTC), so only "today" needs the local date.
 */
export function computeTodayIso(now: Date = new Date()): string {
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}
