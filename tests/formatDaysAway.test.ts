import { describe, expect, it } from "vitest";
import { daysUntilIso, formatDaysAway } from "#lib/utils/isoDateHelpers";

describe("formatDaysAway", () => {
    it.each([
        [0, "today"],
        [1, "tomorrow"],
        [6, "in 6 days"],
        [7, "in 1 week"],
        [8, "in 1 week, 1 day"],
        [17, "in 2 weeks, 3 days"],
        [28, "in 4 weeks"],
    ])("%i days -> %s", (days, expected) => {
        expect(formatDaysAway(days)).toBe(expected);
    });
});

describe("daysUntilIso with an explicit today", () => {
    it("counts from the supplied date", () => {
        expect(daysUntilIso("2026-11-20", "2026-11-02")).toBe(18);
        expect(daysUntilIso("2026-11-01", "2026-11-02")).toBe(0);
    });
});
