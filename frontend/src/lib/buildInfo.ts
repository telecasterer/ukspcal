export type BuildInfo = {
    version: string;
    commit: string;
    commitCount: number;
    commitDate: string;
    buildTime: string;
    dirty: boolean;
};

export const buildInfo = __BUILD_INFO__ as BuildInfo;
