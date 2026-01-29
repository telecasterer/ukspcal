# Component & Module Reference

## Svelte Components
- **CalendarMonth.svelte** — Renders a single month’s payment calendar
- **CalendarView.svelte** — Main calendar view, handles navigation and display
- **PensionInputsCard.svelte** — User input form for NI code, date of birth, etc.
- **SummaryCard.svelte** — Shows summary of calculated pension info

## Utilities (src/lib/utils/)
- **calendarHelpers.ts** — Calendar calculation logic
- **dateFormatting.ts** — Date formatting helpers
- **exportHelpers.ts** — CSV/ICS export logic
- **inputPersistence.ts** — Local storage helpers
- **statePensionAge.ts** — SPA calculation logic
- **pwaInstall.ts, inAppBrowser.ts** — PWA and browser environment helpers

## Data Modules
- **fetchBankHolidays.ts** — Loads and caches UK bank holiday data
- **bankHolidays.ts** — Exposes bank holiday data for the app

## Data Flow
- User input → SPA calculation → Payment schedule → Calendar/Export
- All state is managed in Svelte components or browser local storage

## API
- No external API; all logic is client-side except fetching bank holidays from GOV.UK

See code comments and types for further details.