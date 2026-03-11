import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const printCssPath = resolve("src/styles/calendarPrint.css");
const calendarMonthPath = resolve("src/lib/components/CalendarMonth.svelte");
const pagePath = resolve("src/routes/+page.svelte");
const calendarPagerPath = resolve("src/lib/components/CalendarPager.svelte");
const footerPath = resolve("src/lib/components/AppFooter.svelte");

const printCss = readFileSync(printCssPath, "utf-8");
const calendarMonthSource = readFileSync(calendarMonthPath, "utf-8");
const pageSource = readFileSync(pagePath, "utf-8");
const calendarPagerSource = readFileSync(calendarPagerPath, "utf-8");
const footerSource = readFileSync(footerPath, "utf-8");

describe("print regression guards", () => {
    it("keeps non-calendar chrome explicitly hidden in print", () => {
        expect(printCss).toContain(".print-hide");
        expect(printCss).toContain("display: none !important;");
        expect(pageSource).toContain("print-hide");
        expect(calendarPagerSource).toContain("print-hide");
        expect(footerSource).toContain("print-hide");
    });

    it("keeps the print calendar layout adaptive to page width", () => {
        expect(printCss).toContain(".calendar-grid");
        expect(printCss).toContain("display: grid !important;");
        expect(printCss).toContain(
            "grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)) !important;"
        );
        expect(printCss).not.toContain("flex-wrap: wrap !important;");
    });

    it("keeps day numbers visible in print", () => {
        expect(calendarMonthSource).toContain("calendar-day-number");
        expect(printCss).toContain(".calendar-day-number");
        expect(printCss).toContain("display: inline-flex !important;");
        expect(printCss).not.toContain(".calendar-day .text-xs");
    });

    it("keeps highlighted print day numbers inheriting the cell colour", () => {
        expect(printCss).toContain("color: inherit !important;");
        expect(printCss).toContain(
            ".calendar-day.payment .calendar-day-number"
        );
        expect(printCss).toContain(
            ".calendar-day.early-payment .calendar-day-number"
        );
        expect(printCss).toContain(
            ".calendar-day.holiday .calendar-day-number"
        );
        expect(printCss).toContain("color: #fff !important;");
        expect(printCss).toContain("background: transparent !important;");
    });
});
