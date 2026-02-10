import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("SEO - Meta Tags and Schema", () => {
    const layoutPath = join(process.cwd(), "src/routes/+layout.svelte");
    const mainPagePath = join(process.cwd(), "src/routes/+page.svelte");
    const helpPagePath = join(process.cwd(), "src/routes/help/+page.svelte");

    const layoutContent = readFileSync(layoutPath, "utf-8");
    const mainPageContent = readFileSync(mainPagePath, "utf-8");
    const helpPageContent = readFileSync(helpPagePath, "utf-8");

    it("should have base meta description tag", () => {
        expect(layoutContent).toContain('name="description"');
        expect(layoutContent).toContain("UK State Pension");
    });

    it("should have theme color meta tag", () => {
        expect(layoutContent).toContain('name="theme-color"');
        expect(layoutContent).toContain("#2563eb");
    });

    it("should have Open Graph tags in layout", () => {
        expect(layoutContent).toContain('property="og:type"');
        expect(layoutContent).toContain('property="og:locale"');
        expect(layoutContent).toContain("en_GB");
    });

    it("should have WebApplication schema.org JSON-LD", () => {
        expect(layoutContent).toContain('@type": "WebApplication"');
        expect(layoutContent).toContain("Calculator");
        expect(layoutContent).toContain("FinanceApplication");
    });

    it("should have canonical link in layout", () => {
        expect(layoutContent).toContain('rel="canonical"');
        expect(layoutContent).toContain("https://ukspcal.vercel.app");
    });

    it("should have canonical link on help page", () => {
        expect(helpPageContent).toContain("https://ukspcal.vercel.app/help");
    });

    it("should have page-specific title on main page", () => {
        expect(mainPageContent).toContain("<title>UK State Pension Calculator");
    });

    it("should have page-specific title on help page", () => {
        expect(helpPageContent).toContain(
            "<title>Help - UK State Pension Calculator"
        );
    });

    it("should have Open Graph title on main page", () => {
        expect(mainPageContent).toContain('property="og:title"');
        expect(mainPageContent).toContain(
            "UK State Pension Calculator - Payment Dates & Schedule"
        );
    });

    it("should have Open Graph description on main page", () => {
        expect(mainPageContent).toContain('property="og:description"');
    });

    it("should have Open Graph description on help page", () => {
        expect(helpPageContent).toContain('property="og:description"');
        expect(helpPageContent).toContain("Learn how to use");
    });

    it("should have proper H1 on main page", () => {
        expect(mainPageContent).toMatch(
            /<h1[^>]*class="[^"]*text-4xl[^"]*font-bold[^"]*"/s
        );
        expect(mainPageContent).toContain("UK State Pension Payment Calendar");
    });

    it("should have keywords meta tag", () => {
        expect(layoutContent).toContain('name="keywords"');
        expect(layoutContent).toContain("State Pension");
    });
});
