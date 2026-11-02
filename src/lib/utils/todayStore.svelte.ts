import { computeTodayIso } from "./isoDateHelpers";

const REFRESH_INTERVAL_MS = 60_000;

let todayIso = $state(computeTodayIso());

if (typeof window !== "undefined") {
    const refresh = () => {
        todayIso = computeTodayIso();
    };
    setInterval(refresh, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") refresh();
    });
    window.addEventListener("focus", refresh);
}

/**
 * Shared reactive "today" (ISO calendar date, device local time). Refreshes periodically and on
 * visibility/focus so long-lived tabs never show a stale date.
 */
export const todayStore = {
    get iso(): string {
        return todayIso;
    },
};
