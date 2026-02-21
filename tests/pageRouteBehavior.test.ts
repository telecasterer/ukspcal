// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import Page from "../src/routes/+page.svelte";
import { fetchHolidaysForCountryAndYears } from "../src/lib/services/nagerHolidayService";

vi.mock("../src/lib/services/nagerHolidayService", () => ({
    fetchHolidaysForCountryAndYears: vi.fn(async () => ({})),
}));

const PERSIST_KEY = "ukspcal.inputs.v1";

function basePersistedInputs(overrides: Record<string, unknown> = {}) {
    return {
        ni: "29B",
        dob: "",
        startYear: 2026,
        numberOfYears: 1,
        cycleDays: 28,
        showBankHolidays: true,
        csvDateFormat: "dd/mm/yyyy",
        icsEventName: "UK State Pension Payment",
        icsCategory: "Finance",
        icsColor: "#22c55e",
        ...overrides,
    };
}

function getRangeHeaderText(container: HTMLElement): string {
    return (
        container.textContent?.match(
            /\d+\s+payments\s+·\s+[A-Za-z]{3}\s+\d{4}\s+–\s+[A-Za-z]{3}\s+\d{4}/
        )?.[0] ?? ""
    );
}

function getRangeEndYear(rangeText: string): number {
    const m = rangeText.match(/–\s+[A-Za-z]{3}\s+(\d{4})/);
    return m ? Number.parseInt(m[1], 10) : Number.NaN;
}

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("+page route behavior", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("ignores stale holiday fetch errors after user changes country again", async () => {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(basePersistedInputs()));

        const frDeferred = deferred<Record<string, string>>();
        const holidayFetchMock = vi.mocked(fetchHolidaysForCountryAndYears);
        holidayFetchMock.mockImplementation((countryCode) => {
            if (countryCode === "GB") return Promise.resolve({});
            if (countryCode === "FR") return frDeferred.promise;
            if (countryCode === "DE") return Promise.resolve({});
            return Promise.resolve({});
        });

        const { container, getByLabelText } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        await waitFor(() => {
            expect(container.textContent).toContain("Payment calendar");
        });

        const additionalHolidaysCheckbox = getByLabelText("Additional holidays");
        await fireEvent.click(additionalHolidaysCheckbox);

        await waitFor(() => {
            expect(container.querySelector("#country-holidays")).toBeTruthy();
        });
        const countrySelect = container.querySelector("#country-holidays") as HTMLSelectElement;

        await fireEvent.change(countrySelect, { target: { value: "FR" } });
        await fireEvent.change(countrySelect, { target: { value: "DE" } });

        await waitFor(() => {
            expect(container.textContent).not.toContain("Loading additional holidays...");
        });

        frDeferred.reject(new Error("stale FR request failed"));
        await Promise.resolve();

        expect(container.textContent).not.toContain(
            "Couldn't load additional holidays right now. Try again."
        );
        expect(countrySelect.value).toBe("DE");
    });

    it("uses latest duration selection when changed rapidly", async () => {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(basePersistedInputs()));
        vi.mocked(fetchHolidaysForCountryAndYears).mockResolvedValue({});

        const { container, getByLabelText } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        await waitFor(() => {
            expect(container.textContent).toContain("Payment calendar");
        });

        const user = userEvent.setup();
        const beforeEndYear = getRangeEndYear(getRangeHeaderText(container));
        await user.selectOptions(getByLabelText("Duration"), "5");
        await user.selectOptions(getByLabelText("Duration"), "2");

        await waitFor(() => {
            const durationSelect = getByLabelText("Duration") as HTMLSelectElement;
            expect(durationSelect.value).toBe("2");
            const rangeEndYear = getRangeEndYear(getRangeHeaderText(container));
            expect(Number.isFinite(rangeEndYear)).toBe(true);
            expect(rangeEndYear).toBeGreaterThanOrEqual(beforeEndYear);
            const persistedRaw = localStorage.getItem(PERSIST_KEY);
            expect(persistedRaw).toBeTruthy();
            const persisted = JSON.parse(String(persistedRaw)) as {
                numberOfYears?: number;
            };
            expect(persisted.numberOfYears).toBe(2);
        });
    });

    it("persists duration and restores it on next load", async () => {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(basePersistedInputs()));
        vi.mocked(fetchHolidaysForCountryAndYears).mockResolvedValue({});

        const first = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        await waitFor(() => {
            expect(first.container.textContent).toContain("Payment calendar");
        });

        const user = userEvent.setup();
        await user.selectOptions(first.getByLabelText("Duration"), "3");

        await waitFor(() => {
            const durationSelect = first.getByLabelText("Duration") as HTMLSelectElement;
            expect(durationSelect.value).toBe("3");
        });

        const persistedRaw = localStorage.getItem(PERSIST_KEY);
        expect(persistedRaw).toBeTruthy();
        const persisted = JSON.parse(String(persistedRaw)) as {
            numberOfYears?: number;
        };
        expect(persisted.numberOfYears).toBe(3);

        first.unmount();

        const second = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        await waitFor(() => {
            expect(second.container.textContent).toContain("Payment calendar");
        });

        const restoredDuration = second.getByLabelText("Duration") as HTMLSelectElement;

        await waitFor(() => {
            expect(restoredDuration.value).toBe("3");
            const rangeEndYear = getRangeEndYear(getRangeHeaderText(second.container));
            expect(Number.isFinite(rangeEndYear)).toBe(true);
            expect(rangeEndYear).toBeGreaterThanOrEqual(2028);
        });
    });
});
