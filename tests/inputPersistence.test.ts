import { describe, expect, it } from "vitest";
import type { DateFormat } from "../src/lib/utils/dateFormatting";
import {
    loadPersistedInputs,
    parsePersistedInputsJson,
    parsePersistedInputsObject,
    savePersistedInputs,
} from "../src/lib/utils/inputPersistence";

describe("inputPersistence", () => {
    const allowedCycleDays = new Set([7, 14, 28, 91]);
    const allowedDateFormats = new Set<DateFormat>([
        "dd/mm/yyyy",
        "dd-mmm-yyyy",
        "yyyy-mm-dd",
        "mm/dd/yyyy",
        "ddd, d mmmm yyyy",
    ]);

    it("returns empty object for invalid JSON", () => {
        expect(
            parsePersistedInputsJson("{not json}", {
                allowedCycleDays,
                allowedDateFormats,
            })
        ).toEqual({});
    });

    it("sanitizes fields and applies allow-lists", () => {
        const raw = JSON.stringify({
            ni: "22D",
            dob: "1970-01-01",
            startYear: "2024",
            numberOfYears: 2,
            cycleDays: "28",
            showBankHolidays: false,
            csvDateFormat: "dd/mm/yyyy",
            icsEventName: "  UK State Pension Payment  ",
            icsCategory: "  Finance ",
            icsColor: " #22c55e ",
        });

        const parsed = parsePersistedInputsJson(raw, {
            allowedCycleDays,
            allowedDateFormats,
        });
        expect(parsed).toEqual({
            ni: "22D",
            dob: "1970-01-01",
            startYear: 2024,
            numberOfYears: 2,
            cycleDays: 28,
            showBankHolidays: false,
            csvDateFormat: "dd/mm/yyyy",
            icsEventName: "UK State Pension Payment",
            icsCategory: "Finance",
            icsColor: "#22c55e",
        });
    });

    it("rejects disallowed cycleDays and date formats", () => {
        const raw = JSON.stringify({
            cycleDays: 30,
            csvDateFormat: "not-a-format",
        });
        const parsed = parsePersistedInputsJson(raw, {
            allowedCycleDays,
            allowedDateFormats,
        });
        expect(parsed.cycleDays).toBeUndefined();
        expect(parsed.csvDateFormat).toBeUndefined();
    });

    it("allows empty strings for limited fields when trimmed is empty", () => {
        const parsed = parsePersistedInputsObject(
            { icsEventName: "   ", icsCategory: "\n\t" },
            { allowedCycleDays, allowedDateFormats }
        );
        expect(parsed.icsEventName).toBe("");
        expect(parsed.icsCategory).toBe("");
    });

    it("loadPersistedInputs is resilient to storage errors", () => {
        const storage = {
            getItem: () => {
                throw new Error("boom");
            },
        };
        expect(
            loadPersistedInputs(storage, "k", {
                allowedCycleDays,
                allowedDateFormats,
            })
        ).toEqual({});
    });

    it("savePersistedInputs writes JSON and returns true", () => {
        const calls: Array<{ key: string; value: string }> = [];
        const storage = {
            setItem: (key: string, value: string) => {
                calls.push({ key, value });
            },
        };
        expect(savePersistedInputs(storage, "k", { a: 1 })).toBe(true);
        expect(calls).toEqual([{ key: "k", value: JSON.stringify({ a: 1 }) }]);
    });

    it("savePersistedInputs returns false on storage errors", () => {
        const storage = {
            setItem: () => {
                throw new Error("quota");
            },
        };
        expect(savePersistedInputs(storage, "k", { a: 1 })).toBe(false);
    });
});
