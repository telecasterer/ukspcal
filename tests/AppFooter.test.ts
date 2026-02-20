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

    it("does not render official sources section in footer", () => {
        const { queryByText } = render(AppFooter);
        expect(queryByText("Official sources")).toBeNull();
    });

    it("does not include official source links in footer", () => {
        const { container } = render(AppFooter);
        expect(
            container.querySelector('a[href="https://www.gov.uk/state-pension-age"]')
        ).toBeNull();
        expect(
            container.querySelector(
                'a[href="https://www.gov.uk/government/publications/state-pension-age-timetable/state-pension-age-timetable"]'
            )
        ).toBeNull();
        expect(
            container.querySelector('a[href="https://www.gov.uk/bank-holidays"]')
        ).toBeNull();
        expect(
            container.querySelector('a[href="https://date.nager.at"]')
        ).toBeNull();
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
