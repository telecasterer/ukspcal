// ICS alarm settings persistence helpers

import { DEFAULT_ICS_ALARM_TITLE, DEFAULT_ICS_ALARM_DESCRIPTION } from "./exportHelpers";
const ALARM_SETTINGS_KEY = "ukspcal_ics_alarm_settings";

export interface IcsAlarmSettings {
  alarmEnabled: boolean;
  daysBefore: number;
  alarmTitle: string;
  alarmDescription: string;
}

export function loadIcsAlarmSettings(): IcsAlarmSettings {
  if (typeof localStorage === "undefined") return defaultIcsAlarmSettings();
  try {
    const raw = localStorage.getItem(ALARM_SETTINGS_KEY);
    if (!raw) return defaultIcsAlarmSettings();
    return { ...defaultIcsAlarmSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultIcsAlarmSettings();
  }
}

export function saveIcsAlarmSettings(settings: IcsAlarmSettings) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(settings));
}

export function defaultIcsAlarmSettings(): IcsAlarmSettings {
  return {
    alarmEnabled: false,
    daysBefore: 1,
    alarmTitle: DEFAULT_ICS_ALARM_TITLE,
    alarmDescription: DEFAULT_ICS_ALARM_DESCRIPTION
  };
}
