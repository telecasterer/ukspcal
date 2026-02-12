// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
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

    afterEach(() => {
        // no-op
    });

    it("loads persisted inputs before writing back (no default overwrite)", async () => {
        const persisted = {
            ni: "29B",
            dob: "1956-03-15",
            startYear: 2026,
            numberOfYears: 2,
            cycleDays: 28,
            showBankHolidays: true,
            csvDateFormat: "dd/mm/yyyy",
            icsEventName: "UK State Pension Payment",
            icsCategory: "Finance",
            icsColor: "#22c55e",
        };

        localStorage.setItem(PERSIST_KEY, JSON.stringify(persisted));

        const setItemSpy = getSetItemSpy();

        render(Page, {
            // @ts-ignore
            props: {
                bankHolidays: {},
            },
        });

        // Let onMount + effects run.
        await tick();
        await tick();

        // Persistence should not write on mount; only on blur/change commits.
        const callsForPersistKey = setItemSpy.mock.calls.filter(
            ([key]) => key === PERSIST_KEY
        );
        expect(callsForPersistKey.length).toBe(0);

        // And the final value in storage should match persisted inputs.
        const finalRaw = localStorage.getItem(PERSIST_KEY);
        expect(finalRaw).toBeTruthy();
        const finalParsed = JSON.parse(finalRaw!) as any;
        expect(finalParsed.ni).toBe("29B");
        expect(finalParsed.dob).toBe("1956-03-15");
        // showWeekends has been removed from persisted inputs
    });

    it("ignores invalid persisted values and writes a sane payload on commit", async () => {
        localStorage.setItem(
            PERSIST_KEY,
            JSON.stringify({
                ni: "29B",
                dob: "1956-03-15",
                cycleDays: 999, // invalid
                csvDateFormat: "not-a-format",
                icsColor: "not-a-color",
            })
        );

        const setItemSpy = getSetItemSpy();

        const { getByLabelText } = render(Page, {
            props: {
                bankHolidays: {} as unknown as Record<string, string>,
            },
        });

        await tick();
        await tick();

        // Trigger a commit (blur) to force a write of the current in-memory state.
        const niInput = getByLabelText(/NI code/i);
        await fireEvent.focus(niInput);
        await fireEvent.blur(niInput);
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
        expect([
            "dd/mm/yyyy",
            "dd-mmm-yyyy",
            "yyyy-mm-dd",
            "mm/dd/yyyy",
            "ddd, d mmmm yyyy",
        ]).toContain(payload.csvDateFormat);
        expect(/^#[0-9a-f]{6}$/i.test(payload.icsColor)).toBe(true);
    });

    it("persists ukRegion when user has committed inputs and changes region", async () => {
        const setItemSpy = getSetItemSpy();

        const { getByLabelText } = render(Page, {
            props: {
                bankHolidays: {} as unknown as Record<string, string>,
            },
        });

        await tick();
        await tick();

        // Commit once (simulate user committing NI) so that subsequent
        // ukRegion changes are persisted by the page logic.
        const niInput = getByLabelText(/NI code/i);
        await fireEvent.focus(niInput);
        await fireEvent.blur(niInput);
        await tick();

        const regionSelect = getByLabelText(/UK Region/i) as HTMLSelectElement;
        await fireEvent.change(regionSelect, { target: { value: "GB-SCT" } });
        await tick();

        const lastPersistWrite = [...setItemSpy.mock.calls]
            .filter(([key]) => key === PERSIST_KEY)
            .at(-1);

        expect(lastPersistWrite).toBeTruthy();
        const payload = JSON.parse(String(lastPersistWrite![1])) as any;
        expect(payload.ukRegion).toBe("GB-SCT");
    });

    it("restores ukRegion from persisted inputs on load", async () => {
        // Put only ukRegion into persisted storage and ensure the page
        // restores it on mount.
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ ukRegion: "GB-NIR" }));

        const { getByLabelText } = render(Page, {
            props: {
                bankHolidays: {} as unknown as Record<string, string>,
            },
        });

        await tick();
        await tick();

        const regionSelect = getByLabelText(/UK Region/i) as HTMLSelectElement;
        expect(regionSelect.value).toBe("GB-NIR");
    });
});
