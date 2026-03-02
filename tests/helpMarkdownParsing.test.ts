import { describe, it, expect } from "vitest";
import { parseMarkdownSections } from "../src/lib/markdown";

describe("helpMarkdown parsing", () => {
    it("parses H2 and H3 sections correctly", () => {
        const md = `\n## Section 1\nSome intro text.\n### Subsection 1.1\nDetails for 1.1\n### Subsection 1.2\nDetails for 1.2\n## Section 2\nSection 2 text.`;
        const sections = parseMarkdownSections(md);
        expect(sections.length).toBe(2);
        expect(sections[0].title).toBe("Section 1");
        expect(sections[0].subSections?.length).toBe(2);
        expect(sections[0].subSections?.[0].title).toBe("Subsection 1.1");
        expect(sections[1].title).toBe("Section 2");
        expect(sections[1].html).toContain("Section 2 text");
    });

    it("handles sections with no subsections", () => {
        const md = `\n## Section Only\nJust text.`;
        const sections = parseMarkdownSections(md);
        expect(sections.length).toBe(1);
        expect(sections[0].title).toBe("Section Only");
        expect(sections[0].html).toContain("Just text");
        expect(sections[0].subSections).toBeUndefined();
    });

    it("handles empty markdown", () => {
        const sections = parseMarkdownSections("");
        expect(sections.length).toBe(0);
    });
});
