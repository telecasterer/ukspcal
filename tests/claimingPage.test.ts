// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/svelte";
import ClaimingPage from "../src/routes/claiming/+page.svelte";

let currentUrl = "https://ukspcal.vercel.app/claiming";

vi.mock("$app/state", () => ({
    page: {
        get url() {
            return new URL(currentUrl);
        },
    },
}));

function isoInDays(daysFromToday: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + daysFromToday);
    return d.toISOString().slice(0, 10);
}

describe("Claiming page", () => {
    it("renders official links and department phone numbers", () => {
        currentUrl = "https://ukspcal.vercel.app/claiming";
        const { getByText, getByRole } = render(ClaimingPage);

        expect(
            getByRole("heading", { level: 1, name: "How to claim your State Pension" })
        ).toBeInTheDocument();
        expect(
            getByRole("link", { name: "GOV.UK: Get your State Pension" })
        ).toHaveAttribute("href", "https://www.gov.uk/get-state-pension");
        expect(
            getByRole("link", { name: "GOV.UK: Claim if you retire abroad" })
        ).toHaveAttribute(
            "href",
            "https://www.gov.uk/state-pension-if-you-retire-abroad/how-to-claim"
        );
        expect(getByText(/The Pension Service \(DWP\)\./)).toBeInTheDocument();
        expect(
            getByText(/International Pension Centre \(DWP\)/)
        ).toBeInTheDocument();
        expect(getByText(/Future Pension Centre \(DWP\)\./)).toBeInTheDocument();
        expect(getByText(/IBAN and BIC/i)).toBeInTheDocument();
    });

    it("sends Northern Ireland residents to nidirect and the NI Pension Centre", () => {
        currentUrl = "https://ukspcal.vercel.app/claiming";
        const { getByRole } = render(ClaimingPage);

        expect(
            getByRole("link", { name: "nidirect: Get your State Pension" })
        ).toHaveAttribute("href", "https://www.nidirect.gov.uk/services/get-your-state-pension");
        expect(getByRole("link", { name: "0808 100 2658" })).toHaveAttribute(
            "href",
            "tel:08081002658"
        );
    });

    it("shows ASAP claim warning when within 3 months of SPA", () => {
        currentUrl = `https://ukspcal.vercel.app/claiming?spaDate=${isoInDays(60)}`;
        const { getByText } = render(ClaimingPage);

        expect(
            getByText(/You are within 3 months of your State Pension age\./)
        ).toBeInTheDocument();
    });

    it("shows general no-invitation-letter guidance when SPA is further away", () => {
        currentUrl = `https://ukspcal.vercel.app/claiming?spaDate=${isoInDays(180)}`;
        const { getByText } = render(ClaimingPage);

        expect(
            getByText(/you can request an invitation code on GOV\.UK or call the relevant number above to claim/i)
        ).toBeInTheDocument();
    });
});
