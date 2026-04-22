import { describe, expect, it } from "vitest";
import { formatDateForCSV } from "../src/lib/utils/dateFormatting";

describe("formatDateForCSV", () => {
    it("formats dd/mm/yyyy", () => {
        expect(formatDateForCSV("2026-01-02", "dd/mm/yyyy")).toBe("02/01/2026");
    });

    it("formats dd-mmm-yyyy", () => {
        expect(formatDateForCSV("2026-01-02", "dd-mmm-yyyy")).toBe(
            "02-JAN-2026"
        );
    });

    it("formats yyyy-mm-dd", () => {
        expect(formatDateForCSV("2026-01-02", "yyyy-mm-dd")).toBe("2026-01-02");
    });

    it("formats mm/dd/yyyy", () => {
        expect(formatDateForCSV("2026-01-02", "mm/dd/yyyy")).toBe("01/02/2026");
    });

    it("formats ddd, d mmmm yyyy", () => {
        // 2026-01-02 is a Friday.
        expect(formatDateForCSV("2026-01-02", "ddd, d mmmm yyyy")).toBe(
            "Fri, 2 January 2026"
        );
    });

    it("uses UTC day name for a Monday midnight UTC date (timezone regression)", () => {
        // 2026-03-02 is Monday in UTC. Without timeZone:"UTC" in toLocaleDateString,
        // a device in UTC-1 or earlier (e.g. Canada) would render it as "Sun, 1 March 2026".
        expect(formatDateForCSV("2026-03-02", "ddd, d mmmm yyyy")).toBe(
            "Mon, 2 March 2026"
        );
    });

    it("uses UTC month name for a date at midnight UTC (timezone regression)", () => {
        // 2026-03-01 00:00 UTC is 2026-02-28 in UTC-1 — would give wrong month without timeZone:"UTC".
        expect(formatDateForCSV("2026-03-01", "ddd, d mmmm yyyy")).toBe(
            "Sun, 1 March 2026"
        );
    });
});
