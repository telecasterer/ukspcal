// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
    defaultIcsAlarmSettings,
    loadIcsAlarmSettings,
    saveIcsAlarmSettings,
} from "../src/lib/utils/icsAlarmPersistence";

describe("icsAlarmPersistence", () => {
    it("returns defaults when nothing saved", () => {
        localStorage.removeItem("ukspcal_ics_alarm_settings");
        expect(loadIcsAlarmSettings()).toEqual(defaultIcsAlarmSettings());
    });

    it("saves and loads settings", () => {
        const settings = { alarmEnabled: true, daysBefore: 3 };
        saveIcsAlarmSettings(settings);
        expect(loadIcsAlarmSettings()).toEqual(settings);
    });
});
