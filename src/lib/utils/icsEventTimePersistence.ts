// Persistent storage for ICS event time
const ICS_EVENT_TIME_KEY = "ukspcal_ics_event_time";

export function loadIcsEventTime(): string {
  if (typeof localStorage === "undefined") return "12:00";
  try {
    const raw = localStorage.getItem(ICS_EVENT_TIME_KEY);
    if (!raw) return "12:00";
    return raw;
  } catch {
    return "12:00";
  }
}

export function saveIcsEventTime(time: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ICS_EVENT_TIME_KEY, time);
}
