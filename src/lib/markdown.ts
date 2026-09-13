import MarkdownIt from "markdown-it";

export type MarkdownHeading = { id: string; title: string };

/**
 * Put this comment on its own line in a document page's markdown to mark where
 * DocPage renders its `insert` snippet.
 */
export const DOC_INSERT_MARKER = "<!-- doc-insert -->";

const md = new MarkdownIt({ html: true, linkify: true });

type Token = ReturnType<typeof md.parse>[number];

export function replaceMarkdownPlaceholders(
    markdown: string,
    placeholderMap: Record<string, string>
): string {
    return Object.entries(placeholderMap).reduce(
        (acc, [key, value]) => acc.replaceAll(key, value),
        markdown
    );
}

function slugify(text: string): string {
    return (
        text
            .toLowerCase()
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "section"
    );
}

/**
 * Give each h2 a unique id derived from its text, so a page can link to its
 * sections. Returns the headings in document order.
 */
function assignHeadingIds(tokens: Token[]): MarkdownHeading[] {
    const headings: MarkdownHeading[] = [];
    const used = new Set<string>();
    tokens.forEach((token, i) => {
        if (token.type !== "heading_open" || token.tag !== "h2") return;
        const inline = tokens[i + 1];
        const title = inline?.type === "inline" ? inline.content.trim() : "";
        const base = slugify(title);
        let id = base;
        for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
        used.add(id);
        token.attrSet("id", id);
        headings.push({ id, title });
    });
    return headings;
}

/** Drop a leading h1: document pages show their own heading (see DocPage). */
function dropLeadingTitle(tokens: Token[]): Token[] {
    if (tokens[0]?.type !== "heading_open" || tokens[0].tag !== "h1") return tokens;
    const close = tokens.findIndex((t) => t.type === "heading_close" && t.tag === "h1");
    return tokens.slice(close + 1);
}

/**
 * Render markdown for a document page, returning the HTML (without any leading h1)
 * and its h2 headings with matching ids.
 */
export function renderMarkdownDocument(markdown: string): {
    html: string;
    headings: MarkdownHeading[];
} {
    const tokens = dropLeadingTitle(md.parse(markdown, {}));
    const headings = assignHeadingIds(tokens);
    return { html: md.renderer.render(tokens, md.options, {}), headings };
}

export function renderMarkdown(markdown: string): string {
    return renderMarkdownDocument(markdown).html;
}
