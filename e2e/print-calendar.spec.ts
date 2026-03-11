import { expect, test } from "@playwright/test";

const PERSIST_KEY = "ukspcal.inputs.v1";

test.beforeEach(async ({ page }) => {
    await page.route("https://date.nager.at/api/v3/PublicHolidays/2026/FR", async (route) => {
        await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify([
                {
                    date: "2026-07-14",
                    localName: "Fete nationale francaise",
                    name: "Bastille Day",
                    countryCode: "FR",
                    fixed: true,
                    global: true,
                    counties: null,
                    launchYear: null,
                    type: "Public",
                },
            ]),
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
