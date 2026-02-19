// @vitest-environment jsdom

<<<<<<< HEAD
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { within } from "@testing-library/dom";
=======
import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
>>>>>>> origin/main

vi.mock("../src/lib/utils/inAppBrowser", () => ({
    // @vitest-environment jsdom

    import { describe, it, expect, vi } from "vitest";
    import { render, fireEvent } from "@testing-library/svelte";
    import { within } from "@testing-library/dom";

    import type { DateFormat } from "../src/lib/utils/dateFormatting";

    vi.mock("../src/lib/utils/inAppBrowser", () => ({
        detectFacebookInAppBrowserFromWindow: vi.fn(),
    }));

    import CalendarView from "../src/lib/components/CalendarView.svelte";

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
    
    csvDateFormat: "dd/mm/yyyy" as DateFormat,
>>>>>>> origin/main
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
<<<<<<< HEAD
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const { container } = render(CalendarView, { props: baseProps });

        const firstMonth = container.querySelector(".calendar-month");
        expect(firstMonth).toBeTruthy();
        expect(within(firstMonth!).getByText("UK-Holiday")).toBeInTheDocument();
    });

    it("hides UK-Holiday legend when bank holidays are disabled", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const props = { ...baseProps, showBankHolidays: false };
        const { container } = render(CalendarView, { props });

        const firstMonth = container.querySelector(".calendar-month");
        expect(firstMonth).toBeTruthy();
        expect(within(firstMonth!).queryByText("UK-Holiday")).toBeNull();
    });

    it("toggles holiday legend when the UK Holidays checkbox is clicked", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const { container, getByLabelText } = render(CalendarView, {
            props: baseProps,
        });

        const firstMonth = container.querySelector(".calendar-month");
        expect(firstMonth).toBeTruthy();
        const checkbox = getByLabelText("UK Holidays") as HTMLInputElement;
        // Click to disable bank holidays
        await fireEvent.click(checkbox);
        expect(within(firstMonth!).queryByText("UK-Holiday")).toBeNull();
=======
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
>>>>>>> origin/main
    });
});
