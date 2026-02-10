import { describe, it, expect } from "vitest";
import {
    getFlagSvg,
    countryCodeToFlagSvg,
} from "../src/lib/utils/countryFlags";

describe("countryFlags", () => {
    describe("countryCodeToFlagSvg", () => {
        it("contains all expected country codes", () => {
            const expectedCountries = [
                "FR",
                "DE",
                "ES",
                "IT",
                "NL",
                "BE",
                "AT",
                "PT",
                "IE",
                "SE",
                "DK",
                "NO",
                "CH",
                "US",
                "CA",
                "AU",
                "NZ",
                "JP",
            ];

            for (const country of expectedCountries) {
                expect(countryCodeToFlagSvg[country]).toBeDefined();
            }
        });

        it("has all valid flag svg urls", () => {
            for (const [code, svgUrl] of Object.entries(countryCodeToFlagSvg)) {
                expect(svgUrl.length).toBeGreaterThan(0);
                expect(typeof svgUrl).toBe("string");
            }
        });

        it("maps specific countries correctly", () => {
            expect(countryCodeToFlagSvg["FR"]).toContain("fr");
            expect(countryCodeToFlagSvg["DE"]).toContain("de");
            expect(countryCodeToFlagSvg["US"]).toContain("us");
            expect(countryCodeToFlagSvg["JP"]).toContain("jp");
            expect(countryCodeToFlagSvg["GB"]).toBeUndefined(); // Should not exist if not in supported list
        });
    });

    describe("getFlagSvg", () => {
        it("returns the correct flag url for a valid country code", () => {
            expect(getFlagSvg("FR")).toContain("fr");
            expect(getFlagSvg("US")).toContain("us");
            expect(getFlagSvg("AU")).toContain("au");
        });

        it("returns empty string for unknown country code", () => {
            expect(getFlagSvg("XX")).toBe("");
            expect(getFlagSvg("ZZ")).toBe("");
            expect(getFlagSvg("")).toBe("");
        });

        it("is case-sensitive", () => {
            expect(getFlagSvg("fr")).toBe("");
            expect(getFlagSvg("Fr")).toBe("");
            expect(getFlagSvg("FR")).toContain("fr");
        });

        it("handles all supported countries", () => {
            const supportedCountries = [
                "FR",
                "DE",
                "ES",
                "IT",
                "NL",
                "BE",
                "AT",
                "PT",
                "IE",
                "SE",
                "DK",
                "NO",
                "CH",
                "US",
                "CA",
                "AU",
                "NZ",
                "JP",
            ];

            for (const country of supportedCountries) {
                const svgUrl = getFlagSvg(country);
                expect(svgUrl).not.toBe("");
                expect(svgUrl.length).toBeGreaterThan(0);
            }
        });
    });
});
