// --- Type for build metadata ---
export type BuildInfo = {
    version: string;
    commit: string;
    commitCount: number;
    commitDate: string;
    buildTime: string;
    dirty: boolean;
};

// Fallback build info for dev/local/test
const fallback: BuildInfo = {
    version: "unknown",
    commit: "unknown",
    commitCount: 0,
    commitDate: "unknown",
    buildTime: new Date().toISOString(),
    dirty: false,
};

// __BUILD_INFO__ is injected by Vite define() in vite.config.ts.
export const buildInfo: BuildInfo =
    typeof __BUILD_INFO__ === "undefined"
        ? fallback
        : (__BUILD_INFO__ as BuildInfo);

// --- Dev-friendly formatting helpers ---

const DEV_FMT: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
};

/**
 * Format an ISO date string for display (dev/debug)
 */
function formatDate(iso: string, timeZone?: string): string {
    if (!iso || iso === "unknown") return "unknown";
    return new Intl.DateTimeFormat("en-GB", {
        ...DEV_FMT,
        ...(timeZone ? { timeZone } : {}),
    }).format(new Date(iso));
}

// Pre-formatted build info for UI/debug
export const buildInfoFormatted = {
    release: /^\d+\.\d+\.\d+$/.test(buildInfo.version)
        ? `v${buildInfo.version}`
        : buildInfo.version,
    commitShort:
        buildInfo.commit && buildInfo.commit !== "unknown"
            ? buildInfo.commit.slice(0, 7)
            : "unknown",
    commitDate: formatDate(buildInfo.commitDate, "UTC"),
    buildTime: formatDate(buildInfo.buildTime, "UTC"),
    summary: (() => {
        const release = /^\d+\.\d+\.\d+$/.test(buildInfo.version)
            ? `v${buildInfo.version}`
            : buildInfo.version;
        const commitShort =
            buildInfo.commit && buildInfo.commit !== "unknown"
                ? buildInfo.commit.slice(0, 7)
                : "unknown";
        const commitDate = formatDate(buildInfo.commitDate, "UTC");
        return `${release} (${commitShort}, ${commitDate})`;
    })(),
};
