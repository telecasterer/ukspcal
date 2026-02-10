// ICS alarm settings persistence helpers

const REMINDER_SETTINGS_KEY = "ukspcal_ics_alarm_settings";

export interface IcsAlarmSettings {
    alarmEnabled: boolean;
    daysBefore: number;
}

export function loadIcsAlarmSettings(): IcsAlarmSettings {
    if (typeof localStorage === "undefined") return defaultIcsAlarmSettings();
    try {
        const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
        if (!raw) return defaultIcsAlarmSettings();
        return { ...defaultIcsAlarmSettings(), ...JSON.parse(raw) };
    } catch {
        return defaultIcsAlarmSettings();
    }
}

export function saveIcsAlarmSettings(settings: IcsAlarmSettings) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}

export function defaultIcsAlarmSettings(): IcsAlarmSettings {
    return {
        alarmEnabled: false,
        daysBefore: 1,
    };
}
