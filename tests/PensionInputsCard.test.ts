// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render } from "@testing-library/svelte";
import { fireEvent } from "@testing-library/dom";
import { tick } from "svelte";
import PensionInputsCard from "../src/lib/components/PensionInputsCard.svelte";

function renderCard(overrides: Partial<Parameters<typeof render>[1]> = {}) {
    const props = {
        ni: "",
        dob: "",
        startYear: 2026,
        numberOfYears: 5,
        cycleDays: 28,
        error: "",
        bankHolidays: {},
        ...((overrides as any).props ?? {}),
    };

    return render(PensionInputsCard, { ...(overrides as any), props });
}

const VALID_PROPS = { ni: "29B", dob: "1960-06-15" };

describe("PensionInputsCard", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it("shows NI format hint when NI is invalid", () => {
        const { getByText } = renderCard({ props: { ni: "1" } } as any);
        expect(getByText(/Format: 2 digits then A–D/i)).toBeInTheDocument();
    });

    it("uppercases NI input on blur", async () => {
        const { getByLabelText } = renderCard();
        const input = getByLabelText(/NI code/i) as HTMLInputElement;

        await fireEvent.focus(input);
        await fireEvent.input(input, { target: { value: "12d" } });
        await fireEvent.blur(input);
        await tick();

        expect(input.value).toBe("12D");
    });

    it("commits NI and focuses DoB on Enter", async () => {
        const { getByLabelText } = renderCard();
        const niInput = getByLabelText(/NI code/i) as HTMLInputElement;
        const dobInput = document.getElementById(
            "dob"
        ) as HTMLInputElement | null;
        expect(dobInput).toBeTruthy();

        await fireEvent.focus(niInput);
        await fireEvent.input(niInput, { target: { value: "12d" } });
        await fireEvent.keyDown(niInput, { key: "Enter" });

        // Focus is queued via queueMicrotask.
        await Promise.resolve();
        await tick();

        expect(niInput.value).toBe("12D");
        expect(document.activeElement).toBe(dobInput);
    });

    it("keeps Restore defaults keyboard focusable", () => {
        const { getByRole } = renderCard();
        const restoreButton = getByRole("button", {
            name: /Restore defaults/i,
        });
        expect(restoreButton).not.toHaveAttribute("tabindex", "-1");
    });

    it("sets default DOB to Jan 1 of (current year - 66) when empty", () => {
        const { getByDisplayValue } = renderCard();
        const currentYear = new Date().getFullYear();
        const expectedDefaultDob = `${currentYear - 66}-01-01`;
        expect(getByDisplayValue(expectedDefaultDob)).toBeInTheDocument();
    });

    describe("profiles UI", () => {
        it("shows '+ Save current' button when NI and DOB are filled", async () => {
            const { getByText } = renderCard({ props: VALID_PROPS } as any);
            await tick();
            expect(getByText("+ Save current")).toBeInTheDocument();
        });

        it("shows name input after clicking '+ Save current'", async () => {
            const { getByText, getByPlaceholderText } = renderCard({ props: VALID_PROPS } as any);
            await tick();
            await fireEvent.click(getByText("+ Save current"));
            await tick();
            expect(getByPlaceholderText(/Profile name/i)).toBeInTheDocument();
        });

        it("saves a profile and shows a pill after committing a name", async () => {
            const { getByText, getByPlaceholderText } = renderCard({ props: VALID_PROPS } as any);
            await tick();

            await fireEvent.click(getByText("+ Save current"));
            await tick();

            const input = getByPlaceholderText(/Profile name/i);
            await fireEvent.input(input, { target: { value: "Rose" } });
            await fireEvent.click(getByText("Save"));
            await tick();

            expect(getByText("Rose")).toBeInTheDocument();
        });

        it("cancels naming and hides the input", async () => {
            const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderCard({ props: VALID_PROPS } as any);
            await tick();

            await fireEvent.click(getByText("+ Save current"));
            await tick();
            expect(getByPlaceholderText(/Profile name/i)).toBeInTheDocument();

            await fireEvent.click(getByText("Cancel"));
            await tick();
            expect(queryByPlaceholderText(/Profile name/i)).not.toBeInTheDocument();
        });

        it("removes a profile pill after clicking its delete button", async () => {
            const { getByText, getByPlaceholderText, queryByText, getByLabelText } = renderCard({ props: VALID_PROPS } as any);
            await tick();

            await fireEvent.click(getByText("+ Save current"));
            await tick();
            await fireEvent.input(getByPlaceholderText(/Profile name/i), { target: { value: "Rose" } });
            await fireEvent.click(getByText("Save"));
            await tick();

            expect(getByText("Rose")).toBeInTheDocument();

            await fireEvent.click(getByLabelText(/Delete profile Rose/i));
            await tick();

            expect(queryByText("Rose")).not.toBeInTheDocument();
        });
    });

    it("formats SPA and payment dates using UTC, not local timezone (timezone regression)", async () => {
        // DOB 1960-02-23 → SPA 2026-02-23 (Monday in UTC).
        // NI 17B, 28-day cycle → first payment due 2026-03-02 (Monday in UTC).
        // Without timeZone:"UTC" in toLocaleDateString, a UTC-negative device
        // (e.g. Canada, UTC-5) sees midnight UTC as the previous evening, shifting
        // every displayed date back one day — showing Sunday instead of Monday.
        const onSpaPreviewData = vi.fn();
        renderCard({
            props: {
                ni: "17B",
                dob: "1960-02-23",
                startYear: 2026,
                numberOfYears: 5,
                cycleDays: 28,
                bankHolidays: {},
                onSpaPreviewData,
            },
        } as any);

        await tick();

        expect(onSpaPreviewData).toHaveBeenCalled();
        const data = onSpaPreviewData.mock.calls.at(-1)?.[0];
        expect(data).toBeTruthy();
        expect(data.spaDateFormatted).toContain("Monday");
        expect(data.spaDateFormatted).toContain("23 February 2026");
        expect(data.firstPayment?.dueFormatted).toContain("Monday");
        expect(data.firstPayment?.dueFormatted).toContain("2 March 2026");
        expect(data.secondPayment?.dueFormatted).toContain("Monday");
        expect(data.secondPayment?.dueFormatted).toContain("30 March 2026");
    });

    it("calls onFirstPaymentAfterSpa when it can compute the first payment", async () => {
        const onFirstPaymentAfterSpa = vi.fn();

        renderCard({
            props: {
                ni: "29B",
                dob: "1956-03-15",
                startYear: 2026,
                numberOfYears: 2,
                cycleDays: 28,
                onFirstPaymentAfterSpa,
            },
        } as any);

        // Let reactive effects run.
        await tick();

        expect(onFirstPaymentAfterSpa).toHaveBeenCalled();
        const arg = onFirstPaymentAfterSpa.mock.calls.at(-1)?.[0];
        // Either a Payment object or null; in this case it should be Payment-like.
        expect(arg).toBeTruthy();
        expect(arg).toHaveProperty("due");
        expect(arg).toHaveProperty("paid");
    });

});
