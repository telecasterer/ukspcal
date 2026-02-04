/**
 * Service to fetch public holidays from Nager.date API
 * https://date.nager.at/api/v3/PublicHolidays
 */

export type NagerHoliday = {
    date: string;        // YYYY-MM-DD
    localName: string;   // Holiday name in local language
    name: string;        // Holiday name in English
    countryCode: string; // e.g., "FR"
    fixed: boolean;
    global: boolean;
    counties?: string[] | null;
    launchYear?: number | null;
    type: string;        // "Public", "Bank", "Observance", etc.
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
        console.error(`Error fetching holidays for ${countryCode} ${year}:`, error);
        return [];
    }
}

/**
 * Fetch public holidays for a given country across multiple years
 */
export async function fetchHolidaysForCountryAndYears(
    countryCode: string,
    years: number[]
): Promise<Record<string, string>> {
    const holidays: Record<string, string> = {};

    const results = await Promise.all(
        years.map((year) => fetchHolidaysForCountryAndYear(countryCode, year))
    );

    for (const yearHolidays of results) {
        for (const holiday of yearHolidays) {
            holidays[holiday.date] = holiday.name;
        }
    }

    return holidays;
}
