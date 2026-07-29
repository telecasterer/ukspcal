/**
 * Renders the Play Store feature graphic (1024x500, 24-bit PNG, no alpha)
 * from scripts/feature-graphic/feature-graphic.html.
 *
 * Usage:
 *   node scripts/feature-graphic/render.mjs
 *
 * Edit feature-graphic.html directly when the app's branding/copy changes,
 * then rerun this script to regenerate the PNG. The HTML is a standalone,
 * self-contained page (fonts inlined as data URIs, background/grid drawn on
 * a <canvas>) — no build step or dev server needed, unlike the app
 * screenshots in ../store-screenshots.
 *
 * Output: artifacts/play-store/feature-graphic-1024x500.png (gitignored).
 *
 * Requires Chrome installed at /usr/bin/google-chrome-stable (Playwright's
 * own browser download isn't available on this OS — override with the
 * CHROME_PATH env var if yours lives elsewhere).
 */

import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../");
const SRC_HTML = join(__dirname, "feature-graphic.html");
const OUT_PATH = join(ROOT, "artifacts", "play-store", "feature-graphic-1024x500.png");
const CHROME_PATH = process.env.CHROME_PATH ?? "/usr/bin/google-chrome-stable";

async function main() {
    const html = readFileSync(SRC_HTML, "utf-8");

    const browser = await chromium.launch({ executablePath: CHROME_PATH });
    const page = await browser.newPage({
        viewport: { width: 1024, height: 500 },
        deviceScaleFactor: 1,
    });

    // A bare fragment (no <html>/<body> tags) is valid input — Chromium
    // implies them the same way it would for any HTML5 document.
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300); // let the canvas-drawn grid settle

    mkdirSync(dirname(OUT_PATH), { recursive: true });
    await page.screenshot({ path: OUT_PATH, clip: { x: 0, y: 0, width: 1024, height: 500 } });

    await browser.close();
    console.log(`Saved ${OUT_PATH.replace(ROOT + "/", "")}`);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
