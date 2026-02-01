    it("generateICS includes VALARM when alarm options are set", async () => {
        const dl = setupDownloadMocks();

        const payments: Payment[] = [
            { due: "2026-01-02", paid: "2026-01-02", early: false },
            { due: "2026-01-30", paid: "2026-01-29", early: true, holidays: ["Holiday"] }
        ];

        const result: PensionResult = {
            ni: "29B",
            normalDay: "Tuesday",
            cycleDays: 28,
            payments
        };

        generateICS(payments, result, {
            csvDateFormat: "dd/mm/yyyy",
            icsEventName: "UK State Pension, Payment",
            icsCategory: "Finance",
            icsColor: "#22c55e",
            icsAlarmEnabled: true,
            icsAlarmDaysBefore: 2
        });

        expect(dl.blobs.length).toBe(1);
        const ics = await blobToText(dl.blobs[0]!);

        // Check for VALARM block
        expect(ics).toContain("BEGIN:VALARM");
        expect(ics).toContain("TRIGGER:-P2D");
        expect(ics).toContain("SUMMARY:UK State Pension");
        expect(ics).toContain("SUMMARY:Upcoming UK State Pension Payment");
        expect(ics).toContain("DESCRIPTION:Your UK state pension payment is due soon.");

        dl.restore();
    });
// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportCSV, generateICS } from "../src/lib/utils/exportHelpers";
import type { Payment, PensionResult } from "../src/lib/pensionEngine";

function blobToText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

function setupDownloadMocks() {
    const blobs: Blob[] = [];

    // jsdom may not implement createObjectURL; we want to capture the blob content.
    const originalCreateObjectURL = globalThis.URL.createObjectURL;
    const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;

    const createObjectURL = vi.fn((blob: Blob) => {
        blobs.push(blob);
        return "blob:mock";
    });
    const revokeObjectURL = vi.fn();

    // Patch URL methods.
    (globalThis.URL as any).createObjectURL = createObjectURL;
    (globalThis.URL as any).revokeObjectURL = revokeObjectURL;

    // Avoid navigation in jsdom.
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    return {
        blobs,
        restore() {
            (globalThis.URL as any).createObjectURL = originalCreateObjectURL;
            (globalThis.URL as any).revokeObjectURL = originalRevokeObjectURL;
            vi.restoreAllMocks();
        }
    };
}

describe("export helpers", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("exportCSV writes expected headers and includes formatted dates", async () => {
        const dl = setupDownloadMocks();

        const result: PensionResult = {
            ni: "29B",
            normalDay: "Tuesday",
            cycleDays: 28,
            payments: []
        };

        const payments: Payment[] = [
            { due: "2026-01-02", paid: "2026-01-02", early: false },
            { due: "2026-01-30", paid: "2026-01-29", early: true, holidays: ["Holiday"] }
        ];

        exportCSV(payments, result, "dd/mm/yyyy");

        expect(dl.blobs.length).toBe(1);
        const text = await blobToText(dl.blobs[0]!);

        expect(text.startsWith("Date,Day,Status,Notes\n")).toBe(true);
        expect(text).toContain('"02/01/2026"');

        dl.restore();
    });

    it("generateICS produces a calendar with RRULE and EXDATEs for early payments", async () => {
        const dl = setupDownloadMocks();

        const payments: Payment[] = [
            // Standard schedule payment
            { due: "2026-01-02", paid: "2026-01-02", early: false },
            // Early payment (should become an EXDATE + explicit override event)
            { due: "2026-01-30", paid: "2026-01-29", early: true, holidays: ["Holiday"] }
        ];

        const result: PensionResult = {
            ni: "29B",
            normalDay: "Tuesday",
            cycleDays: 28,
            payments
        };

        generateICS(payments, result, {
            csvDateFormat: "dd/mm/yyyy",
            icsEventName: "UK State Pension, Payment",
            icsCategory: "Finance",
            icsColor: "#22c55e"
        });

        expect(dl.blobs.length).toBe(1);
        const ics = await blobToText(dl.blobs[0]!);

        expect(ics).toContain("BEGIN:VCALENDAR");
        expect(ics).toContain("RRULE:FREQ=DAILY;INTERVAL=28");
        // EXDATE should be the early *paid* date (YYYYMMDD)
        expect(ics).toContain("EXDATE;VALUE=DATE:20260129");
        // Escaping commas in SUMMARY
        expect(ics).toContain("SUMMARY:UK State Pension\\, Payment");
        // Best-effort Apple color line
        expect(ics).toContain("X-APPLE-CALENDAR-COLOR:#22c55e");

        dl.restore();
    });
});
