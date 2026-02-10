import { describe, expect, it, vi } from "vitest";
import { fetchUKBankHolidays } from "../src/lib/fetchBankHolidays";

describe("fetchUKBankHolidays", () => {
    it("maps GOV.UK response to ISO->title map", async () => {
        const mockFetch = vi.fn(async () => {
            return {
                ok: true,
                status: 200,
                statusText: "OK",
                json: async () => ({
                    "england-and-wales": {
                        division: "england-and-wales",
                        events: [
                            {
                                title: "New Year's Day",
                                date: "2026-01-01",
                                notes: "",
                                bunting: true,
                            },
                        ],
                    },
                }),
            } as any;
        });

        const map = await fetchUKBankHolidays(mockFetch as any);
        expect(map["2026-01-01"]).toBe("New Year's Day");
    });

    it("falls back to a minimal map on fetch error", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const mockFetch = vi.fn(async () => {
            throw new Error("network");
        });

        const map = await fetchUKBankHolidays(mockFetch as any);
        expect(map).toHaveProperty("2026-01-01");
        expect(map).toHaveProperty("2026-12-25");
    });
});
