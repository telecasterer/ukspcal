// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import FloatingFeedbackButton from "../src/lib/components/FloatingFeedbackButton.svelte";

describe("FloatingFeedbackButton", () => {
    it("renders a button", () => {
        const { container } = render(FloatingFeedbackButton);
        const button = container.querySelector("a");
        expect(button).toBeInTheDocument();
    });

    it("has the correct href to the feedback form", () => {
        const { container } = render(FloatingFeedbackButton);
        const link = container.querySelector("a");
        expect(link).toHaveAttribute("href", "https://tally.so/r/q4Vbq2");
    });

    it("opens in a new tab", () => {
        const { container } = render(FloatingFeedbackButton);
        const link = container.querySelector("a");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("has aria-label for accessibility", () => {
        const { container } = render(FloatingFeedbackButton);
        const link = container.querySelector("a");
        expect(link).toHaveAttribute("aria-label", "Send feedback");
    });

    it("has fixed positioning classes", () => {
        const { container } = render(FloatingFeedbackButton);
        const link = container.querySelector("a");
        const classes = link?.getAttribute("class") || "";
        expect(classes).toContain("fixed");
        expect(classes).toContain("bottom-6");
        expect(classes).toContain("right-6");
    });

    it("has blue styling", () => {
        const { container } = render(FloatingFeedbackButton);
        const link = container.querySelector("a");
        const classes = link?.getAttribute("class") || "";
        expect(classes).toContain("bg-blue-600");
        expect(classes).toContain("text-white");
    });

    it("contains an SVG icon", () => {
        const { container } = render(FloatingFeedbackButton);
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });

    it("has z-index for visibility", () => {
        const { container } = render(FloatingFeedbackButton);
        const link = container.querySelector("a");
        const classes = link?.getAttribute("class") || "";
        expect(classes).toContain("z-40");
    });
});
