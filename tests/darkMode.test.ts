// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    applyDarkModeClass,
    persistDarkModeToStorage,
    readDarkModeFromStorage,
} from "../src/lib/utils/darkMode";

describe("darkMode", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("reads dark mode from storage", () => {
        localStorage.setItem("darkMode", "true");
        expect(readDarkModeFromStorage()).toBe(true);
        localStorage.setItem("darkMode", "false");
        expect(readDarkModeFromStorage()).toBe(false);
    });

    it("falls back to system dark preference when storage is unset", () => {
        const matchMedia = vi.fn().mockReturnValue({ matches: true });
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: matchMedia,
        });

        expect(readDarkModeFromStorage()).toBe(true);
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("falls back to light when system dark preference is off", () => {
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn().mockReturnValue({ matches: false }),
        });

        expect(readDarkModeFromStorage()).toBe(false);
    });

    it("persists dark mode to storage", () => {
        persistDarkModeToStorage(true);
        expect(localStorage.getItem("darkMode")).toBe("true");
    });

    it("applies and removes dark mode class", () => {
        applyDarkModeClass(true);
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        applyDarkModeClass(false);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
});
