// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import type { DateFormat } from "../src/lib/utils/dateFormatting";

vi.mock("../src/lib/utils/inAppBrowser", () => ({
    detectFacebookInAppBrowserFromWindow: vi.fn()
}));

import CalendarView from "../src/lib/components/CalendarView.svelte";
import { detectFacebookInAppBrowserFromWindow } from "../src/lib/utils/inAppBrowser";

const baseProps = {
    result: {
        ni: "00A",
        normalDay: "Monday",
        cycleDays: 28,
        payments: []
    },
    payments: [
        { due: "2026-01-05", paid: "2026-01-05", early: false },
        { due: "2026-02-02", paid: "2026-02-02", early: false }
    ],
    bankHolidays: {},
    showWeekends: true,
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
    detectedCountry: "none"
};

describe("CalendarView", () => {
    it("renders calendar header and controls", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const { getByText } = render(CalendarView, { props: baseProps });
        expect(getByText("Payment calendar")).toBeInTheDocument();
        expect(getByText("⬇️ Export")).toBeInTheDocument();
        expect(getByText("🖨️ Print")).toBeInTheDocument();
    });

    it("opens print unsupported modal for in-app browsers", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(true);
        const { getByText, findByText } = render(CalendarView, { props: baseProps });
        await fireEvent.click(getByText("🖨️ Print"));
        expect(await findByText("Printing not available")).toBeInTheDocument();
    });
});
