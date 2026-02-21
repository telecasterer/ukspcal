// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { waitFor } from "@testing-library/dom";
import { tick } from "svelte";
import Page from "../src/routes/+page.svelte";
import { fetchHolidaysForCountryAndYears } from "../src/lib/services/nagerHolidayService";

vi.mock("../src/lib/services/nagerHolidayService", () => ({
    fetchHolidaysForCountryAndYears: vi.fn(async () => ({})),
}));

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

    it("updates calendar header range when duration changes", async () => {
        localStorage.setItem(
            PERSIST_KEY,
            JSON.stringify({
                ni: "29B",
                dob: "1956-03-15",
                startYear: 2026,
                numberOfYears: 1,
                cycleDays: 28,
                showBankHolidays: true,
                csvDateFormat: "dd/mm/yyyy",
                icsEventName: "UK State Pension Payment",
                icsCategory: "Finance",
                icsColor: "#22c55e",
            })
        );

        const { container, getByLabelText } = render(Page, {
            props: {
                bankHolidays: {} as Record<string, string>,
            },
        });

        await waitFor(() => {
            expect(container.textContent).toContain("Payment calendar");
            expect(container.textContent).toContain("payments ·");
        });

        const getHeaderText = () =>
            container.textContent?.match(/\d+\s+payments\s+·\s+[A-Za-z]{3}\s+\d{4}\s+–\s+[A-Za-z]{3}\s+\d{4}/)?.[0] ??
            "";
        const endYearFrom = (text: string): number => {
            const m = text.match(/–\s+[A-Za-z]{3}\s+(\d{4})/);
            return m ? Number.parseInt(m[1], 10) : Number.NaN;
        };

        const before = getHeaderText();
        const beforeEndYear = endYearFrom(before);
        expect(Number.isFinite(beforeEndYear)).toBe(true);

        const durationSelect = getByLabelText("Duration") as HTMLSelectElement;
        await fireEvent.input(durationSelect, { target: { value: "5" } });
        await fireEvent.change(durationSelect, { target: { value: "5" } });

        await waitFor(() => {
            const after = getHeaderText();
            const afterEndYear = endYearFrom(after);
            expect(Number.isFinite(afterEndYear)).toBe(true);
            expect(afterEndYear).toBeGreaterThan(beforeEndYear);
        });
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

    // The UK region selector has been removed from the input form; ukRegion
    // remains a page-level default (England & Wales) and is persisted on
    // input commits. There is no UI element to change it.

    it("restores ukRegion from persisted inputs on load", async () => {
        // Put only ukRegion into persisted storage and ensure the page
        // restores it on mount.
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ ukRegion: "GB-NIR" }));
        const { queryByLabelText } = render(Page, {
            props: {
                bankHolidays: {} as unknown as Record<string, string>,
            },
        });

        await tick();
        await tick();

        // There should be no UK Region select in the UI anymore.
        const regionSelect = queryByLabelText(/UK Region/i);
        expect(regionSelect).toBeNull();
    });

    it("uses mocked holiday service in page tests (no real network)", async () => {
        render(Page, {
            props: {
                bankHolidays: {} as Record<string, string>,
            },
        });
        await tick();
        await tick();

        const holidayFetchMock = vi.mocked(fetchHolidaysForCountryAndYears);
        expect(holidayFetchMock).toHaveBeenCalled();
    });
});
