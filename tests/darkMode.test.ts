// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
    applyDarkModeClass,
    persistDarkModeToStorage,
    readDarkModeFromStorage,
} from "../src/lib/utils/darkMode";

describe("darkMode", () => {
    it("reads dark mode from storage", () => {
        localStorage.setItem("darkMode", "true");
        expect(readDarkModeFromStorage()).toBe(true);
        localStorage.setItem("darkMode", "false");
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
