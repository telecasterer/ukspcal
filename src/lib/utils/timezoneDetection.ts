/**
 * Timezone-to-country mapping for automatic country detection
 * Maps common timezones to supported country codes
 */
const timezoneToCountryCode: Record<string, string> = {
    // Europe
    'Europe/London': 'GB', // UK - but we don't show it, so default to none
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Madrid': 'ES',
    'Europe/Rome': 'IT',
    'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE',
    'Europe/Vienna': 'AT',
    'Europe/Lisbon': 'PT',
    'Europe/Dublin': 'IE',
    'Europe/Stockholm': 'SE',
    'Europe/Copenhagen': 'DK',
    'Europe/Oslo': 'NO',
    'Europe/Zurich': 'CH',
    // North America
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Anchorage': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'America/Mexico_City': 'US', // Default to US for Mexico region
    // South America
    // Oceania
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU',
    'Australia/Adelaide': 'AU',
    'Pacific/Auckland': 'NZ',
    // Asia
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'JP', // China - map to JP as closest
    'Asia/Hong_Kong': 'JP',
    'Asia/Singapore': 'JP',
    'Asia/Bangkok': 'JP',
    'Asia/Seoul': 'JP',
    'Asia/Manila': 'JP',
};

/**
 * Detect user's country based on timezone
 * Returns the country code or 'none' if not detected/not supported
 */
export function detectCountryFromTimezone(): string {
    if (typeof window === 'undefined') {
        return 'none';
    }

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const countryCode = timezoneToCountryCode[timezone];

        // Return the country code if found and it's in our supported list
        if (countryCode && isValidCountryCode(countryCode)) {
            return countryCode;
        }

        // Try to match partial timezone (e.g., 'Europe/' prefix)
        for (const [tz, code] of Object.entries(timezoneToCountryCode)) {
            if (timezone.startsWith(tz.split('/')[0])) {
                if (isValidCountryCode(code)) {
                    return code;
                }
            }
        }

        return 'none';
    } catch {
        return 'none';
    }
}

/**
 * Check if a country code is in our supported list
 */
function isValidCountryCode(code: string): boolean {
    const supportedCountries = new Set(['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'SE', 'DK', 'NO', 'CH', 'US', 'CA', 'AU', 'NZ', 'JP']);
    return supportedCountries.has(code);
}
