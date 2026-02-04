/**
 * Holiday cache utilities for localStorage
 */

const CACHE_PREFIX = "holiday_cache_";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type CachedHolidays = {
    data: Record<string, string>;
    timestamp: number;
    years: number[];
};

/**
 * Get cache key for a country code
 */
function getCacheKey(countryCode: string): string {
    return `${CACHE_PREFIX}${countryCode}`;
}

/**
 * Check if cached holidays are still valid
 */
function isCacheValid(cached: CachedHolidays | null): boolean {
    if (!cached) return false;
    const age = Date.now() - cached.timestamp;
    return age < CACHE_TTL_MS;
}

/**
 * Load holidays from cache
 */
export function loadHolidaysFromCache(countryCode: string): CachedHolidays | null {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return null;
    }

    try {
        const key = getCacheKey(countryCode);
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const parsed: CachedHolidays = JSON.parse(cached);
        if (!isCacheValid(parsed)) {
            localStorage.removeItem(key);
            return null;
        }

        if (!Array.isArray(parsed.years)) {
            localStorage.removeItem(key);
            return null;
        }

        return parsed;
    } catch (error) {
        console.error(`Error loading holiday cache for ${countryCode}:`, error);
        return null;
    }
}

/**
 * Save holidays to cache
 */
export function saveHolidaysToCache(
    countryCode: string,
    holidays: Record<string, string>,
    years: number[]
): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return;
    }

    try {
        const key = getCacheKey(countryCode);
        const cached: CachedHolidays = {
            data: holidays,
            timestamp: Date.now(),
            years: [...new Set(years)].sort((a, b) => a - b),
        };
        localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
        console.error(`Error saving holiday cache for ${countryCode}:`, error);
        // Silently fail (quota exceeded, private mode, etc.)
    }
}

/**
 * Clear all holiday caches
 */
export function clearAllHolidayCache(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return;
    }

    try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.error("Error clearing holiday caches:", error);
    }
}
