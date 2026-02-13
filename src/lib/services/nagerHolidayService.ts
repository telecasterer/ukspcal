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
 * Fetch public holidays for a given country and year
 */
export async function fetchHolidaysForCountryAndYear(
    countryCode: string,
    year: number
): Promise<NagerHoliday[]> {
    try {
        const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
        );
        if (!response.ok) {
            console.error(
                `Failed to fetch holidays for ${countryCode} ${year}:`,
                response.statusText
            );
            return [];
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(
            `Error fetching holidays for ${countryCode} ${year}:`,
            error
        );
        return [];
    }
}

/**
 * Fetch public holidays for a given country across multiple years
 */
/**
 * Fetch public holidays for a given country and region across multiple years
 * For UK, regionCode should be one of: GB-ENG, GB-SCT, GB-NIR
 */
export async function fetchHolidaysForCountryAndYears(
    countryCode: string,
    years: number[],
    regionCode?: string | string[]
): Promise<Record<string, string>> {
    const holidays: Record<string, string> = {};

    const results = await Promise.all(
        years.map((year) => fetchHolidaysForCountryAndYear(countryCode, year))
    );

    for (const yearHolidays of results) {
        for (const holiday of yearHolidays) {
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
    }

    // Production: do not log matched holiday counts here.

    return holidays;
}
