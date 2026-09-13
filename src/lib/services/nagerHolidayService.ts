/**
 * Service to fetch public holidays from Nager.date API
 * https://date.nager.at/api/v3/PublicHolidays
 */

export type NagerHoliday = {
    date: string; // YYYY-MM-DD
    localName: string; // Holiday name in local language
    name: string; // Holiday name in English
    countryCode: string; // e.g., "FR"
    fixed: boolean;
    global: boolean;
    counties?: string[] | null;
    launchYear?: number | null;
    type: string; // "Public", "Bank", "Observance", etc.
};

/**
 * Thrown when Nager.Date doesn't cover the requested year (HTTP 400). It only serves
 * a fixed window of years (1976–2076 as of Sept 2026).
 */
export class UnsupportedHolidayYearError extends Error {
    readonly year: number;

    constructor(countryCode: string, year: number) {
        super(`Holiday data for ${countryCode} ${year} is not available`);
        this.name = "UnsupportedHolidayYearError";
        this.year = year;
    }
}

/**
 * Thrown by fetchHolidaysForCountryAndYears when one or more years have no data:
 * `failedYears` couldn't be loaded (network/server error) and may work on retry;
 * `unsupportedYears` are outside the range Nager.Date covers. Carries the holidays
 * from the years that did load.
 */
export class HolidayFetchError extends Error {
    readonly holidays: Record<string, string>;
    readonly failedYears: number[];
    readonly unsupportedYears: number[];

    constructor(
        holidays: Record<string, string>,
        failedYears: number[],
        unsupportedYears: number[] = []
    ) {
        super(
            `Failed to fetch holidays for ${[...failedYears, ...unsupportedYears].join(", ")}`
        );
        this.name = "HolidayFetchError";
        this.holidays = holidays;
        this.failedYears = failedYears;
        this.unsupportedYears = unsupportedYears;
    }
}

/**
 * Fetch public holidays for a given country and year.
 * Throws UnsupportedHolidayYearError for a year outside Nager.Date's range, and a
 * plain Error on a network error, other non-OK response or malformed body, so
 * callers can tell "no holidays" apart from "couldn't load".
 */
export async function fetchHolidaysForCountryAndYear(
    countryCode: string,
    year: number
): Promise<NagerHoliday[]> {
    const response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
    );
    if (response.status === 400) {
        throw new UnsupportedHolidayYearError(countryCode, year);
    }
    if (!response.ok) {
        throw new Error(
            `Failed to fetch holidays for ${countryCode} ${year}: ${response.statusText}`
        );
    }
    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
        throw new Error(`Unexpected holiday response for ${countryCode} ${year}`);
    }
    return data as NagerHoliday[];
}

/**
 * Fetch public holidays for a given country and region across multiple years
 * For UK, regionCode should be one of: GB-ENG, GB-SCT, GB-NIR
 *
 * Throws HolidayFetchError if any year fails or is unsupported, carrying the holidays
 * from the years that loaded.
 */
export async function fetchHolidaysForCountryAndYears(
    countryCode: string,
    years: number[],
    regionCode?: string | string[]
): Promise<Record<string, string>> {
    const holidays: Record<string, string> = {};
    const failedYears: number[] = [];
    const unsupportedYears: number[] = [];

    const results = await Promise.allSettled(
        years.map((year) => fetchHolidaysForCountryAndYear(countryCode, year))
    );

    results.forEach((result, i) => {
        if (result.status === "rejected") {
            if (result.reason instanceof UnsupportedHolidayYearError) {
                unsupportedYears.push(years[i]);
            } else {
                failedYears.push(years[i]);
            }
            return;
        }
        for (const holiday of result.value) {
            // For UK, filter by region/county if specified
            if (countryCode === "GB" && regionCode) {
                // Support passing a single region code, an array of region codes,
                // or a "+"-separated string like "GB-ENG+GB-WLS" to indicate
                // combined regions (England & Wales).
                const regionCodes: string[] = Array.isArray(regionCode)
                    ? regionCode
                    : String(regionCode).split("+").map((s) => s.trim()).filter(Boolean);

                // Map common GB region codes to the county codes used by Nager.Date
                const regionMap: Record<string, string> = {
                    "GB-ENG": "ENG",
                    "GB-WLS": "WLS",
                    "GB-SCT": "SCT",
                    "GB-NIR": "NIR",
                };

                const appliesToRegion = (): boolean => {
                    // No counties means the holiday is national — include for all regions
                    if (!holiday.counties) return true;
                    if (!Array.isArray(holiday.counties)) return false;

                    for (const c of holiday.counties) {
                        if (!c) continue;
                        const upper = String(c).toUpperCase();
                        for (const rc of regionCodes) {
                            const mapped = regionMap[rc] || rc.replace(/^GB-/, "");
                            const code = String(mapped).toUpperCase();
                            if (upper === code) return true;
                            if (upper === `GB-${code}`) return true;
                            if (upper.endsWith(code)) return true;
                        }
                    }
                    return false;
                };

                if (appliesToRegion()) {
                    holidays[holiday.date] = holiday.name;
                }
            } else {
                holidays[holiday.date] = holiday.name;
            }
        }
    });

    if (failedYears.length > 0 || unsupportedYears.length > 0) {
        throw new HolidayFetchError(holidays, failedYears, unsupportedYears);
    }

    return holidays;
}
