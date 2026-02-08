export function readDarkModeFromStorage(): boolean {
    if (typeof window === "undefined") return false;
    try {
        return localStorage.getItem("darkMode") === "true";
    } catch {
        return false;
    }
}

export function persistDarkModeToStorage(darkMode: boolean): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem("darkMode", darkMode.toString());
    } catch {
        // Ignore storage quota / private mode errors.
    }
}

export function applyDarkModeClass(darkMode: boolean): void {
    if (typeof document === "undefined") return;
    if (darkMode) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}
