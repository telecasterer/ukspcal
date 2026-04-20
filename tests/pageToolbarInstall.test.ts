// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import Page from "../src/routes/+page.svelte";
import { goto } from "$app/navigation";

vi.mock("$app/navigation", () => ({
    goto: vi.fn(),
}));

vi.mock("../src/lib/services/nagerHolidayService", () => ({
    fetchHolidaysForCountryAndYears: vi.fn(async () => ({})),
}));

vi.mock("../src/lib/utils/inAppBrowser", async (importOriginal) => {
    const actual = await importOriginal<
        typeof import("../src/lib/utils/inAppBrowser")
    >();
    return {
        ...actual,
        detectFacebookInAppBrowserFromWindow: vi.fn(() => false),
    };
});

function setUserAgent(userAgent: string) {
    Object.defineProperty(window.navigator, "userAgent", {
        value: userAgent,
        configurable: true,
    });
}

describe("+page toolbar and install", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        document.documentElement.className = "";
    });

    it("navigates to help when Help is clicked", async () => {
        setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");
        const { getByRole } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        await fireEvent.click(getByRole("button", { name: "Help" }));

        expect(vi.mocked(goto)).toHaveBeenCalledWith("/help");
    });

    it("toggles dark mode from toolbar", async () => {
        localStorage.setItem("darkMode", "false");
        setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");
        const { container, getByRole } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        expect(container.querySelector('svg[aria-label="Dark mode"]')).toBeTruthy();
        expect(document.documentElement.classList.contains("dark")).toBe(false);

        const user = userEvent.setup();
        await user.click(getByRole("button", { name: "Toggle dark mode" }));

        await waitFor(() => {
            expect(container.querySelector('svg[aria-label="Light mode"]')).toBeTruthy();
            expect(document.documentElement.classList.contains("dark")).toBe(true);
        });
    });

    it("shows iOS install help modal and closes it", async () => {
        setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
        const { getByRole, queryByText } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        const user = userEvent.setup();
        await user.click(getByRole("button", { name: "Install app" }));

        await waitFor(() => {
            expect(
                queryByText(/In Safari, tap the Share button, then choose/i)
            ).toBeInTheDocument();
        });
        const closeButton = Array.from(document.querySelectorAll("button")).find(
            (button) => /Close/i.test(button.textContent ?? "")
        );
        expect(closeButton).toBeTruthy();
        await user.click(closeButton!);

        await waitFor(() => {
            const helpText = queryByText(/In Safari, tap the Share button, then choose/i);
            if (helpText) {
                expect(helpText).not.toBeVisible();
            }
        });
    });

    it("shows a Google Play CTA on Android", () => {
        setUserAgent("Mozilla/5.0 (Linux; Android 14)");
        const { getByRole } = render(Page, {
            props: { bankHolidays: {} as Record<string, string> },
        });

        expect(
            getByRole("button", { name: "Get the Android app on Google Play" })
        ).toBeInTheDocument();
    });
});
