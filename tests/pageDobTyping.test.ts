// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { waitFor } from "@testing-library/dom";
import Page from "../src/routes/+page.svelte";
import { fetchHolidaysForCountryAndYears } from "../src/lib/services/nagerHolidayService";
import { MAX_NUMBER_OF_YEARS } from "../src/lib/config";

vi.mock("../src/lib/services/nagerHolidayService", () => ({
    fetchHolidaysForCountryAndYears: vi.fn(async () => ({})),
}));

const PERSIST_KEY = "ukspcal.inputs.v1";

describe("+page date of birth typing", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(fetchHolidaysForCountryAndYears).mockClear();
    });

    // Regression: a date input emits partial years while the year is typed. "0196"
    // gave an SPA in year 261, and the past-SPA range growth then generated ~1,765
    // years of payments and one holiday request per year, hanging the page.
    it("never generates more than the maximum range for partial years", async () => {
        localStorage.setItem(
            PERSIST_KEY,
            JSON.stringify({
                ni: "00D",
                dob: "",
                startYear: 2026,
                numberOfYears: 5,
                cycleDays: 28,
                showBankHolidays: true,
            })
        );

        const { container, getByLabelText } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });
        const dobInput = container.querySelector('input[name="dob"]') as HTMLInputElement;
        await waitFor(() => expect(dobInput).toBeTruthy());

        // What a date input reports as each digit of "1950" is typed.
        for (const value of ["0001-05-15", "0019-05-15", "0195-05-15", "1950-05-15"]) {
            await fireEvent.input(dobInput, { target: { value } });
        }

        await waitFor(() => {
            expect(container.textContent).toMatch(/\d+\s+payments\s+·\s+[A-Za-z]{3}\s+2015\s+–/);
        });

        const duration = Number((getByLabelText("Duration") as HTMLSelectElement).value);
        expect(duration).toBeLessThanOrEqual(MAX_NUMBER_OF_YEARS);
        for (const [, years] of vi.mocked(fetchHolidaysForCountryAndYears).mock.calls) {
            expect(years.length).toBeLessThanOrEqual(MAX_NUMBER_OF_YEARS);
            expect(Math.min(...years)).toBeGreaterThanOrEqual(1900);
        }
    });
});
