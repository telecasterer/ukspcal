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

        expect(getByText("Claiming your State Pension")).toBeInTheDocument();
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
            getByText(/International Pension Centre \(DWP\)\./)
        ).toBeInTheDocument();
        expect(getByText(/Future Pension Centre \(DWP\)\./)).toBeInTheDocument();
    });

    it("shows ASAP claim warning when within 3 months of SPA", () => {
        currentUrl = `https://ukspcal.vercel.app/claiming?spaDate=${isoInDays(60)}`;
        const { getByText } = render(ClaimingPage);

        expect(
            getByText(/You are within 3 months of your State Pension age\./)
        ).toBeInTheDocument();
    });

    it("shows general 3-month deadline guidance when SPA is further away", () => {
        currentUrl = `https://ukspcal.vercel.app/claiming?spaDate=${isoInDays(180)}`;
        const { getByText } = render(ClaimingPage);

        expect(
            getByText(/call the relevant number above as soon as possible/i)
        ).toBeInTheDocument();
    });
});
