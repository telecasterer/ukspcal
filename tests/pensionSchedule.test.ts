import { describe, it, expect } from "vitest";
import { generatePayments } from "../src/lib/pensionEngine";

describe("generatePayments", () => {
    it("generates a schedule for valid NI and years", () => {
        const ni = "22D";
        const startYear = 2025;
        const endYear = 2026;
        const cycleDays = 28;
        const bankHolidays = {};
        const result = generatePayments(
            ni,
            startYear,
            endYear,
            cycleDays,
            bankHolidays
        );
        expect(result.payments.length).toBeGreaterThan(0);
        expect(result.ni).toBe(ni);
        expect(result.payments[0]).toHaveProperty("paid");
    });

    it("returns empty payments if years are invalid", () => {
        const ni = "22D";
        const startYear = 2026;
        const endYear = 2025;
        const cycleDays = 28;
        const bankHolidays = {};
        const result = generatePayments(
            ni,
            startYear,
            endYear,
            cycleDays,
            bankHolidays
        );
        expect(result.payments.length).toBe(0);
    });
});
