// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";

vi.mock("../src/lib/utils/clipboard", () => ({
    copyLinkToClipboard: vi.fn().mockResolvedValue(true),
}));
vi.mock("../src/lib/utils/posthog", () => ({
    capturePosthog: vi.fn(),
}));

import ShareButton from "../src/lib/components/ShareButton.svelte";
import { copyLinkToClipboard } from "../src/lib/utils/clipboard";

describe("ShareButton", () => {
    it("falls back to copy and shows status", async () => {
        Object.assign(navigator, { share: undefined });
        const { getByText, findByText } = render(ShareButton);
        await fireEvent.click(getByText("Share"));
        expect(await findByText("Link copied.")).toBeInTheDocument();
    });

    it("shows failure status when copy fallback fails", async () => {
        vi.mocked(copyLinkToClipboard).mockResolvedValueOnce(false);
        Object.assign(navigator, { share: undefined });
        const { getByText, findByText } = render(ShareButton);
        await fireEvent.click(getByText("Share"));
        expect(
            await findByText(
                "Couldn't copy automatically — please copy the address bar URL."
            )
        ).toBeInTheDocument();
    });

    it("uses native share and shows success status", async () => {
        Object.assign(navigator, {
            share: vi.fn().mockResolvedValue(undefined),
        });
        const { getByText, findByText } = render(ShareButton);
        await fireEvent.click(getByText("Share"));
        expect(await findByText("Share opened.")).toBeInTheDocument();
        expect(navigator.share).toHaveBeenCalled();
    });

    it("shows cancelled status when native share is aborted", async () => {
        Object.assign(navigator, {
            share: vi
                .fn()
                .mockRejectedValue(new DOMException("cancelled", "AbortError")),
        });
        const { getByText, findByText } = render(ShareButton);
        await fireEvent.click(getByText("Share"));
        expect(await findByText("Share cancelled.")).toBeInTheDocument();
    });
});
