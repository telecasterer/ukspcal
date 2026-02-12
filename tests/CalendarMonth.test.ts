// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import CalendarMonth from "../src/lib/components/CalendarMonth.svelte";

describe("CalendarMonth", () => {
    it("renders payment and holiday markers", () => {
        const { container } = render(CalendarMonth, {
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
    });
});
