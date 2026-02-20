// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
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

describe("CalendarView", () => {
    it("renders calendar header and controls", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const { getByRole, getByText } = render(CalendarView, {
            props: baseProps,
        });
        expect(getByText("Payment calendar")).toBeInTheDocument();
        expect(getByRole("button", { name: "Export" })).toBeInTheDocument();
        expect(
            getByRole("button", { name: "Print calendar" })
        ).toBeInTheDocument();
    });

    it("opens print unsupported modal for in-app browsers", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(true);
        const { getByRole, findByText } = render(CalendarView, {
            props: baseProps,
        });
        await fireEvent.click(getByRole("button", { name: "Print calendar" }));
        expect(await findByText("Printing not available")).toBeInTheDocument();
    });

    it("shows loading status for additional holidays", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);

        const { getByText } = render(CalendarView, {
            props: {
                ...baseProps,
                selectedCountry: "FR",
                isLoadingAdditionalHolidays: true,
            },
        });

        expect(getByText("Loading additional holidays...")).toBeInTheDocument();
    });

    it("shows additional holiday load error", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);

        const message = "Couldn't load additional holidays right now. Try again.";
        const { getByText } = render(CalendarView, {
            props: {
                ...baseProps,
                selectedCountry: "FR",
                additionalHolidaysError: message,
            },
        });

        expect(getByText(message)).toBeInTheDocument();
    });

    it("shows day details toast when clicking a payment day", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);

        const { getAllByLabelText, findByText } = render(CalendarView, {
            props: baseProps,
        });

        const paymentCell = getAllByLabelText(/Payment day\./i)[0];
        await fireEvent.click(paymentCell);

        expect(await findByText("Payment day.")).toBeInTheDocument();
    });

    it("renders Today in both navigation rows", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);

        const { getAllByRole } = render(CalendarView, {
            props: baseProps,
        });

        expect(getAllByRole("button", { name: "Today" })).toHaveLength(2);
    });

    it("disables Today when current month is outside generated range", () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const { getAllByRole } = render(CalendarView, {
            props: {
                ...baseProps,
                payments: [
                    { due: "2020-01-06", paid: "2020-01-06", early: false },
                    { due: "2020-02-03", paid: "2020-02-03", early: false },
                ],
                currentMonth: 0,
                currentYear: 2020,
            },
        });

        const todayButtons = getAllByRole("button", { name: "Today" });
        todayButtons.forEach((btn) => expect(btn).toBeDisabled());
    });

    it("enables Today when current month is within generated range", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);

        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth();
        const monthIso = String(month + 1).padStart(2, "0");
        const nextMonth = new Date(Date.UTC(year, month + 1, 1));
        const nextMonthIso = String(nextMonth.getUTCMonth() + 1).padStart(2, "0");
        const nextMonthYear = nextMonth.getUTCFullYear();

        const scrollIntoViewMock = vi.fn();
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
            value: scrollIntoViewMock,
            configurable: true,
            writable: true,
        });

        const { getAllByRole } = render(CalendarView, {
            props: {
                ...baseProps,
                payments: [
                    {
                        due: `${year}-${monthIso}-05`,
                        paid: `${year}-${monthIso}-05`,
                        early: false,
                    },
                    {
                        due: `${nextMonthYear}-${nextMonthIso}-02`,
                        paid: `${nextMonthYear}-${nextMonthIso}-02`,
                        early: false,
                    },
                ],
                currentMonth: month,
                currentYear: year,
            },
        });

        const todayButtons = getAllByRole("button", { name: "Today" });
        todayButtons.forEach((btn) => expect(btn).toBeEnabled());
        await fireEvent.click(todayButtons[0]);
    });
});
