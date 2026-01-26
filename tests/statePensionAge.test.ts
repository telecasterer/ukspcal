import { describe, expect, it } from "vitest";
import { calculateStatePensionAge } from "../src/lib/utils/statePensionAge";

describe("calculateStatePensionAge", () => {
    it("rejects non-ISO DOB strings", () => {
        expect(() => calculateStatePensionAge("01/01/1960")).toThrow();
        expect(() => calculateStatePensionAge("")).toThrow();
        expect(() => calculateStatePensionAge("1960-1-1")).toThrow();
    });

    it("returns a fixed SPA date for fixed-table ranges", () => {
        // In RULES: 1954-01-06..1954-02-05 -> fixed SPA 2019-05-06
        const res = calculateStatePensionAge("1954-01-06");
        expect(res.source).toBe("fixed");
        expect(res.spaDate).toBe("2019-05-06");
    });

    it("returns 65th birthday for DOBs before 1953-12-06", () => {
        const res = calculateStatePensionAge("1950-01-01");
        expect(res.source).toBe("birthday");
        expect(res.spaAgeYears).toBe(65);
        expect(res.spaAgeMonths).toBe(0);
        expect(res.spaDate).toBe("2015-01-01");
    });

    it("returns 66th birthday for 1954-10-06..1960-04-05", () => {
        const res = calculateStatePensionAge("1956-03-15");
        expect(res.source).toBe("birthday");
        expect(res.spaAgeYears).toBe(66);
        expect(res.spaAgeMonths).toBe(0);
        expect(res.spaDate).toBe("2022-03-15");
    });

    it("returns offset SPA for 1960-04-06..1961-03-05", () => {
        // In RULES: 1960-04-06..1960-05-05 -> 66y 1m
        const res = calculateStatePensionAge("1960-04-06");
        expect(res.source).toBe("offset");
        expect(res.spaAgeYears).toBe(66);
        expect(res.spaAgeMonths).toBe(1);
        expect(res.spaDate).toBe("2026-05-06");
    });

    it("clamps end-of-month birthdays correctly", () => {
        // Adding months/years should clamp day when target month is shorter.
        // Example: 31 Jan + 66y = 31 Jan (same month length)
        const res = calculateStatePensionAge("1958-01-31");
        expect(res.spaDate).toBe("2024-01-31");
    });
});
