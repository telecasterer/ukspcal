import MarkdownIt from 'markdown-it';
import { describe, it, expect } from 'vitest';

// Replicate the HelpSection and HelpSubSection types from +page.svelte
interface HelpSubSection {
  title: string;
  html: string;
}
interface HelpSection {
  title: string;
  html?: string;
  subSections?: HelpSubSection[];
}

// Extracted parsing logic from +page.svelte for testability
function parseHelpMarkdown(helpMarkdown: string): HelpSection[] {
  const md = new MarkdownIt({ html: true, linkify: true });
  const sections: HelpSection[] = [];
  const allTokens = md.parse(helpMarkdown, {});
  let currentSection: HelpSection | null = null;
  let currentSubSection: HelpSubSection | null = null;
  let bodyTokens: typeof allTokens = [];
  let subBodyTokens: typeof allTokens = [];

  function pushSubSection() {
    if (currentSubSection) {
      currentSubSection.html = md.renderer.render(subBodyTokens, md.options, {});
      if (!currentSection!.subSections) currentSection!.subSections = [];
      currentSection!.subSections.push(currentSubSection);
      currentSubSection = null;
      subBodyTokens = [];
    }
  }
  function pushSection() {
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
    if (token.type === 'heading_open' && token.tag === 'h2') {
      pushSubSection();
      pushSection();
      const inline = allTokens[i + 1];
      currentSection = {
        title: inline && inline.type === 'inline' ? inline.content.trim() : 'Section',
      };
      while (i < allTokens.length && allTokens[i].type !== 'heading_close') i++;
      continue;
    } else if (token.type === 'heading_open' && token.tag === 'h3') {
      pushSubSection();
      const inline = allTokens[i + 1];
      currentSubSection = {
        title: inline && inline.type === 'inline' ? inline.content.trim() : 'Subsection',
        html: '',
      };
      while (i < allTokens.length && allTokens[i].type !== 'heading_close') i++;
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

describe('helpMarkdown parsing', () => {
  it('parses H2 and H3 sections correctly', () => {
    const md = `\n## Section 1\nSome intro text.\n### Subsection 1.1\nDetails for 1.1\n### Subsection 1.2\nDetails for 1.2\n## Section 2\nSection 2 text.`;
    const sections = parseHelpMarkdown(md);
    expect(sections.length).toBe(2);
    expect(sections[0].title).toBe('Section 1');
    expect(sections[0].subSections?.length).toBe(2);
    expect(sections[0].subSections?.[0].title).toBe('Subsection 1.1');
    expect(sections[1].title).toBe('Section 2');
    expect(sections[1].html).toContain('Section 2 text');
  });

  it('handles sections with no subsections', () => {
    const md = `\n## Section Only\nJust text.`;
    const sections = parseHelpMarkdown(md);
    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe('Section Only');
    expect(sections[0].html).toContain('Just text');
    expect(sections[0].subSections).toBeUndefined();
  });

  it('handles empty markdown', () => {
    const sections = parseHelpMarkdown('');
    expect(sections.length).toBe(0);
  });
});
