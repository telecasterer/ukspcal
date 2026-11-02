import { clearAllHolidayCache } from "#lib/utils/holidayCache";

// Utility to clear all app-specific persisted values. Saved profiles are kept: they are
// the one thing a user cannot easily re-create, and "Restore defaults" says so.
export function clearAllAppStorage() {
    if (typeof localStorage === "undefined") return;

    // Main input persistence
    localStorage.removeItem("ukspcal.inputs.v1");
    // ICS alarm settings
    localStorage.removeItem("ukspcal_ics_alarm_settings");
    // ICS event time
    localStorage.removeItem("ukspcal_ics_event_time");
    // Optional theme state
    localStorage.removeItem("darkMode");
    // Holiday cache
    clearAllHolidayCache();
}
