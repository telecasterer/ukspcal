import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    reporter: "list",
    use: {
        baseURL,
        trace: "retain-on-failure",
    },
    webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
        ? undefined
        : {
              command:
                  "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
              port: 4173,
              reuseExistingServer: false,
              timeout: 120_000,
          },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1280, height: 1800 },
            },
        },
    ],
});
