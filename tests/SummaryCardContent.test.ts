// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";

vi.mock("../src/lib/utils/clipboard", () => ({
    copyTextToClipboard: vi.fn(),
}));

import SummaryCardContent from "../src/lib/components/SummaryCardContent.svelte";
import { copyTextToClipboard } from "../src/lib/utils/clipboard";

describe("SummaryCardContent", () => {
    const baseResult = {
        ni: "29B",
        normalDay: "Tuesday",
        cycleDays: 28,
        payments: [
            {
                due: "2026-08-05",
                paid: "2026-08-05",
                early: false,
                holidays: [],
            },
            {
                due: "2026-09-02",
                paid: "2026-09-01",
                early: true,
                holidays: ["Summer Bank Holiday"],
            },
        ],
    };

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("copies payment list and shows success status", async () => {
        vi.mocked(copyTextToClipboard).mockResolvedValue(true);
        const { getByRole, findByText } = render(SummaryCardContent, {
            props: {
                result: baseResult,
                spaDate: "Tue, 5 Aug 2026",
                nextPaymentDate: "",
            },
        });

        await fireEvent.click(getByRole("button", { name: "Copy list" }));
        expect(await findByText("Payment list copied.")).toBeInTheDocument();
        expect(copyTextToClipboard).toHaveBeenCalledOnce();
    });

    it("shows copy failure status when clipboard copy fails", async () => {
        vi.mocked(copyTextToClipboard).mockResolvedValue(false);
        const { getByRole, findByText } = render(SummaryCardContent, {
            props: {
                result: baseResult,
                spaDate: "Tue, 5 Aug 2026",
                nextPaymentDate: "",
            },
        });

        await fireEvent.click(getByRole("button", { name: "Copy list" }));
        expect(
            await findByText("Couldn't copy automatically — please try again.")
        ).toBeInTheDocument();
    });

    it("saves payment list as text file", async () => {
        const createObjectURL = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:test-url");
        const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
        const clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => {});

        const { getByRole, findByText } = render(SummaryCardContent, {
            props: {
                result: baseResult,
                spaDate: "Tue, 5 Aug 2026",
                nextPaymentDate: "",
            },
        });

        await fireEvent.click(getByRole("button", { name: "Save list" }));

        await waitFor(() => {
            expect(createObjectURL).toHaveBeenCalledOnce();
            expect(clickSpy).toHaveBeenCalledOnce();
            expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
        });
        expect(await findByText("Payment list saved.")).toBeInTheDocument();
    });

    it("shows popup-blocked status when print window cannot open", async () => {
        const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
        const createObjectURL = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:print-url");
        const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

        const { getByRole, findByText } = render(SummaryCardContent, {
            props: {
                result: baseResult,
                spaDate: "Tue, 5 Aug 2026",
                nextPaymentDate: "",
            },
        });

        await fireEvent.click(getByRole("button", { name: "Print list" }));

        expect(openSpy).toHaveBeenCalledOnce();
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:print-url");
        expect(
            await findByText("Pop-up blocked. Allow pop-ups to print this list.")
        ).toBeInTheDocument();
        expect(createObjectURL).toHaveBeenCalledOnce();
    });

    it("shows state pension claim date details and link to claiming page", async () => {
        const { getByText, getByRole } = render(SummaryCardContent, {
            props: {
                result: baseResult,
                spaDate: "Tue, 5 Aug 2026",
                nextPaymentDate: "",
                statePensionApplyInfo: {
                    applyFromIso: "2026-04-05",
                    applyFromFormatted: "Sunday, 5 April 2026",
                    countdownDays: 40,
                    applyNow: false,
                },
            },
        });

        expect(
            getByText(
                "You can apply from Sunday, 5 April 2026 (40 days to go)."
            )
        ).toBeInTheDocument();

        const link = getByRole("link", { name: "Claiming your State Pension" });
        expect(link).toHaveAttribute("href", "/claiming");
    });

    it("shows within-3-months warning in summary when applicable", async () => {
        const { findByText } = render(SummaryCardContent, {
            props: {
                result: baseResult,
                spaDate: "Tue, 5 Aug 2026",
                nextPaymentDate: "",
                statePensionApplyInfo: {
                    applyFromIso: "2026-04-05",
                    applyFromFormatted: "Sunday, 5 April 2026",
                    countdownDays: 0,
                    applyNow: true,
                },
                isWithinThreeMonthsOfSpa: true,
            },
        });

        expect(
            await findByText(
                "You are within 3 months of your State Pension age. If you have not claimed yet, claim as soon as possible."
            )
        ).toBeInTheDocument();
    });
});
