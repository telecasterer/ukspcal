/**
 * Country code to flag emoji mapping
 */
export const countryCodeToFlagEmoji: Record<string, string> = {
    FR: "🇫🇷",
    DE: "🇩🇪",
    ES: "🇪🇸",
    IT: "🇮🇹",
    NL: "🇳🇱",
    BE: "🇧🇪",
    AT: "🇦🇹",
    PT: "🇵🇹",
    IE: "🇮🇪",
    SE: "🇸🇪",
    DK: "🇩🇰",
    NO: "🇳🇴",
    CH: "🇨🇭",
    US: "🇺🇸",
    CA: "🇨🇦",
    AU: "🇦🇺",
    NZ: "🇳🇿",
    JP: "🇯🇵",
};

/**
 * Get flag emoji for a country code
 */
export function getFlagEmoji(countryCode: string): string {
    return countryCodeToFlagEmoji[countryCode] || "";
}
