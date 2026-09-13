import {
    loadHolidaysFromCache,
    saveHolidaysToCache,
} from "$lib/utils/holidayCache";
import {
    fetchHolidaysForCountryAndYears,
    type HolidayFetchError,
} from "$lib/services/nagerHolidayService";

export type HolidayLoadResult = {
    holidays: Record<string, string>;
    /** Years that couldn't be loaded (e.g. offline) and have nothing cached. */
    missingYears: number[];
    /** Years the holiday API has no data for (outside its supported range). */
    unsupportedYears: number[];
};

// Duck-typed rather than `instanceof` so it also works when the service module is mocked.
function isHolidayFetchError(err: unknown): err is HolidayFetchError {
    return (
        typeof err === "object" &&
        err !== null &&
        Array.isArray((err as HolidayFetchError).failedYears)
    );
}

function pickYears(
    holidays: Record<string, string>,
    years: number[]
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(holidays).filter(([iso]) =>
            years.includes(Number(iso.slice(0, 4)))
        )
    );
}

const ascending = (a: number, b: number) => a - b;

/**
 * Fetch and cache public holidays for a year range.
 *
 * `key` is a country code ("FR") or one or more GB regions ("GB-ENG+GB-WLS"), which
 * are fetched via country "GB" and filtered by region. It is also the cache key.
 *
 * Returns `null` if the request was superseded by a newer call
 * (i.e. `getRequestSeq()` no longer equals `requestId`).
 *
 * - Only years that fetched successfully (or are confirmed unsupported) are cached, so
 *   a failed year is retried next time instead of being cached as having no holidays.
 * - Years that fail fall back to previously cached data, even if it has expired, so
 *   payments are still adjusted offline.
 */
export async function loadHolidays(
    key: string,
    startYear: number,
    numberOfYears: number,
    requestId: number,
    getRequestSeq: () => number
): Promise<HolidayLoadResult | null> {
    const years = Array.from({ length: numberOfYears }, (_, i) => startYear + i);

    const stored = loadHolidaysFromCache(key, { allowExpired: true });
    // Entries saved before failed years stopped being cached can hold no data at all.
    const cached =
        stored &&
        (Object.keys(stored.data ?? {}).length > 0 ||
            (stored.unsupportedYears ?? []).length > 0)
            ? stored
            : null;
    const fresh = cached && !cached.expired ? cached : null;
    const freshUnsupported = fresh?.unsupportedYears ?? [];
    const yearsToFetch = fresh
        ? years.filter((y) => !fresh.years.includes(y) && !freshUnsupported.includes(y))
        : years;
    const knownUnsupported = years.filter((y) => freshUnsupported.includes(y));

    if (fresh && yearsToFetch.length === 0) {
        if (requestId !== getRequestSeq()) return null;
        return {
            holidays: fresh.data,
            missingYears: [],
            unsupportedYears: knownUnsupported,
        };
    }

    let fetched: Record<string, string> = {};
    let failedYears: number[] = [];
    let unsupportedYears: number[] = [];
    try {
        fetched = key.startsWith("GB-")
            ? await fetchHolidaysForCountryAndYears("GB", yearsToFetch, key)
            : await fetchHolidaysForCountryAndYears(key, yearsToFetch);
    } catch (err) {
        if (isHolidayFetchError(err)) {
            fetched = err.holidays;
            failedYears = err.failedYears;
            unsupportedYears = err.unsupportedYears ?? [];
        } else {
            failedYears = yearsToFetch;
        }
    }

    if (requestId !== getRequestSeq()) return null;
    if (failedYears.length > 0) {
        console.error(`Couldn't fetch holidays for ${key}: ${failedYears.join(", ")}`);
    }

    const freshData = fresh?.data ?? {};
    const fetchedYears = yearsToFetch.filter(
        (y) => !failedYears.includes(y) && !unsupportedYears.includes(y)
    );
    if (fetchedYears.length > 0 || unsupportedYears.length > 0) {
        saveHolidaysToCache(
            key,
            { ...freshData, ...fetched },
            [...(fresh?.years ?? []), ...fetchedYears],
            [...freshUnsupported, ...unsupportedYears]
        );
    }

    // Failed years fall back to whatever was cached for them, even if expired.
    const staleYears = cached
        ? failedYears.filter((y) => cached.years.includes(y))
        : [];
    const staleUnsupported = cached
        ? failedYears.filter((y) => (cached.unsupportedYears ?? []).includes(y))
        : [];
    return {
        holidays: {
            ...freshData,
            ...pickYears(cached?.data ?? {}, staleYears),
            ...fetched,
        },
        missingYears: failedYears.filter(
            (y) => !staleYears.includes(y) && !staleUnsupported.includes(y)
        ),
        unsupportedYears: [
            ...knownUnsupported,
            ...unsupportedYears,
            ...staleUnsupported,
        ].sort(ascending),
    };
}
