// Utility to clear all app-specific persisted values
export function clearAllAppStorage() {
  // Main input persistence
  localStorage.removeItem("ukspcal.inputs.v1");
  // ICS alarm settings
  localStorage.removeItem("ukspcal_ics_alarm_settings");
  // Optionally, clear dark mode (if you want to reset theme)
  // localStorage.removeItem("darkMode");
}
