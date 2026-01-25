// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/svelte";
import { fireEvent } from "@testing-library/dom";
import { tick } from "svelte";
import PensionInputsCard from "../src/lib/components/PensionInputsCard.svelte";

function renderCard(overrides: Partial<Parameters<typeof render>[1]> = {}) {
    const props = {
        ni: "",
        dob: "",
        startYear: 2026,
        endYear: 2027,
        cycleDays: 28,
        error: "",
        bankHolidays: {},
        ...((overrides as any).props ?? {})
    };

    return render(PensionInputsCard, { ...(overrides as any), props });
}

describe("PensionInputsCard", () => {
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
        const dobInput = document.getElementById("dob") as HTMLInputElement | null;
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

    it("shows DOB required hint when dob is empty", () => {
        const { getByText } = renderCard();
        expect(getByText(/Required to calculate your State Pension age/i)).toBeInTheDocument();
    });

    it("shows invalid-date alert when dob is present but invalid", () => {
        const { getByText } = renderCard({ props: { dob: "not-a-date" } } as any);
        expect(getByText(/Please enter a valid date/i)).toBeInTheDocument();
    });

    it("calls onFirstPaymentAfterSpa when it can compute the first payment", async () => {
        const onFirstPaymentAfterSpa = vi.fn();

        renderCard({
            props: {
                ni: "29B",
                dob: "1956-03-15",
                startYear: 2026,
                endYear: 2028,
                cycleDays: 28,
                onFirstPaymentAfterSpa
            }
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
