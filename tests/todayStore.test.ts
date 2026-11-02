import { afterEach, describe, expect, it } from "vitest";
import { computeTodayIso } from "#lib/utils/isoDateHelpers";

const originalTz = process.env.TZ;

afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
});

// Each case is an instant (UTC) near a date boundary and the calendar date
// someone in that zone is actually looking at on their wall calendar.
describe("computeTodayIso uses the device's local calendar date", () => {
    it.each([
        // 23:30 UTC on 1 Nov: already 2 Nov in Sydney (UTC+11), still 1 Nov in London/LA.
        ["Australia/Sydney", "2026-11-01T23:30:00Z", "2026-11-02"],
        ["Europe/London", "2026-11-01T23:30:00Z", "2026-11-01"],
        ["America/Los_Angeles", "2026-11-01T23:30:00Z", "2026-11-01"],
        // 00:30 UTC on 2 Nov: still 1 Nov evening in LA (UTC-8).
        ["America/Los_Angeles", "2026-11-02T00:30:00Z", "2026-11-01"],
        ["Pacific/Auckland", "2026-11-02T00:30:00Z", "2026-11-02"],
        // BST (UTC+1): 23:30 UTC on 1 Jul is 00:30 on 2 Jul in London.
        ["Europe/London", "2026-07-01T23:30:00Z", "2026-07-02"],
    ])("%s at %s -> %s", (tz, instant, expected) => {
        process.env.TZ = tz;
        expect(computeTodayIso(new Date(instant))).toBe(expected);
    });
});
