import { describe, expect, it } from "vitest";
import {
    generateCalendarDays,
    monthName,
    nextMonth,
    previousMonth
} from "../src/lib/utils/calendarHelpers";

describe("calendarHelpers", () => {
    it("returns correct month name", () => {
        expect(monthName(0)).toBe("January");
        expect(monthName(11)).toBe("December");
    });

    it("generates correct number of days for a leap year month", () => {
        const days = generateCalendarDays(2024, 1); // Feb 2024
        const nonNullDays = days.filter((d) => d !== null);
        expect(nonNullDays.length).toBe(29);
    });

    it("calculates previous month across year boundary", () => {
        expect(previousMonth(0, 2024)).toEqual({ month: 11, year: 2023 });
    });

    it("calculates next month across year boundary", () => {
        expect(nextMonth(11, 2024)).toEqual({ month: 0, year: 2025 });
    });
});
