// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { loadIcsEventTime, saveIcsEventTime } from "../src/lib/utils/icsEventTimePersistence";

describe("icsEventTimePersistence", () => {
    it("returns default when nothing saved", () => {
        localStorage.removeItem("ukspcal_ics_event_time");
        expect(loadIcsEventTime()).toBe("12:00");
    });

    it("saves and loads event time", () => {
        saveIcsEventTime("09:30");
        expect(loadIcsEventTime()).toBe("09:30");
    });
});
