import { describe, it, expect, vi } from "vitest";
import { fetchHolidaysForCountryAndYears, type NagerHoliday } from "../src/lib/services/nagerHolidayService";

describe("nagerHolidayService region matching", () => {
    it("includes national (null counties) holidays for all UK regions", async () => {
        const mock: NagerHoliday[] = [
            { date: "2026-01-01", name: "New Year", localName: "New Year", countryCode: "GB", fixed: true, global: true, counties: null, type: "Public" },
        ];
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mock });

        const resEng = await fetchHolidaysForCountryAndYears("GB", [2026], "GB-ENG");
        const resSct = await fetchHolidaysForCountryAndYears("GB", [2026], "GB-SCT");
        const resNir = await fetchHolidaysForCountryAndYears("GB", [2026], "GB-NIR");

        expect(resEng["2026-01-01"]).toBe("New Year");
        expect(resSct["2026-01-01"]).toBe("New Year");
        expect(resNir["2026-01-01"]).toBe("New Year");
    });

    it("matches county codes with and without GB- prefix", async () => {
        const mock: NagerHoliday[] = [
            { date: "2026-01-02", name: "Scotland Day", localName: "Scotland Day", countryCode: "GB", fixed: true, global: false, counties: ["SCT"], type: "Public" },
        ];
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mock });

        const resSct = await fetchHolidaysForCountryAndYears("GB", [2026], "GB-SCT");
        const resEng = await fetchHolidaysForCountryAndYears("GB", [2026], "GB-ENG");

        expect(resSct["2026-01-02"]).toBe("Scotland Day");
        expect(resEng["2026-01-02"]).toBeUndefined();
    });

    it("matches county codes when API returns GB- prefix", async () => {
        const mock: NagerHoliday[] = [
            { date: "2026-01-03", name: "Eng Day", localName: "Eng Day", countryCode: "GB", fixed: true, global: false, counties: ["GB-ENG"], type: "Public" },
        ];
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mock });

        const resEng = await fetchHolidaysForCountryAndYears("GB", [2026], "GB-ENG");
        const resSct = await fetchHolidaysForCountryAndYears("GB", [2026], "GB-SCT");

        expect(resEng["2026-01-03"]).toBe("Eng Day");
        expect(resSct["2026-01-03"]).toBeUndefined();
    });
});
