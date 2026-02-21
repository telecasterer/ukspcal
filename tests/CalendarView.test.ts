// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { waitFor } from "@testing-library/dom";
import type { DateFormat } from "../src/lib/utils/dateFormatting";

vi.mock("../src/lib/utils/inAppBrowser", () => ({
    detectFacebookInAppBrowserFromWindow: vi.fn(),
}));
vi.mock("../src/lib/utils/clipboard", () => ({
    copyLinkToClipboard: vi.fn(async () => true),
}));

import CalendarView from "../src/lib/components/CalendarView.svelte";
import { detectFacebookInAppBrowserFromWindow } from "../src/lib/utils/inAppBrowser";
import { copyLinkToClipboard } from "../src/lib/utils/clipboard";

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

    it("prints in normal browsers and toggles print-only grid with print events", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

        const { container, getByRole } = render(CalendarView, {
            props: baseProps,
        });

        await fireEvent.click(getByRole("button", { name: "Print calendar" }));

        await waitFor(() => {
            expect(printSpy).toHaveBeenCalledTimes(1);
            expect(container.querySelector(".print-only")).toBeInTheDocument();
        });

        window.dispatchEvent(new Event("afterprint"));
        await waitFor(() => {
            expect(container.querySelector(".print-only")).not.toBeInTheDocument();
            expect(container.querySelector(".screen-only")).toBeInTheDocument();
        });
    });

    it("shows fallback copy message when print throws and copy fails", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        vi.spyOn(window, "print").mockImplementation(() => {
            throw new Error("print blocked");
        });
        vi.mocked(copyLinkToClipboard).mockResolvedValue(false);

        const { getByRole, findByText } = render(CalendarView, {
            props: baseProps,
        });

        await fireEvent.click(getByRole("button", { name: "Print calendar" }));
        expect(await findByText("Printing not available")).toBeInTheDocument();

        const copyLinkText = await findByText("Copy link");
        await fireEvent.click(copyLinkText.closest("button") ?? copyLinkText);
        expect(
            await findByText(
                "Couldn't copy automatically — please copy the address bar URL."
            )
        ).toBeInTheDocument();
    });

    it("shows success copy message when print throws and copy succeeds", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        vi.spyOn(window, "print").mockImplementation(() => {
            throw new Error("print blocked");
        });
        vi.mocked(copyLinkToClipboard).mockResolvedValue(true);

        const { getByRole, findByText } = render(CalendarView, {
            props: baseProps,
        });

        await fireEvent.click(getByRole("button", { name: "Print calendar" }));
        expect(await findByText("Printing not available")).toBeInTheDocument();

        const copyLinkText = await findByText("Copy link");
        await fireEvent.click(copyLinkText.closest("button") ?? copyLinkText);
        expect(await findByText("Link copied.")).toBeInTheDocument();
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

    it("enables additional holidays from detected country and can disable again", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const onCountryChange = vi.fn();
        const onPersist = vi.fn();

        const { getByLabelText } = render(CalendarView, {
            props: {
                ...baseProps,
                selectedCountry: "none",
                detectedCountry: "DE",
                onCountryChange,
                onPersist,
            },
        });

        const checkbox = getByLabelText("Additional holidays");
        await fireEvent.click(checkbox);
        expect(onCountryChange).toHaveBeenCalledWith("DE");
        expect(onPersist).toHaveBeenCalled();

        await fireEvent.click(checkbox);
        expect(onCountryChange).toHaveBeenCalledWith("none");
    });

    it("uses FR fallback when detected country is none", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const onCountryChange = vi.fn();
        const onPersist = vi.fn();

        const { getByLabelText } = render(CalendarView, {
            props: {
                ...baseProps,
                selectedCountry: "none",
                detectedCountry: "none",
                onCountryChange,
                onPersist,
            },
        });

        const checkbox = getByLabelText("Additional holidays");
        await fireEvent.click(checkbox);
        expect(onCountryChange).toHaveBeenCalledWith("FR");
        expect(onPersist).toHaveBeenCalled();
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

    it("auto-extends range when Next is clicked at the end", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const extendRangeByOneYear = vi.fn(() => true);

        const { getAllByRole } = render(CalendarView, {
            props: {
                ...baseProps,
                currentMonth: 1,
                currentYear: 2026,
                extendRangeByOneYear,
            },
        });

        await fireEvent.click(getAllByRole("button", { name: "Next" })[0]);
        expect(extendRangeByOneYear).toHaveBeenCalledTimes(1);
    });

    it("calls start year and duration apply handlers on select input/change", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const applyStartYear = vi.fn();
        const applyNumberOfYears = vi.fn();

        const { getByLabelText } = render(CalendarView, {
            props: {
                ...baseProps,
                applyStartYear,
                applyNumberOfYears,
            },
        });

        const startYear = getByLabelText("Start year");
        const duration = getByLabelText("Duration");

        await fireEvent.input(startYear, { target: { value: "2026" } });
        await fireEvent.change(startYear, { target: { value: "2026" } });
        await fireEvent.input(duration, { target: { value: "2" } });
        await fireEvent.change(duration, { target: { value: "2" } });

        expect(applyStartYear).toHaveBeenCalled();
        expect(applyNumberOfYears).toHaveBeenCalled();
    });

    it("calls onCountryChange and onPersist when country selection changes", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const onCountryChange = vi.fn();
        const onPersist = vi.fn();

        const { getByLabelText } = render(CalendarView, {
            props: {
                ...baseProps,
                selectedCountry: "FR",
                onCountryChange,
                onPersist,
            },
        });

        const countrySelect = getByLabelText("Additional holidays")
            .closest("div")
            ?.querySelector("#country-holidays") as HTMLSelectElement;
        expect(countrySelect).toBeInTheDocument();

        await fireEvent.change(countrySelect, { target: { value: "DE" } });
        expect(onCountryChange).toHaveBeenCalledWith("DE");
        expect(onPersist).toHaveBeenCalled();
    });

    it("auto-extends from both navigation rows when each is at range end", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const extendRangeByOneYear = vi.fn(() => true);

        const { getAllByRole } = render(CalendarView, {
            props: {
                ...baseProps,
                currentMonth: 1,
                currentYear: 2026,
                extendRangeByOneYear,
            },
        });

        const nextButtons = getAllByRole("button", { name: "Next" });
        await fireEvent.click(nextButtons[0]);
        await fireEvent.click(nextButtons[1]);
        expect(extendRangeByOneYear).toHaveBeenCalledTimes(2);
    });

    it("does not auto-extend while next step is still available", async () => {
        const detectMock = vi.mocked(detectFacebookInAppBrowserFromWindow);
        detectMock.mockReturnValue(false);
        const extendRangeByOneYear = vi.fn(() => true);

        const monthlyPayments = Array.from({ length: 12 }, (_, i) => {
            const month = String(i + 1).padStart(2, "0");
            return {
                due: `2026-${month}-05`,
                paid: `2026-${month}-05`,
                early: false,
            };
        });

        const { getAllByRole } = render(CalendarView, {
            props: {
                ...baseProps,
                payments: monthlyPayments,
                currentMonth: 0,
                currentYear: 2026,
                extendRangeByOneYear,
            },
        });

        await fireEvent.click(getAllByRole("button", { name: "Next" })[0]);
        expect(extendRangeByOneYear).not.toHaveBeenCalled();
    });
});
