// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { detectCountryFromTimezone } from "../src/lib/utils/timezoneDetection";

describe("timezoneDetection", () => {
    it("detects a supported timezone", () => {
        const spy = vi
            .spyOn(Intl, "DateTimeFormat")
            .mockImplementation(() => ({
                resolvedOptions: () => ({ timeZone: "Europe/Paris" })
            }) as any);

        expect(detectCountryFromTimezone()).toBe("FR");
        spy.mockRestore();
    });

    it("falls back for Asia timezones", () => {
        const spy = vi
            .spyOn(Intl, "DateTimeFormat")
            .mockImplementation(() => ({
                resolvedOptions: () => ({ timeZone: "Asia/Shanghai" })
            }) as any);

        expect(detectCountryFromTimezone()).toBe("JP");
        spy.mockRestore();
    });

    it("returns none for unsupported timezones", () => {
        const spy = vi
            .spyOn(Intl, "DateTimeFormat")
            .mockImplementation(() => ({
                resolvedOptions: () => ({ timeZone: "Antarctica/Troll" })
            }) as any);

        expect(detectCountryFromTimezone()).toBe("none");
        spy.mockRestore();
    });
});
