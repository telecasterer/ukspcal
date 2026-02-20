// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import CalendarMonth from "../src/lib/components/CalendarMonth.svelte";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("CalendarMonth", () => {
    it("renders payment and holiday markers", () => {
        const { container, getByLabelText, getByText } = render(CalendarMonth, {
            props: {
                year: 2026,
                month: 0,
                showBankHolidays: true,
                payments: [
                    { due: "2026-01-05", paid: "2026-01-05", early: false },
                ],
                bankHolidays: { "2026-01-01": "New Year" },
                additionalHolidays: { "2026-01-02": "Extra" },
                selectedCountry: "FR",
            },
        });

        expect(
            container.querySelector(".calendar-day.payment")
        ).toBeInTheDocument();
        expect(
            container.querySelector(".calendar-day.holiday")
        ).toBeInTheDocument();
        expect(
            container.querySelector(".calendar-day.additional-holiday")
        ).toBeInTheDocument();
        expect(getByText("France Holiday")).toBeInTheDocument();

        const paymentCell = getByLabelText(/Payment day\./i);
        expect(paymentCell).toHaveAttribute("tabindex", "0");
        expect(
            getByLabelText(/UK bank holiday: New Year\./i)
        ).toBeInTheDocument();
        expect(
            getByLabelText(/France holiday: Extra\./i)
        ).toBeInTheDocument();
    });

    it("shows tooltip on mouse hover for hover-capable devices", async () => {
        vi.stubGlobal(
            "matchMedia",
            vi.fn().mockImplementation((query: string) => ({
                matches: query === "(hover: hover) and (pointer: fine)",
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }))
        );

        const { getByLabelText, findByText } = render(CalendarMonth, {
            props: {
                year: 2026,
                month: 0,
                showBankHolidays: true,
                payments: [
                    { due: "2026-01-05", paid: "2026-01-05", early: false },
                ],
                bankHolidays: {},
                additionalHolidays: {},
                selectedCountry: "none",
            },
        });

        const paymentCell = getByLabelText(/Payment day\./i);
        await fireEvent.mouseEnter(paymentCell);
        expect(await findByText("Payment day.")).toBeInTheDocument();
    });

    it("shows tooltip on click for non-hover devices", async () => {
        vi.stubGlobal(
            "matchMedia",
            vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }))
        );

        const { getByLabelText, findByText } = render(CalendarMonth, {
            props: {
                year: 2026,
                month: 0,
                showBankHolidays: true,
                payments: [
                    { due: "2026-01-05", paid: "2026-01-05", early: false },
                ],
                bankHolidays: {},
                additionalHolidays: {},
                selectedCountry: "none",
            },
        });

        const paymentCell = getByLabelText(/Payment day\./i);
        await fireEvent.click(paymentCell);
        expect(await findByText("Payment day.")).toBeInTheDocument();
    });
});
