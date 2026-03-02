import MarkdownIt from "markdown-it";

export type MarkdownSubSection = { title: string; html: string };
export type MarkdownSection = {
    title: string;
    html?: string;
    subSections?: MarkdownSubSection[];
};

const md = new MarkdownIt({ html: true, linkify: true });

export function replaceMarkdownPlaceholders(
    markdown: string,
    placeholderMap: Record<string, string>
): string {
    return Object.entries(placeholderMap).reduce(
        (acc, [key, value]) => acc.replaceAll(key, value),
        markdown
    );
}

export function renderMarkdown(markdown: string): string {
    return md.render(markdown);
}

export function parseMarkdownSections(markdown: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];
    const allTokens = md.parse(markdown, {});

    let currentSection: MarkdownSection | null = null;
    let currentSubSection: MarkdownSubSection | null = null;
    let bodyTokens: typeof allTokens = [];
    let subBodyTokens: typeof allTokens = [];

    function pushSubSection(): void {
        if (currentSubSection && currentSection) {
            currentSubSection.html = md.renderer.render(subBodyTokens, md.options, {});
            if (!currentSection.subSections) currentSection.subSections = [];
            currentSection.subSections.push(currentSubSection);
            currentSubSection = null;
            subBodyTokens = [];
        }
    }

    function pushSection(): void {
        if (!currentSection) return;
        if (currentSection.subSections && bodyTokens.length > 0) {
            currentSection.html = md.renderer.render(bodyTokens, md.options, {});
        } else if (!currentSection.subSections) {
            currentSection.html = md.renderer.render(bodyTokens, md.options, {});
        }
        sections.push(currentSection);
        currentSection = null;
        currentSubSection = null;
        bodyTokens = [];
        subBodyTokens = [];
    }

    for (let i = 0; i < allTokens.length; i++) {
        const token = allTokens[i];
        if (token.type === "heading_open" && token.tag === "h2") {
            pushSubSection();
            pushSection();
            const inline = allTokens[i + 1];
            currentSection = {
                title: inline && inline.type === "inline" ? inline.content.trim() : "Section",
            };
            while (i < allTokens.length && allTokens[i].type !== "heading_close") i++;
            continue;
        }

        if (token.type === "heading_open" && token.tag === "h3") {
            pushSubSection();
            const inline = allTokens[i + 1];
            currentSubSection = {
                title: inline && inline.type === "inline" ? inline.content.trim() : "Subsection",
                html: "",
            };
            while (i < allTokens.length && allTokens[i].type !== "heading_close") i++;
            continue;
        }

        if (currentSubSection) {
            subBodyTokens.push(token);
        } else if (currentSection) {
            bodyTokens.push(token);
        }
    }

    pushSubSection();
    pushSection();

    return sections;
}
