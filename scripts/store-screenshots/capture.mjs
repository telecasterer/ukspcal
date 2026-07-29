/**
 * Captures Play Store screenshots for every device × theme × screen
 * combination declared in ./definitions.mjs.
 *
 * Usage:
 *   node scripts/store-screenshots/capture.mjs
 *   node scripts/store-screenshots/capture.mjs --only phone       # device name
 *   node scripts/store-screenshots/capture.mjs --only dark        # theme
 *   node scripts/store-screenshots/capture.mjs --only calendar    # screen name
 *   node scripts/store-screenshots/capture.mjs --list             # print all targets, do nothing
 *
 * --only matches against device name, theme, or screen name (OR'd together
 * if you need more than one: --only phone,dark).
 *
 * The script:
 *   1. Starts a local SvelteKit dev server on a scratch port
 *   2. Opens each device/theme/screen combo in headless Chrome
 *   3. Seeds localStorage with the sample profile + dark-mode preference
 *      (see PROFILE in definitions.mjs) so the calendar is pre-generated
 *   4. Forces `(display-mode: standalone)` to match so the app renders as
 *      it would once actually installed (no "Install"/"Get Android app"
 *      CTA — a real installed app never shows its own install prompt)
 *   5. Routes the date.nager.at bank-holiday API through an in-memory cache —
 *      real data, fetched once per year and reused across all captures
 *      instead of hammering the API or hand-typing approximate dates
 *   6. Waits for the screen's ready-locator, optionally scrolls to a target
 *   7. Screenshots the viewport (page content only — no browser chrome is
 *      ever included since this uses page.screenshot(), not a window/OS
 *      capture) to artifacts/play-store/screenshots/...
 *   8. Stops the dev server
 *
 * Requires Chrome installed at /usr/bin/google-chrome-stable (Playwright's
 * own browser download isn't available on this OS — see CHROME_PATH below
 * to override).
 */

import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { PROFILE, DEVICES, THEMES, SCREENS } from "./definitions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../");
const OUT_DIR = join(ROOT, "artifacts", "play-store", "screenshots");
const PERSIST_KEY = "ukspcal.inputs.v1";
const PORT = 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = process.env.CHROME_PATH ?? "/usr/bin/google-chrome-stable";

function parseArgs() {
    const args = process.argv.slice(2);
    const listOnly = args.includes("--list");
    const onlyIdx = args.indexOf("--only");
    const only =
        onlyIdx !== -1 && args[onlyIdx + 1]
            ? args[onlyIdx + 1].split(",").map((s) => s.trim().toLowerCase())
            : null;
    return { listOnly, only };
}

function buildTargets(only) {
    const targets = [];
    for (const device of DEVICES) {
        for (const theme of THEMES) {
            for (const screen of SCREENS) {
                if (
                    only &&
                    !only.includes(device.name.toLowerCase()) &&
                    !only.includes(theme.toLowerCase()) &&
                    !only.includes(screen.name.toLowerCase())
                ) {
                    continue;
                }
                targets.push({ device, theme, screen });
            }
        }
    }
    return targets;
}

async function waitForServer(url, timeoutMs = 60_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url);
            if (res.ok || res.status === 404) return;
        } catch {
            // not up yet
        }
        await delay(300);
    }
    throw new Error(`Dev server did not respond at ${url} within ${timeoutMs}ms`);
}

function startDevServer() {
    const proc = spawn(
        "npm",
        ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
        { cwd: ROOT, stdio: "pipe" }
    );
    proc.stderr.on("data", (d) => process.stderr.write(`[dev] ${d}`));
    return proc;
}

// Real date.nager.at responses, cached in memory per URL so the 32 captures
// share one live fetch per year instead of hammering the API or relying on
// hand-typed (and error-prone) approximations of the real holiday dates.
const holidayCache = new Map();

async function cachedHolidayFetch(url) {
    if (!holidayCache.has(url)) {
        const res = await fetch(url);
        holidayCache.set(url, {
            status: res.status,
            body: await res.text(),
            contentType: res.headers.get("content-type") ?? "application/json",
        });
    }
    return holidayCache.get(url);
}

function viewportFor(device, screen) {
    const wantsPortrait = screen.orientation === "portrait";
    if (wantsPortrait && device.portraitViewport) return device.portraitViewport;
    return device.viewport;
}

async function captureOne(browser, { device, theme, screen }) {
    const context = await browser.newContext({
        viewport: viewportFor(device, screen),
        deviceScaleFactor: device.deviceScaleFactor,
        colorScheme: theme,
    });

    await context.addInitScript(
        ([key, profile, dark]) => {
            window.localStorage.setItem(key, JSON.stringify(profile));
            window.localStorage.setItem("darkMode", String(dark));
        },
        [PERSIST_KEY, PROFILE, theme === "dark"]
    );

    // Make `window.matchMedia('(display-mode: standalone)')` report a match,
    // so the app's own standalone-detection (src/lib/utils/pwaInstall.ts)
    // renders exactly as it would once installed — critically, suppressing
    // the "Install"/"Get Android app" CTA, which a real installed app never
    // shows itself. Everything else (dark mode, viewport width queries) is
    // untouched — only the display-mode query is intercepted.
    await context.addInitScript(() => {
        const realMatchMedia = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
            if (typeof query === "string" && query.includes("display-mode")) {
                return {
                    matches: query.includes("standalone"),
                    media: query,
                    onchange: null,
                    addListener() {},
                    removeListener() {},
                    addEventListener() {},
                    removeEventListener() {},
                    dispatchEvent() {
                        return false;
                    },
                };
            }
            return realMatchMedia(query);
        };
    });

    await context.route("https://date.nager.at/api/v3/PublicHolidays/**/GB", async (route) => {
        const cached = await cachedHolidayFetch(route.request().url());
        await route.fulfill({
            status: cached.status,
            contentType: cached.contentType,
            body: cached.body,
        });
    });

    const page = await context.newPage();
    await page.goto(BASE_URL + screen.path);
    await page.locator(screen.waitFor).first().waitFor({ state: "visible", timeout: 20_000 });

    if (screen.scrollIntoView) {
        await page.locator(screen.scrollIntoView).first().scrollIntoViewIfNeeded();
    }
    if (screen.scrollToBottom) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    }
    await page.waitForTimeout(250); // let scroll/paint settle

    const outPath = join(OUT_DIR, device.name, theme, `${screen.name}.png`);
    mkdirSync(dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath });

    await context.close();
    return outPath;
}

async function main() {
    const { listOnly, only } = parseArgs();
    const targets = buildTargets(only);

    if (listOnly) {
        console.log(`${targets.length} capture target(s):\n`);
        for (const { device, theme, screen } of targets) {
            console.log(`  ${device.name}/${theme}/${screen.name}`);
        }
        return;
    }

    if (targets.length === 0) {
        console.error(`No targets matched --only. Use --list to see device/theme/screen names.`);
        process.exitCode = 1;
        return;
    }

    console.log(`\n▸ Starting dev server on ${BASE_URL}…`);
    const devServer = startDevServer();

    let browser;
    try {
        await waitForServer(BASE_URL);
        console.log(`▸ Capturing ${targets.length} screenshot(s)…\n`);

        browser = await chromium.launch({ executablePath: CHROME_PATH });
        for (const target of targets) {
            const outPath = await captureOne(browser, target);
            console.log(`  ✓ ${outPath.replace(ROOT + "/", "")}`);
        }
        console.log(`\nDone. Output in ${OUT_DIR.replace(ROOT + "/", "")}\n`);
    } finally {
        await browser?.close();
        devServer.kill("SIGTERM");
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
