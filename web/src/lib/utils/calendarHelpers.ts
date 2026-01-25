/**
 * Calendar utility functions for date calculations and formatting
 */

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    const dow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    // Convert Sunday=0 to Monday=0 format
    return dow === 0 ? 6 : dow - 1;
}

export function monthName(month: number): string {
    return new Date(2000, month, 1).toLocaleDateString("en-GB", { month: "long" });
}

export function generateCalendarDays(year: number, month: number): (number | null)[] {
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

export function previousMonth(month: number, year: number): { month: number; year: number } {
    if (month === 0) {
        return { month: 11, year: year - 1 };
    }
    return { month: month - 1, year };
}

export function nextMonth(month: number, year: number): { month: number; year: number } {
    if (month === 11) {
        return { month: 0, year: year + 1 };
    }
    return { month: month + 1, year };
}
