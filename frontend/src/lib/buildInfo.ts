export type BuildInfo = {
    version: string;
    commit: string;
    commitCount: number;
    commitDate: string;
    buildTime: string;
    dirty: boolean;
};

const fallback: BuildInfo = {
    version: "unknown",
    commit: "unknown",
    commitCount: 0,
    commitDate: "unknown",
    buildTime: new Date().toISOString(),
    dirty: false
};

// __BUILD_INFO__ is injected by Vite define() in vite.config.ts.
// If a different config is used (or Vite isn't running), fall back to a safe placeholder.
export const buildInfo = (typeof __BUILD_INFO__ === "undefined" ? fallback : (__BUILD_INFO__ as BuildInfo));
