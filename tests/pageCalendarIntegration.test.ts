// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { waitFor } from "@testing-library/dom";
import Page from "../src/routes/+page.svelte";

vi.mock("../src/lib/services/nagerHolidayService", () => ({
    fetchHolidaysForCountryAndYears: vi.fn(async () => ({})),
}));

const PERSIST_KEY = "ukspcal.inputs.v1";

function getRangeHeaderText(container: HTMLElement): string {
    return (
        container.textContent?.match(
            /\d+\s+payments\s+·\s+[A-Za-z]{3}\s+\d{4}\s+–\s+[A-Za-z]{3}\s+\d{4}/
        )?.[0] ?? ""
    );
}

function getRangeEndYear(rangeText: string): number {
    const m = rangeText.match(/–\s+[A-Za-z]{3}\s+(\d{4})/);
    return m ? Number.parseInt(m[1], 10) : Number.NaN;
}

describe("+page calendar integration", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("keeps duration selector and header range coherent", async () => {
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
            props: { bankHolidays: {} as Record<string, string> },
        });

        await waitFor(() => {
            expect(container.textContent).toContain("Payment calendar");
        });

        const beforeRange = getRangeHeaderText(container);
        const beforeEndYear = getRangeEndYear(beforeRange);
        expect(Number.isFinite(beforeEndYear)).toBe(true);

        // Past-SPA dob already auto-grows the range to reach today (see
        // handleFirstPaymentAfterSpa), so pick a duration well beyond that
        // auto-computed baseline to still demonstrate an explicit increase.
        const durationSelect = getByLabelText("Duration") as HTMLSelectElement;
        await fireEvent.input(durationSelect, { target: { value: "20" } });
        await fireEvent.change(durationSelect, { target: { value: "20" } });

        await waitFor(() => {
            expect(durationSelect.value).toBe("20");
            const afterRange = getRangeHeaderText(container);
            const afterEndYear = getRangeEndYear(afterRange);
            expect(Number.isFinite(afterEndYear)).toBe(true);
            expect(afterEndYear).toBeGreaterThan(beforeEndYear);
        });
    });

    it("auto-extends duration by one year when Next reaches range end", async () => {
        // Uses a future SPA (dob far enough out that SPA hasn't passed) so the
        // calendar's initial focus stays anchored to the SPA-derived range
        // rather than being redirected to today, keeping the auto-extend
        // mechanic under test isolated from the past-SPA "focus on today" behavior.
        localStorage.setItem(
            PERSIST_KEY,
            JSON.stringify({
                ni: "29B",
                dob: "2005-06-15",
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

        const { container, getAllByRole, getByLabelText } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        await waitFor(() => {
            expect(container.textContent).toContain("Payment calendar");
        });

        expect((getByLabelText("Duration") as HTMLSelectElement).value).toBe("1");
        const beforeEndYear = getRangeEndYear(getRangeHeaderText(container));

        await fireEvent.click(getAllByRole("button", { name: "Next" })[0]);
        await fireEvent.click(getAllByRole("button", { name: "Next" })[0]);

        await waitFor(() => {
            expect((getByLabelText("Duration") as HTMLSelectElement).value).toBe("2");
            const afterEndYear = getRangeEndYear(getRangeHeaderText(container));
            expect(afterEndYear).toBeGreaterThan(beforeEndYear);
        });
    });
});
