// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";

vi.mock("../src/lib/utils/inAppBrowser", () => ({
    detectFacebookInAppBrowserFromWindow: vi.fn(),
}));

import CalendarView from "../src/lib/components/CalendarView.svelte";
import type { DateFormat } from "../src/lib/utils/dateFormatting";

const baseProps = {
    result: {
        ni: "00A",
        normalDay: "Monday",
        cycleDays: 28,
        payments: [],
    },
    payments: [
        { due: "2026-01-05", paid: "2026-01-05", early: false },
        { due: "2026-02-02", paid: "2026-02-02", early: false },
    ],
    bankHolidays: {},
    showBankHolidays: true,
    currentMonth: 0,
    currentYear: 2026,
    csvDateFormat: "dd/mm/yyyy" as DateFormat,
    icsEventName: "UK State Pension",
    icsCategory: "Finance",
    icsColor: "#22c55e",
    onPersist: () => undefined,
    startYearSelect: "2026",
    numberOfYearsInput: "1",
    years: [2026],
    applyStartYear: () => undefined,
    applyNumberOfYears: () => undefined,
    selectedCountry: "none",
    additionalHolidays: {},
    onCountryChange: () => undefined,
    detectedCountry: "none",
};

describe("Calendar options", () => {
    it("shows UK-Holiday legend when bank holidays are enabled", () => {
        const { getAllByText } = render(CalendarView, {
            props: { ...baseProps, showBankHolidays: true },
        });

        const matches = getAllByText("UK-Holiday");
        expect(matches.length).toBeGreaterThan(0);
    });

    it("hides UK-Holiday legend when bank holidays are disabled", () => {
        const { queryByText } = render(CalendarView, {
            props: { ...baseProps, showBankHolidays: false },
        });

        expect(queryByText("UK-Holiday")).toBeNull();
    });

    it("toggles holiday legend when the UK Holidays checkbox is clicked", async () => {
        const { container, getAllByText, queryAllByText } = render(CalendarView, {
            props: { ...baseProps, showBankHolidays: true },
        });

        // Ensure legend is present initially
        expect(getAllByText("UK-Holiday").length).toBeGreaterThan(0);

        // Find the checkbox input for UK Holidays (first checkbox in the controls)
        const checkbox = container.querySelector("input[type=checkbox]") as HTMLInputElement;
        expect(checkbox).toBeTruthy();

        // Click to toggle off
        await fireEvent.click(checkbox);
        // After clicking, the legend should be removed
        expect(queryAllByText("UK-Holiday").length).toBe(0);
    });
});
