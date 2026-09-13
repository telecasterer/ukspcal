// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { waitFor } from "@testing-library/dom";
import Page from "../src/routes/+page.svelte";
import { fetchHolidaysForCountryAndYears } from "../src/lib/services/nagerHolidayService";

vi.mock("../src/lib/services/nagerHolidayService", () => ({
    fetchHolidaysForCountryAndYears: vi.fn(async () => ({})),
}));

const PERSIST_KEY = "ukspcal.inputs.v1";
const UK_CACHE_KEY = "holiday_cache_GB-ENG+GB-WLS";
const SUMMER_BANK_HOLIDAY_2028 = { "2028-08-28": "Summer Bank Holiday" };
const UK_WARNING = /Couldn't load UK bank holidays for \d{4}/;

function findDayCell(container: HTMLElement, datePattern: RegExp): Element | undefined {
    return Array.from(container.querySelectorAll("[aria-label]")).find((el) =>
        datePattern.test(el.getAttribute("aria-label") ?? "")
    );
}

// Inputs from the user report: NI 00D on a 28-day cycle is due Monday 28 Aug 2028.
function persistReportedInputs(): void {
    localStorage.setItem(
        PERSIST_KEY,
        JSON.stringify({
            ni: "00D",
            dob: "1960-12-06",
            startYear: 2027,
            numberOfYears: 5,
            cycleDays: 28,
            showBankHolidays: true,
        })
    );
}

async function renderPage() {
    const view = render(Page, {
        props: { bankHolidays: {} as Record<string, string> },
    });
    await waitFor(() => {
        expect(view.container.textContent).toContain("Payment calendar");
    });
    return view;
}

async function expectPaymentMovedToFriday(
    container: HTMLElement,
    getAllByRole: (role: string, options: { name: string }) => HTMLElement[]
): Promise<void> {
    // Page forward until August 2028 is on screen.
    for (let i = 0; i < 24 && !findDayCell(container, /28 August 2028/); i++) {
        await fireEvent.click(getAllByRole("button", { name: "Next" })[0]);
    }

    await waitFor(() => {
        const holiday = findDayCell(container, /^\S+,? 28 August 2028/);
        expect(holiday?.getAttribute("aria-label")).toContain(
            "UK bank holiday: Summer Bank Holiday."
        );
        const friday = findDayCell(container, /^\S+,? 25 August 2028/);
        expect(friday?.getAttribute("aria-label")).toContain("Early payment.");
    });
}

describe("+page UK bank holidays", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Regression: payments were generated synchronously from persisted inputs, while UK
    // bank holidays arrive asynchronously, so on every reload with saved inputs
    // Monday 28 Aug 2028 (Summer Bank Holiday) stayed a payment day instead of moving
    // to Friday 25 Aug.
    it("moves a payment off a bank holiday on an ordinary reload", async () => {
        vi.mocked(fetchHolidaysForCountryAndYears).mockImplementation(
            async () => SUMMER_BANK_HOLIDAY_2028
        );
        persistReportedInputs();

        const { container, getAllByRole } = await renderPage();

        await expectPaymentMovedToFriday(container, getAllByRole);
    });

    it("moves a payment off a bank holiday that loads late", async () => {
        let releaseHolidays!: () => void;
        const holidaysReleased = new Promise<void>((resolve) => {
            releaseHolidays = resolve;
        });
        vi.mocked(fetchHolidaysForCountryAndYears).mockImplementation(async () => {
            await holidaysReleased;
            return SUMMER_BANK_HOLIDAY_2028;
        });
        persistReportedInputs();

        const { container, getAllByRole } = await renderPage();

        releaseHolidays();
        await expectPaymentMovedToFriday(container, getAllByRole);
    });

    it("adjusts payments from cached UK holidays when offline", async () => {
        localStorage.setItem(
            UK_CACHE_KEY,
            JSON.stringify({
                data: SUMMER_BANK_HOLIDAY_2028,
                years: [2027, 2028, 2029, 2030, 2031],
                timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000, // expired
            })
        );
        vi.mocked(fetchHolidaysForCountryAndYears).mockRejectedValue(new Error("offline"));
        persistReportedInputs();

        const { container, getAllByRole } = await renderPage();

        await expectPaymentMovedToFriday(container, getAllByRole);
        expect(container.textContent).not.toMatch(UK_WARNING);
    });

    it("warns about years the holiday API has no data for", async () => {
        // Duck-typed HolidayFetchError: the service module is mocked in this file.
        vi.mocked(fetchHolidaysForCountryAndYears).mockImplementation(
            async (_country, years) => {
                throw {
                    holidays: {},
                    failedYears: [],
                    unsupportedYears: years.filter((y) => y > 2076),
                };
            }
        );
        localStorage.setItem(
            PERSIST_KEY,
            JSON.stringify({
                ni: "00D",
                dob: "2009-06-15", // SPA (68th birthday) in 2077
                startYear: 2077,
                numberOfYears: 2,
                cycleDays: 28,
                showBankHolidays: true,
            })
        );

        const { container } = await renderPage();

        await waitFor(() => {
            expect(container.textContent).toContain(
                "There's no UK bank holiday data for 2077–2078"
            );
        });
        expect(container.textContent).not.toMatch(UK_WARNING);
    });

    it("warns when UK holidays can't be loaded, and recovers when back online", async () => {
        let online = false;
        vi.mocked(fetchHolidaysForCountryAndYears).mockImplementation(async () => {
            if (!online) throw new Error("offline");
            return SUMMER_BANK_HOLIDAY_2028;
        });
        persistReportedInputs();

        const { container, getAllByRole } = await renderPage();

        await waitFor(() => {
            expect(container.textContent).toMatch(UK_WARNING);
        });

        online = true;
        window.dispatchEvent(new Event("online"));

        await waitFor(() => {
            expect(container.textContent).not.toMatch(UK_WARNING);
        });
        await expectPaymentMovedToFriday(container, getAllByRole);
    });
});
