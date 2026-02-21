// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("posthog utils", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("does not initialize when API key is empty", async () => {
        const initMock = vi.fn();
        vi.doMock("posthog-js", () => ({ default: { init: initMock, capture: vi.fn() } }));
        vi.doMock("$env/static/public", () => ({
            PUBLIC_POSTHOG_KEY: "",
            PUBLIC_POSTHOG_HOST: "",
        }));

        const mod = await import("../src/lib/utils/posthog");
        mod.initPosthog();
        mod.capturePosthog("evt");

        expect(initMock).not.toHaveBeenCalled();
    });
});
