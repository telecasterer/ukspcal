export type SavedProfile = {
    id: string;
    name: string;
    ni: string;
    dob: string;
};

const PROFILES_KEY = "ukspcal.profiles.v1";

export function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts (e.g. local network dev over HTTP)
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function loadSavedProfiles(): SavedProfile[] {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return [];
    }
    try {
        const raw = localStorage.getItem(PROFILES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (p) =>
                typeof p === "object" &&
                p !== null &&
                typeof p.id === "string" &&
                typeof p.name === "string" &&
                typeof p.ni === "string" &&
                typeof p.dob === "string"
        ) as SavedProfile[];
    } catch {
        return [];
    }
}

export function saveProfiles(profiles: SavedProfile[]): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return;
    }
    try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error("Failed to save profiles", e);
    }
}
