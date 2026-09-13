import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const PERSIST_KEY = "ukspcal.inputs.v1";

// Snapshot of date.nager.at responses, so the screenshot doesn't depend on the network.
const HOLIDAY_FIXTURES: Record<string, string> = {
    "2022/GB": readFileSync(new URL("./fixtures/nager-2022-GB.json", import.meta.url), "utf8"),
    "2022/FR": readFileSync(new URL("./fixtures/nager-2022-FR.json", import.meta.url), "utf8"),
};

test.beforeEach(async ({ page }) => {
    // Freeze "today" just after this DOB's SPA (15 Mar 2022). The calendar range grows
    // to reach today once SPA has passed, so a live clock would change the screenshot.
    await page.clock.setFixedTime(new Date("2022-03-20T12:00:00Z"));

    await page.route("https://date.nager.at/api/v3/PublicHolidays/**", async (route) => {
        const key = new URL(route.request().url()).pathname.split("/").slice(-2).join("/");
        await route.fulfill({
            contentType: "application/json",
            body: HOLIDAY_FIXTURES[key] ?? "[]",
        });
    });

    await page.addInitScript(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [
        PERSIST_KEY,
        {
            ni: "29B",
            dob: "1956-03-15",
            startYear: 2026,
            numberOfYears: 1,
            cycleDays: 28,
            showBankHolidays: true,
            csvDateFormat: "dd/mm/yyyy",
            icsEventName: "UK State Pension Payment",
            icsCategory: "Finance",
            icsColor: "#22c55e",
            selectedCountry: "FR",
        },
    ]);
});

test("print view hides app chrome and preserves calendar styling", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Payment calendar" })).toBeVisible();

    await page.evaluate(() => {
        window.print = () => undefined;
    });
    await page.getByRole("button", { name: "Print calendar" }).click();

    await page.emulateMedia({ media: "print" });

    await expect(page.locator(".print-only")).toBeVisible();
    await expect(page.locator("h1")).toBeHidden();
    await expect(page.locator("footer")).toBeHidden();
    await expect(page.getByRole("button", { name: "Next" }).first()).toBeHidden();

    const calendar = page.locator(".calendar-print-wrapper");
    await expect(calendar).toBeVisible();
    await expect(calendar.locator('img[alt="France flag"]').first()).toBeVisible();
    await expect(calendar).toHaveScreenshot("print-calendar.png", {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
    });
});
