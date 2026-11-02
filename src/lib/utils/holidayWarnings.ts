/**
 * Format a list of years as "2026" or "2026–2028".
 */
export function formatYearRange(years: number[]): string {
    const sorted = [...years].sort((a, b) => a - b);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return first === last ? String(first) : `${first}–${last}`;
}

/**
 * User-facing warnings about UK bank holiday data that is unavailable or failed to load.
 */
export function buildUkHolidayWarnings(
    unsupportedYears: number[],
    missingYears: number[]
): string[] {
    const warnings: string[] = [];
    if (unsupportedYears.length > 0) {
        warnings.push(
            `There's no UK bank holiday data for ${formatYearRange(unsupportedYears)}, so payments in those years are only moved for weekends, not bank holidays.`
        );
    }
    if (missingYears.length > 0) {
        warnings.push(
            `Couldn't load UK bank holidays for ${formatYearRange(missingYears)}, so payments due on a bank holiday may show on the wrong day. Check your connection and reload to try again.`
        );
    }
    return warnings;
}
