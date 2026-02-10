/**
 * Calendar utility functions for date calculations and formatting
 */

/**
 * Get the number of days in a month (1-based month, 0=Jan).
 */
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week (0=Monday) for the first day of a month.
 */
function getFirstDayOfMonth(year: number, month: number): number {
    const dow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    // Convert Sunday=0 to Monday=0 format
    return dow === 0 ? 6 : dow - 1;
}

/**
 * Get the full month name for a given month index (0=Jan).
 */
export function monthName(month: number): string {
    return new Date(2000, month, 1).toLocaleDateString("en-GB", {
        month: "long",
    });
}

/**
 * Generate an array of days for a calendar month, with nulls for leading blanks.
 */
export function generateCalendarDays(
    year: number,
    month: number
): (number | null)[] {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (number | null)[] = [];
    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }
    return days;
}

/**
 * Get the previous month/year, wrapping around January.
 */
export function previousMonth(
    month: number,
    year: number
): { month: number; year: number } {
    if (month === 0) {
        return { month: 11, year: year - 1 };
    }
    return { month: month - 1, year };
}

/**
 * Get the next month/year, wrapping around December.
 */
export function nextMonth(
    month: number,
    year: number
): { month: number; year: number } {
    if (month === 11) {
        return { month: 0, year: year + 1 };
    }
    return { month: month + 1, year };
}
