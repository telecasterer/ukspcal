import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    loadHolidaysFromCache,
    saveHolidaysToCache,
    clearAllHolidayCache,
    type CachedHolidays,
} from "../src/lib/utils/holidayCache";

describe("holidayCache", () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe("saveHolidaysToCache", () => {
        it("saves holidays to localStorage", () => {
            const holidays = {
                "2026-01-01": "New Year",
                "2026-12-25": "Christmas",
            };

            saveHolidaysToCache("US", holidays, [2026]);

            const stored = localStorage.getItem("holiday_cache_US");
            expect(stored).toBeTruthy();
            const parsed: CachedHolidays = JSON.parse(stored!);
            expect(parsed.data).toEqual(holidays);
            expect(parsed.timestamp).toBeDefined();
            expect(parsed.years).toEqual([2026]);
        });

        it("handles empty holidays object", () => {
            const holidays: Record<string, string> = {};
            saveHolidaysToCache("FR", holidays, []);

            const stored = localStorage.getItem("holiday_cache_FR");
            expect(stored).toBeTruthy();
            const parsed: CachedHolidays = JSON.parse(stored!);
            expect(parsed.data).toEqual({});
            expect(parsed.years).toEqual([]);
        });

        it("silently fails if localStorage is unavailable", () => {
            const stored = localStorage.getItem("holiday_cache_DE");
            expect(stored).toBeNull();
            // Should not throw
            expect(() =>
                saveHolidaysToCache("DE", { "2026-01-01": "Test" }, [2026])
            ).not.toThrow();
        });
    });

    describe("loadHolidaysFromCache", () => {
        it("loads valid cached holidays", () => {
            const holidays = {
                "2026-01-01": "New Year",
                "2026-07-14": "Bastille Day",
            };
            saveHolidaysToCache("FR", holidays, [2026]);

            const loaded = loadHolidaysFromCache("FR");
            expect(loaded?.data).toEqual(holidays);
        });

        it("returns null if cache does not exist", () => {
            const loaded = loadHolidaysFromCache("IT");
            expect(loaded).toBeNull();
        });

        it("returns null if cache is expired (30+ days old)", () => {
            const holidays = {
                "2026-01-01": "New Year",
            };

            // Manually create an old cache entry
            const oldCache: CachedHolidays = {
                data: holidays,
                timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
                years: [2026],
            };
            localStorage.setItem("holiday_cache_ES", JSON.stringify(oldCache));

            const loaded = loadHolidaysFromCache("ES");
            expect(loaded).toBeNull();

            // Verify the old cache was removed
            expect(localStorage.getItem("holiday_cache_ES")).toBeNull();
        });

        it("loads cache if still valid (< 30 days old)", () => {
            const holidays = {
                "2026-01-01": "New Year",
            };

            // Manually create a recent cache entry
            const recentCache: CachedHolidays = {
                data: holidays,
                timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
                years: [2026],
            };
            localStorage.setItem(
                "holiday_cache_DE",
                JSON.stringify(recentCache)
            );

            const loaded = loadHolidaysFromCache("DE");
            expect(loaded?.data).toEqual(holidays);
        });

        it("returns null if cache is corrupted", () => {
            localStorage.setItem("holiday_cache_JP", "invalid json");

            const loaded = loadHolidaysFromCache("JP");
            expect(loaded).toBeNull();
        });

        it("handles missing window/localStorage gracefully", () => {
            const loaded = loadHolidaysFromCache("GB");
            expect(loaded).toBeNull();
        });
    });

    describe("clearAllHolidayCache", () => {
        it("clears all holiday cache entries", () => {
            saveHolidaysToCache("FR", { "2026-01-01": "New Year" }, [2026]);
            saveHolidaysToCache("DE", { "2026-01-01": "New Year" }, [2026]);
            saveHolidaysToCache("ES", { "2026-01-01": "New Year" }, [2026]);

            expect(localStorage.getItem("holiday_cache_FR")).toBeTruthy();
            expect(localStorage.getItem("holiday_cache_DE")).toBeTruthy();
            expect(localStorage.getItem("holiday_cache_ES")).toBeTruthy();

            clearAllHolidayCache();

            expect(localStorage.getItem("holiday_cache_FR")).toBeNull();
            expect(localStorage.getItem("holiday_cache_DE")).toBeNull();
            expect(localStorage.getItem("holiday_cache_ES")).toBeNull();
        });

        it("does not clear non-holiday cache entries", () => {
            localStorage.setItem("other_key", "other_value");
            saveHolidaysToCache("FR", { "2026-01-01": "New Year" }, [2026]);

            clearAllHolidayCache();

            expect(localStorage.getItem("holiday_cache_FR")).toBeNull();
            expect(localStorage.getItem("other_key")).toBe("other_value");
        });

        it("handles empty localStorage gracefully", () => {
            expect(() => clearAllHolidayCache()).not.toThrow();
        });
    });
});
