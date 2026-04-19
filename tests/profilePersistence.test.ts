// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi } from "vitest";
import {
    generateId,
    loadSavedProfiles,
    saveProfiles,
    type SavedProfile,
} from "../src/lib/utils/profilePersistence";

const PROFILES_KEY = "ukspcal.profiles.v1";

function makeProfile(overrides: Partial<SavedProfile> = {}): SavedProfile {
    return {
        id: overrides.id ?? crypto.randomUUID(),
        name: overrides.name ?? "Test",
        ni: overrides.ni ?? "22D",
        dob: overrides.dob ?? "1960-01-01",
    };
}

describe("profilePersistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    // --- loadSavedProfiles ---

    it("returns empty array when nothing is stored", () => {
        expect(loadSavedProfiles()).toEqual([]);
    });

    it("returns saved profiles from localStorage", () => {
        const profiles = [makeProfile({ name: "Me" }), makeProfile({ name: "Partner" })];
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

        const loaded = loadSavedProfiles();
        expect(loaded).toHaveLength(2);
        expect(loaded[0].name).toBe("Me");
        expect(loaded[1].name).toBe("Partner");
    });

    it("filters out malformed entries", () => {
        const data = [
            makeProfile({ name: "Valid" }),
            { id: "x", name: "Missing ni and dob" },
            42,
            null,
            "garbage",
        ];
        localStorage.setItem(PROFILES_KEY, JSON.stringify(data));

        const loaded = loadSavedProfiles();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].name).toBe("Valid");
    });

    it("returns empty array for non-array JSON", () => {
        localStorage.setItem(PROFILES_KEY, JSON.stringify({ not: "an array" }));
        expect(loadSavedProfiles()).toEqual([]);
    });

    it("returns empty array for invalid JSON", () => {
        localStorage.setItem(PROFILES_KEY, "not json at all {{{");
        expect(loadSavedProfiles()).toEqual([]);
    });

    // --- saveProfiles ---

    it("persists profiles to localStorage", () => {
        const profiles = [makeProfile({ name: "Saved" })];
        saveProfiles(profiles);

        const raw = localStorage.getItem(PROFILES_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].name).toBe("Saved");
    });

    it("overwrites previous profiles", () => {
        saveProfiles([makeProfile({ name: "First" })]);
        saveProfiles([makeProfile({ name: "Second" })]);

        const loaded = loadSavedProfiles();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].name).toBe("Second");
    });

    it("can save an empty array to clear all profiles", () => {
        saveProfiles([makeProfile()]);
        saveProfiles([]);

        expect(loadSavedProfiles()).toEqual([]);
    });

    // --- round-trip ---

    it("round-trips profiles through save and load", () => {
        const profiles = [
            makeProfile({ name: "Me", ni: "12A", dob: "1958-06-15" }),
            makeProfile({ name: "Partner", ni: "34B", dob: "1960-11-23" }),
        ];
        saveProfiles(profiles);

        const loaded = loadSavedProfiles();
        expect(loaded).toEqual(profiles);
    });

    // --- generateId ---

    describe("generateId", () => {
        it("returns a non-empty string", () => {
            expect(typeof generateId()).toBe("string");
            expect(generateId().length).toBeGreaterThan(0);
        });

        it("returns unique values on successive calls", () => {
            const ids = new Set(Array.from({ length: 20 }, generateId));
            expect(ids.size).toBe(20);
        });

        it("falls back gracefully when crypto.randomUUID is unavailable", () => {
            const original = (crypto as any).randomUUID;
            (crypto as any).randomUUID = undefined;

            const id = generateId();
            expect(typeof id).toBe("string");
            expect(id.length).toBeGreaterThan(0);

            (crypto as any).randomUUID = original;
        });
    });

    // --- delete workflow ---

    it("supports deleting a profile by filtering and re-saving", () => {
        const p1 = makeProfile({ name: "Keep" });
        const p2 = makeProfile({ name: "Delete" });
        saveProfiles([p1, p2]);

        const after = loadSavedProfiles().filter((p) => p.id !== p2.id);
        saveProfiles(after);

        const loaded = loadSavedProfiles();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].name).toBe("Keep");
    });
});
