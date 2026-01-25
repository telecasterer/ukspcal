// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import Page from "../src/routes/+page.svelte";

const PERSIST_KEY = "ukspcal.inputs.v1";

function getSetItemSpy() {
    // JSDOM implements localStorage as Storage.
    return vi.spyOn(Storage.prototype, "setItem");
}

describe("+page persistence", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        document.documentElement.className = "";
    });

    it("loads persisted inputs before writing back (no default overwrite)", async () => {
        const persisted = {
            ni: "29B",
            dob: "1956-03-15",
            startYear: 2026,
            endYear: 2028,
            cycleDays: 28,
            showWeekends: false,
            showBankHolidays: true,
            csvDateFormat: "dd/mm/yyyy",
            icsEventName: "UK State Pension Payment",
            icsCategory: "Finance",
            icsColor: "#22c55e"
        };

        localStorage.setItem(PERSIST_KEY, JSON.stringify(persisted));

        const setItemSpy = getSetItemSpy();

        render(Page, {
            props: {
                data: { bankHolidays: {} }
            }
        });

        // Let onMount + effects run.
        await tick();
        await tick();

        const callsForPersistKey = setItemSpy.mock.calls
            .filter(([key]) => key === PERSIST_KEY)
            .map(([, value]) => String(value));

        expect(callsForPersistKey.length).toBeGreaterThan(0);

        // Assert no call wrote empty/default inputs into the persist key.
        for (const json of callsForPersistKey) {
            const parsed = JSON.parse(json) as any;
            expect(parsed.ni).toBe("29B");
            expect(parsed.dob).toBe("1956-03-15");
            expect(parsed.cycleDays).toBe(28);
        }

        // And the final value in storage should match persisted inputs.
        const finalRaw = localStorage.getItem(PERSIST_KEY);
        expect(finalRaw).toBeTruthy();
        const finalParsed = JSON.parse(finalRaw!) as any;
        expect(finalParsed.ni).toBe("29B");
        expect(finalParsed.dob).toBe("1956-03-15");
        expect(finalParsed.showWeekends).toBe(false);
    });

    it("ignores invalid persisted values and still writes a sane payload", async () => {
        localStorage.setItem(
            PERSIST_KEY,
            JSON.stringify({
                ni: "29B",
                dob: "1956-03-15",
                cycleDays: 999, // invalid
                csvDateFormat: "not-a-format",
                icsColor: "not-a-color"
            })
        );

        const setItemSpy = getSetItemSpy();

        render(Page, {
            props: {
                data: { bankHolidays: {} }
            }
        });

        await tick();
        await tick();

        const lastPersistWrite = [...setItemSpy.mock.calls]
            .filter(([key]) => key === PERSIST_KEY)
            .at(-1);

        expect(lastPersistWrite).toBeTruthy();
        const payload = JSON.parse(String(lastPersistWrite![1])) as any;

        expect(payload.ni).toBe("29B");
        expect(payload.dob).toBe("1956-03-15");
        // Should fall back to default allowed value.
        expect([7, 14, 28, 91]).toContain(payload.cycleDays);
        expect(["dd/mm/yyyy", "dd-mmm-yyyy", "yyyy-mm-dd", "mm/dd/yyyy", "ddd, d mmmm yyyy"]).toContain(payload.csvDateFormat);
        expect(/^#[0-9a-f]{6}$/i.test(payload.icsColor)).toBe(true);
    });
});
