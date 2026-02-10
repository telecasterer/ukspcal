// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import AppFooter from "../src/lib/components/AppFooter.svelte";

describe("AppFooter", () => {
    it("renders the footer", () => {
        const { container } = render(AppFooter);
        const footer = container.querySelector("footer");
        expect(footer).toBeInTheDocument();
    });

    it("displays sources attribution text", () => {
        const { getByText } = render(AppFooter);
        expect(
            getByText(/Sources: GOV.UK State Pension age guidance/i)
        ).toBeInTheDocument();
    });

    it("includes bank holiday information in sources", () => {
        const { getByText } = render(AppFooter);
        expect(getByText(/bank holiday lists/i)).toBeInTheDocument();
    });

    it("has a feedback link", () => {
        const { container } = render(AppFooter);
        const feedbackLink = container.querySelector(
            'a[href="https://tally.so/r/q4Vbq2"]'
        );
        expect(feedbackLink).toBeInTheDocument();
        expect(feedbackLink).toHaveTextContent("Send Feedback");
    });

    it("feedback link opens in new tab", () => {
        const { container } = render(AppFooter);
        const feedbackLink = container.querySelector(
            'a[href="https://tally.so/r/q4Vbq2"]'
        );
        expect(feedbackLink).toHaveAttribute("target", "_blank");
        expect(feedbackLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("has a GitHub link", () => {
        const { container } = render(AppFooter);
        const githubLink = container.querySelector(
            'a[href="https://github.com/telecasterer/ukspcal"]'
        );
        expect(githubLink).toBeInTheDocument();
    });

    it("GitHub link has correct text", () => {
        const { getByText } = render(AppFooter);
        expect(getByText(/View on GitHub/i)).toBeInTheDocument();
    });

    it("GitHub link opens in new tab", () => {
        const { container } = render(AppFooter);
        const githubLinks = Array.from(
            container.querySelectorAll(
                'a[href="https://github.com/telecasterer/ukspcal"]'
            )
        );
        githubLinks.forEach((link) => {
            expect(link).toHaveAttribute("target", "_blank");
            expect(link).toHaveAttribute("rel", "noopener noreferrer");
        });
    });

    it("has GitHub icon SVG", () => {
        const { container } = render(AppFooter);
        const svgs = container.querySelectorAll("svg");
        expect(svgs.length).toBeGreaterThan(0);
    });

    it("has dark mode styling classes", () => {
        const { container } = render(AppFooter);
        const footer = container.querySelector("footer");
        const classes = footer?.getAttribute("class") || "";
        expect(classes).toContain("dark:");
    });

    it("has border styling", () => {
        const { container } = render(AppFooter);
        const footer = container.querySelector("footer");
        const classes = footer?.getAttribute("class") || "";
        expect(classes).toContain("border-t");
    });
});
