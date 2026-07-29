/**
 * Play Store screenshot definitions — edit this file when the UI changes and
 * screenshots need regenerating, or when a new screen/device/profile is needed.
 *
 * Run: node scripts/store-screenshots/capture.mjs
 *      node scripts/store-screenshots/capture.mjs --only phone
 *      node scripts/store-screenshots/capture.mjs --only calendar
 *      node scripts/store-screenshots/capture.mjs --only dark
 *      node scripts/store-screenshots/capture.mjs --list
 *
 * Output: artifacts/play-store/screenshots/<device>/<theme>/<screen>.png
 * (artifacts/ is gitignored — these are upload assets, not source.)
 *
 * Bank holiday data comes from the real date.nager.at API (same as the app
 * uses live) — the runner fetches each GB year once and caches it in memory
 * so all 32 captures share one real response per year instead of hitting
 * the API repeatedly or hand-typing approximate dates.
 */

/**
 * Sample profile used for every screenshot, seeded directly into the app's
 * persisted-inputs localStorage key (see src/lib/config.ts PERSIST_KEY) so
 * the calendar is already generated on page load — no form-filling needed.
 *
 * Chosen so State Pension age (SPA) is a few months in the future *and* the
 * "apply now" window (SPA minus 4 months) is already open — the app's most
 * compelling near-SPA state, showing both the upcoming SPA countdown and the
 * claim-now banner. Dates are relative to real-world "today", so if this is
 * run much later than mid-2026 the story will have drifted — bump `dob`
 * forward by roughly the same amount (keep it inside a 66th-birthday-based
 * SPA band; see src/lib/utils/statePensionAge.ts RULES) to restore it.
 */
export const PROFILE = {
    ni: "24C",
    dob: "1960-07-06", // SPA 2026-11-06 — ~3 months out, apply window open
    startYear: 2026,
    numberOfYears: 2,
    cycleDays: 28,
    showBankHolidays: true,
    csvDateFormat: "dd/mm/yyyy",
    icsEventName: "UK Pension Payment",
    icsCategory: "Finance",
    icsColor: "#2563eb",
    selectedCountry: "none",
};

/**
 * Device profiles matching Google Play's store-listing screenshot
 * categories.
 *
 * IMPORTANT: `viewport` is the device's real logical (CSS px / DIP) size —
 * NOT the output pixel count. Real devices have much narrower logical
 * viewports than their physical pixel resolution (that's what
 * deviceScaleFactor is for): a real 10-inch tablet in landscape has a CSS
 * width around 1024px (not e.g. 1800px), matching a real iPad's classic
 * logical size, which is also — not coincidentally — exactly Tailwind's
 * `lg` breakpoint here. Output PNG size is viewport * deviceScaleFactor.
 *
 * Getting this wrong (setting viewport width = desired output pixels at
 * deviceScaleFactor 1) simulates a screen wider than any real device,
 * which made the app's max-width page containers (src/app.css) show dead
 * margin that would never appear on an actual tablet — the layout must be
 * driven by the same logical width a real device reports, then scaled up.
 *
 * Tablets carry both a landscape and portrait viewport (dimensions
 * swapped) — which one gets used is chosen per screen (see
 * SCREENS[].orientation below): home's two-column grid (max-width: 80rem)
 * fills a landscape tablet's logical width well, but the narrower prose
 * pages (privacy/claiming: 56rem, help: 64rem) suit portrait better.
 */
export const DEVICES = [
    {
        name: "phone",
        playConsoleCategory: "Phone",
        viewport: { width: 400, height: 800 }, // realistic phone logical size
        deviceScaleFactor: 2, // -> 800x1600 output, portrait (only orientation phone uses)
    },
    {
        name: "tablet7",
        playConsoleCategory: "7-inch tablet",
        viewport: { width: 960, height: 600 }, // landscape logical size (classic 7" tablet, e.g. Nexus 7)
        portraitViewport: { width: 600, height: 960 },
        deviceScaleFactor: 2, // -> 1920x1200 landscape / 1200x1920 portrait output
    },
    {
        name: "tablet10",
        playConsoleCategory: "10-inch tablet",
        viewport: { width: 1024, height: 768 }, // landscape logical size (classic iPad, = Tailwind's lg breakpoint)
        portraitViewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2, // -> 2048x1536 landscape / 1536x2048 portrait output
    },
    {
        name: "chromebook",
        playConsoleCategory: "Chromebook",
        viewport: { width: 1920, height: 1080 }, // realistic Chromebook logical size (most run ~1x)
        deviceScaleFactor: 1, // -> 1920x1080 output, landscape (only orientation Chromebooks use)
    },
];

export const THEMES = ["light", "dark"];

/**
 * Screens to capture. Each runs against the seeded PROFILE above.
 * - path: route to visit
 * - waitFor: Playwright locator to wait for before screenshotting
 * - scrollIntoView: optional locator to scroll to before capturing
 * - scrollToBottom: scroll to the very bottom of the page before capturing —
 *   used for the prose pages so the footer's "Unofficial" disclaimer is
 *   fully visible instead of being clipped at the viewport edge (the capture
 *   is a fixed-size viewport screenshot, not full-page, since Play Store
 *   needs the exact device resolution)
 * - orientation: "landscape" (default) or "portrait" — only affects devices
 *   that declare a `portraitViewport` (currently the tablets); ignored for
 *   phone/Chromebook, which only have one orientation each.
 */
export const SCREENS = [
    {
        name: "home",
        path: "/",
        waitFor: ".calendar-print-wrapper",
    },
    {
        name: "calendar",
        path: "/",
        waitFor: ".calendar-print-wrapper",
        scrollIntoView: ".calendar-print-wrapper",
    },
    {
        name: "claiming",
        path: "/claiming",
        waitFor: "text=State Pension Claim Guidance",
        orientation: "portrait",
        scrollToBottom: true,
    },
    {
        name: "help",
        path: "/help",
        waitFor: "text=Help & guidance",
        orientation: "portrait",
        scrollToBottom: true,
    },
    {
        name: "privacy",
        path: "/privacy",
        scrollToBottom: true,
        waitFor: "text=Privacy Policy",
        orientation: "portrait",
    },
];
