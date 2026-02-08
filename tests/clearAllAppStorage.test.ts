// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { clearAllAppStorage } from "../src/lib/utils/clearAllAppStorage";

describe("clearAllAppStorage", () => {
    it("clears app-related storage keys", () => {
        localStorage.setItem("ukspcal.inputs.v1", "{}");
        localStorage.setItem("ukspcal_ics_alarm_settings", "{}");
        localStorage.setItem("ukspcal_ics_event_time", "12:00");
        localStorage.setItem("darkMode", "true");
        localStorage.setItem("holiday_cache_US", "{}");

        clearAllAppStorage();

        expect(localStorage.getItem("ukspcal.inputs.v1")).toBeNull();
        expect(localStorage.getItem("ukspcal_ics_alarm_settings")).toBeNull();
        expect(localStorage.getItem("ukspcal_ics_event_time")).toBeNull();
        expect(localStorage.getItem("darkMode")).toBeNull();
        expect(localStorage.getItem("holiday_cache_US")).toBeNull();
    });
});
