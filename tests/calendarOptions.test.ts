// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { within } from "@testing-library/dom";

import type { DateFormat } from "../src/lib/utils/dateFormatting";

vi.mock("../src/lib/utils/inAppBrowser", () => ({
    detectFacebookInAppBrowserFromWindow: vi.fn(),
}));

import CalendarView from "../src/lib/components/CalendarView.svelte";
import { detectFacebookInAppBrowserFromWindow } from "../src/lib/utils/inAppBrowser";

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
    isLoadingAdditionalHolidays: false,
    additionalHolidaysError: "",
    onCountryChange: () => undefined,
    detectedCountry: "none",
};

describe("Calendar options", () => {
    it("shows UK Holiday legend when bank holidays are enabled", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const { container } = render(CalendarView, { props: baseProps });

        const firstMonth = container.querySelector(".calendar-month") as HTMLElement | null;
        expect(firstMonth).toBeTruthy();
        expect(
            within(firstMonth as HTMLElement).getByText("UK Holiday")
        ).toBeInTheDocument();
    });

    it("hides UK Holiday legend when bank holidays are disabled", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const props = { ...baseProps, showBankHolidays: false };
        const { container } = render(CalendarView, { props });

        const firstMonth = container.querySelector(".calendar-month") as HTMLElement | null;
        expect(firstMonth).toBeTruthy();
        expect(
            within(firstMonth as HTMLElement).queryByText("UK Holiday")
        ).toBeNull();
    });

    it("toggles holiday legend when the UK holidays checkbox is clicked", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const { container, getByLabelText } = render(CalendarView, {
            props: baseProps,
        });

        const firstMonth = container.querySelector(".calendar-month") as HTMLElement | null;
        expect(firstMonth).toBeTruthy();
        const checkbox = getByLabelText("UK holidays") as HTMLInputElement;
        // Click to disable bank holidays
        await fireEvent.click(checkbox);
        expect(
            within(firstMonth as HTMLElement).queryByText("UK Holiday")
        ).toBeNull();
    });
});
