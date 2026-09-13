// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadHolidays } from "../src/lib/utils/loadHolidays";
import {
    fetchHolidaysForCountryAndYears,
    HolidayFetchError,
} from "../src/lib/services/nagerHolidayService";
import type { CachedHolidays } from "../src/lib/utils/holidayCache";

vi.mock("../src/lib/services/nagerHolidayService", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../src/lib/services/nagerHolidayService")>()),
    fetchHolidaysForCountryAndYears: vi.fn(),
}));

const fetchMock = vi.mocked(fetchHolidaysForCountryAndYears);
const DAY_MS = 24 * 60 * 60 * 1000;
const UK = "GB-ENG+GB-WLS";

function load(key: string, startYear: number, numberOfYears: number) {
    return loadHolidays(key, startYear, numberOfYears, 1, () => 1);
}

function readCache(key: string): CachedHolidays | null {
    const raw = localStorage.getItem(`holiday_cache_${key}`);
    return raw ? JSON.parse(raw) : null;
}

function seedCache(
    key: string,
    data: Record<string, string>,
    years: number[],
    ageDays: number
): void {
    localStorage.setItem(
        `holiday_cache_${key}`,
        JSON.stringify({ data, years, timestamp: Date.now() - ageDays * DAY_MS })
    );
}

describe("loadHolidays", () => {
    beforeEach(() => {
        localStorage.clear();
        fetchMock.mockReset();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetches and caches, then serves from the cache without refetching", async () => {
        fetchMock.mockResolvedValue({ "2026-07-14": "Bastille Day" });
        const expected = {
            holidays: { "2026-07-14": "Bastille Day" },
            missingYears: [],
            unsupportedYears: [],
        };

        expect(await load("FR", 2026, 1)).toEqual(expected);
        expect(await load("FR", 2026, 1)).toEqual(expected);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("fetches GB regions via country GB, filtered by region", async () => {
        fetchMock.mockResolvedValue({ "2028-08-28": "Summer Bank Holiday" });

        await load(UK, 2028, 1);

        expect(fetchMock).toHaveBeenCalledWith("GB", [2028], UK);
    });

    it("only caches years that loaded, so failed years are retried", async () => {
        fetchMock.mockRejectedValueOnce(
            new HolidayFetchError({ "2026-12-25": "Christmas Day" }, [2027])
        );
        expect(await load(UK, 2026, 2)).toEqual({
            holidays: { "2026-12-25": "Christmas Day" },
            missingYears: [2027],
            unsupportedYears: [],
        });
        expect(readCache(UK)?.years).toEqual([2026]);

        fetchMock.mockResolvedValueOnce({ "2027-12-27": "Christmas Day" });
        expect(await load(UK, 2026, 2)).toEqual({
            holidays: { "2026-12-25": "Christmas Day", "2027-12-27": "Christmas Day" },
            missingYears: [],
            unsupportedYears: [],
        });
        expect(fetchMock).toHaveBeenLastCalledWith("GB", [2027], UK);
        expect(readCache(UK)?.years).toEqual([2026, 2027]);
    });

    it("reports and caches unsupported years without re-requesting them", async () => {
        fetchMock.mockRejectedValueOnce(
            new HolidayFetchError({ "2076-12-25": "Christmas Day" }, [], [2077, 2078])
        );
        const expected = {
            holidays: { "2076-12-25": "Christmas Day" },
            missingYears: [],
            unsupportedYears: [2077, 2078],
        };

        expect(await load(UK, 2076, 3)).toEqual(expected);
        expect(readCache(UK)?.unsupportedYears).toEqual([2077, 2078]);

        expect(await load(UK, 2076, 3)).toEqual(expected);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("keeps a cache that only records unsupported years", async () => {
        fetchMock.mockRejectedValueOnce(new HolidayFetchError({}, [], [2090]));

        await load(UK, 2090, 1);
        expect(await load(UK, 2090, 1)).toEqual({
            holidays: {},
            missingYears: [],
            unsupportedYears: [2090],
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("falls back to expired cached holidays when the fetch fails", async () => {
        seedCache(UK, { "2028-08-28": "Summer Bank Holiday" }, [2028], 60);
        fetchMock.mockRejectedValue(new Error("offline"));

        expect(await load(UK, 2028, 1)).toEqual({
            holidays: { "2028-08-28": "Summer Bank Holiday" },
            missingYears: [],
            unsupportedYears: [],
        });
        expect(fetchMock).toHaveBeenCalledWith("GB", [2028], UK);
    });

    it("refreshes expired cached holidays when the fetch succeeds", async () => {
        seedCache("FR", { "2026-07-14": "Old name" }, [2026], 60);
        fetchMock.mockResolvedValue({ "2026-07-14": "Bastille Day" });

        expect(await load("FR", 2026, 1)).toEqual({
            holidays: { "2026-07-14": "Bastille Day" },
            missingYears: [],
            unsupportedYears: [],
        });
        expect(readCache("FR")?.data).toEqual({ "2026-07-14": "Bastille Day" });
    });

    it("reports every year as missing when offline with nothing cached", async () => {
        fetchMock.mockRejectedValue(new Error("offline"));

        expect(await load(UK, 2027, 2)).toEqual({
            holidays: {},
            missingYears: [2027, 2028],
            unsupportedYears: [],
        });
        expect(readCache(UK)).toBeNull();
    });

    it("returns null and caches nothing when superseded", async () => {
        fetchMock.mockResolvedValue({ "2026-07-14": "Bastille Day" });

        expect(await loadHolidays("FR", 2026, 1, 1, () => 2)).toBeNull();
        expect(readCache("FR")).toBeNull();
    });
});
