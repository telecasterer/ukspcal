// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { copyLinkToClipboard, copyTextToClipboard } from "../src/lib/utils/clipboard";

describe("clipboard", () => {
    it("uses navigator.clipboard when available", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });

        const ok = await copyTextToClipboard("hello");
        expect(ok).toBe(true);
        expect(writeText).toHaveBeenCalledWith("hello");
    });

    it("falls back to execCommand copy", async () => {
        Object.assign(navigator, { clipboard: undefined });
        if (typeof document.execCommand !== "function") {
            (document as any).execCommand = () => true;
        }
        const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);

        const ok = await copyTextToClipboard("fallback");
        expect(ok).toBe(true);
        expect(execSpy).toHaveBeenCalledWith("copy");
    });

    it("copies the current link when no URL provided", async () => {
        if (typeof document.execCommand !== "function") {
            (document as any).execCommand = () => true;
        }
        const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);
        const ok = await copyLinkToClipboard();
        expect(ok).toBe(true);
        expect(execSpy).toHaveBeenCalledWith("copy");
    });
});
