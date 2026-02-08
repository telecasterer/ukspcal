// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";

vi.mock("../src/lib/utils/clipboard", () => ({
    copyLinkToClipboard: vi.fn().mockResolvedValue(true)
}));

import ShareButton from "../src/lib/components/ShareButton.svelte";

describe("ShareButton", () => {
    it("falls back to copy and shows status", async () => {
        Object.assign(navigator, { share: undefined });
        const { getByText, findByText } = render(ShareButton);
        await fireEvent.click(getByText("Share"));
        expect(await findByText("Link copied.")).toBeInTheDocument();
    });
});
