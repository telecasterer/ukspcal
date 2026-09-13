import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    fetchHolidaysForCountryAndYear,
    fetchHolidaysForCountryAndYears,
    HolidayFetchError,
    UnsupportedHolidayYearError,
    type NagerHoliday,
} from "../src/lib/services/nagerHolidayService";

describe("nagerHolidayService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("fetchHolidaysForCountryAndYear", () => {
        it("fetches holidays for a given country and year", async () => {
            const mockHolidays: NagerHoliday[] = [
                {
                    date: "2026-01-01",
                    localName: "Jour de l'an",
                    name: "New Year",
                    countryCode: "FR",
                    fixed: true,
                    global: true,
                    type: "Public",
                },
                {
                    date: "2026-07-14",
                    localName: "Fête nationale",
                    name: "Bastille Day",
                    countryCode: "FR",
                    fixed: true,
                    global: true,
                    type: "Public",
                },
            ];

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockHolidays,
            });

            const result = await fetchHolidaysForCountryAndYear("FR", 2026);

            expect(result).toEqual(mockHolidays);
            expect(global.fetch).toHaveBeenCalledWith(
                "https://date.nager.at/api/v3/PublicHolidays/2026/FR"
            );
        });

        it("throws on API error", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                statusText: "Not Found",
            });

            await expect(fetchHolidaysForCountryAndYear("XX", 2026)).rejects.toThrow(
                "Not Found"
            );
        });

        it("throws UnsupportedHolidayYearError for a year outside the API's range", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: "Bad Request",
            });

            await expect(fetchHolidaysForCountryAndYear("GB", 2099)).rejects.toBeInstanceOf(
                UnsupportedHolidayYearError
            );
        });

        it("throws on network error", async () => {
            global.fetch = vi
                .fn()
                .mockRejectedValueOnce(new Error("Network error"));

            await expect(fetchHolidaysForCountryAndYear("FR", 2026)).rejects.toThrow(
                "Network error"
            );
        });

        it("throws on a malformed API response", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error("Invalid JSON");
                },
            });

            await expect(fetchHolidaysForCountryAndYear("DE", 2026)).rejects.toThrow(
                "Invalid JSON"
            );
        });

        it("throws when the response is not a list", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "rate limited" }),
            });

            await expect(fetchHolidaysForCountryAndYear("GB", 2026)).rejects.toThrow(
                "Unexpected holiday response"
            );
        });
    });

    describe("fetchHolidaysForCountryAndYears", () => {
        it("fetches holidays for multiple years and returns aggregated map", async () => {
            const mockHolidays2026: NagerHoliday[] = [
                {
                    date: "2026-01-01",
                    localName: "New Year",
                    name: "New Year",
                    countryCode: "US",
                    fixed: true,
                    global: true,
                    type: "Public",
                },
            ];

            const mockHolidays2027: NagerHoliday[] = [
                {
                    date: "2027-01-01",
                    localName: "New Year",
                    name: "New Year",
                    countryCode: "US",
                    fixed: true,
                    global: true,
                    type: "Public",
                },
            ];

            global.fetch = vi
                .fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockHolidays2026,
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockHolidays2027,
                });

            const result = await fetchHolidaysForCountryAndYears(
                "US",
                [2026, 2027]
            );

            expect(result).toEqual({
                "2026-01-01": "New Year",
                "2027-01-01": "New Year",
            });
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it("throws HolidayFetchError with the failed years and the holidays that loaded", async () => {
            global.fetch = vi
                .fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            date: "2026-01-01",
                            name: "New Year",
                            countryCode: "ES",
                            fixed: true,
                            global: true,
                            localName: "Año Nuevo",
                            type: "Public",
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: "Not Found",
                });

            const error = await fetchHolidaysForCountryAndYears(
                "ES",
                [2026, 2027]
            ).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(HolidayFetchError);
            expect((error as HolidayFetchError).holidays).toEqual({
                "2026-01-01": "New Year",
            });
            expect((error as HolidayFetchError).failedYears).toEqual([2027]);
            expect((error as HolidayFetchError).unsupportedYears).toEqual([]);
        });

        it("reports unsupported years separately from failed years", async () => {
            global.fetch = vi.fn((url: string) =>
                Promise.resolve(
                    url.includes("/2077/")
                        ? { ok: false, status: 400, statusText: "Bad Request" }
                        : url.includes("/2076/")
                          ? { ok: false, status: 503, statusText: "Unavailable" }
                          : { ok: true, status: 200, json: async () => [] }
                )
            ) as unknown as typeof fetch;

            const error = await fetchHolidaysForCountryAndYears(
                "GB",
                [2075, 2076, 2077]
            ).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(HolidayFetchError);
            expect((error as HolidayFetchError).failedYears).toEqual([2076]);
            expect((error as HolidayFetchError).unsupportedYears).toEqual([2077]);
        });

        it("throws with every year failed when all requests fail", async () => {
            global.fetch = vi
                .fn()
                .mockRejectedValue(new Error("Network error"));

            const error = await fetchHolidaysForCountryAndYears(
                "IT",
                [2026, 2027]
            ).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(HolidayFetchError);
            expect((error as HolidayFetchError).holidays).toEqual({});
            expect((error as HolidayFetchError).failedYears).toEqual([2026, 2027]);
        });

        it("handles empty year array", async () => {
            const result = await fetchHolidaysForCountryAndYears("FR", []);

            expect(result).toEqual({});
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it("deduplicates holidays on the same date", async () => {
            // Simulate case where two years might have same date (edge case)
            global.fetch = vi
                .fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            date: "2026-12-25",
                            name: "Christmas",
                            countryCode: "US",
                            fixed: true,
                            global: true,
                            localName: "Christmas",
                            type: "Public",
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            date: "2026-12-25",
                            name: "Christmas Day",
                            countryCode: "US",
                            fixed: true,
                            global: true,
                            localName: "Christmas Day",
                            type: "Public",
                        },
                    ],
                });

            const result = await fetchHolidaysForCountryAndYears(
                "US",
                [2026, 2026]
            );

            // Last one wins in the aggregation
            expect(result["2026-12-25"]).toBe("Christmas Day");
        });
    });
});
