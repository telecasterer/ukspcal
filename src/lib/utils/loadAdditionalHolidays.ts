import {
    loadHolidaysFromCache,
    saveHolidaysToCache,
} from "$lib/utils/holidayCache";
import { fetchHolidaysForCountryAndYears } from "$lib/services/nagerHolidayService";

/**
 * Result of a successful holiday load.
 */
export type HolidayLoadResult = {
    holidays: Record<string, string>;
    error: string;
};

/**
 * Fetch and cache additional (non-UK) public holidays for a given country and year range.
 *
 * Returns a HolidayLoadResult on success, or `null` if the request was superseded
 * by a newer call (i.e. `getRequestSeq()` no longer equals `requestId`).
 *
 * Handles:
 * - Cache lookup and stale/empty-cache invalidation
 * - Incremental fetching of only the years not already in cache
 * - GB regional codes (GB-SCT, GB-NIR) routed through countryCode "GB"
 * - Cache merge and save
 */
export async function loadAdditionalHolidays(
    country: string,
    startYear: number,
    numberOfYears: number,
    requestId: number,
    getRequestSeq: () => number
): Promise<HolidayLoadResult | null> {
    const isGbRegion = country.startsWith("GB-");
    const cacheKey = country;

    let cached = loadHolidaysFromCache(cacheKey);
    // Invalidate empty/corrupt cache entries so we fetch fresh data.
    try {
        if (cached && Object.keys(cached.data || {}).length === 0) {
            if (typeof window !== "undefined")
                localStorage.removeItem(`holiday_cache_${cacheKey}`);
            cached = null;
        }
    } catch { /* ignore */ }

    const yearsToFetch = Array.from({ length: numberOfYears }, (_, i) => startYear + i);

    // If cache covers all needed years, return it immediately.
    if (cached && yearsToFetch.every((y) => cached.years.includes(y))) {
        if (requestId !== getRequestSeq()) return null;
        return { holidays: cached.data, error: "" };
    }

    // Fetch only the years not already cached.
    const missingYears = cached
        ? yearsToFetch.filter((y) => !cached.years.includes(y))
        : yearsToFetch;

    try {
        const holidays = isGbRegion
            ? await fetchHolidaysForCountryAndYears("GB", missingYears, country)
            : await fetchHolidaysForCountryAndYears(country, missingYears);

        const merged = cached ? { ...cached.data, ...holidays } : holidays;
        const mergedYears = cached
            ? [...new Set([...cached.years, ...missingYears])]
            : yearsToFetch;

        if (requestId !== getRequestSeq()) return null;
        saveHolidaysToCache(cacheKey, merged, mergedYears);
        return { holidays: merged, error: "" };
    } catch (err) {
        if (requestId !== getRequestSeq()) return null;
        console.error(`Error fetching holidays for ${country}:`, err);
        return {
            holidays: {},
            error: "Couldn't load additional holidays right now. Try again.",
        };
    }
}
