import { describe, expect, it } from "vitest";
import {
    renderMarkdown,
    renderMarkdownDocument,
    replaceMarkdownPlaceholders,
} from "../src/lib/markdown";

describe("markdown", () => {
    it("gives h2 headings ids derived from their text", () => {
        const html = renderMarkdown("## Data Privacy & Disclaimer\n\nText.\n\n### Not linked\n");

        expect(html).toContain('<h2 id="data-privacy-and-disclaimer">Data Privacy &amp; Disclaimer</h2>');
        expect(html).toContain("<h3>Not linked</h3>");
    });

    it("returns headings in order with ids that match the rendered HTML", () => {
        const { html, headings } = renderMarkdownDocument(
            "# Page title\n\n## Quick Start\n\nOne.\n\n## Official Sources\n\nTwo.\n\n## Quick Start\n\nThree."
        );

        expect(headings).toEqual([
            { id: "quick-start", title: "Quick Start" },
            { id: "official-sources", title: "Official Sources" },
            { id: "quick-start-2", title: "Quick Start" },
        ]);
        for (const { id } of headings) {
            expect(html).toContain(`id="${id}"`);
        }
    });

    it("drops a leading h1, which the page shows as its own heading", () => {
        const html = renderMarkdown("# Privacy Policy\n\nLast updated.\n\n## Contact\n");

        expect(html).not.toContain("<h1");
        expect(html).not.toContain("Privacy Policy");
        expect(html).toContain("<p>Last updated.</p>");
        expect(renderMarkdown("Intro.\n\n# Not leading\n")).toContain("<h1>Not leading</h1>");
    });

    it("returns no headings for markdown without h2s", () => {
        expect(renderMarkdownDocument("Just text.").headings).toEqual([]);
        expect(renderMarkdownDocument("").headings).toEqual([]);
    });

    it("replaces every occurrence of each placeholder", () => {
        expect(
            replaceMarkdownPlaceholders("{{A}} and {{A}}, {{B}}", { "{{A}}": "x", "{{B}}": "y" })
        ).toBe("x and x, y");
    });
});
