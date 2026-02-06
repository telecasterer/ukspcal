# Component & Module Reference

## UI components (src/lib/components)
- **AppFooter.svelte** — Footer with links and disclosures.
- **CalendarMonth.svelte** — Renders a single month’s payment calendar grid.
- **CalendarView.svelte** — Main calendar view; handles navigation and layouts.
- **FloatingFeedbackButton.svelte** — Floating feedback launcher.
- **IcsAlarmDialog.svelte** — Modal to configure ICS alarm settings.
- **PensionInputsCard.svelte** — Input form for NI code, date of birth, cycles, and display options.
- **SummaryCard.svelte** — Summary panel (first payment, pension age, normal weekday).

## Core logic (src/lib)
- **pensionEngine.ts** — Generates payment schedules and applies holiday adjustments.
- **fetchBankHolidays.ts** — GOV.UK bank holiday fetcher with fallback data.
- **bankHolidays.ts** — Types for bank holiday responses and maps.
- **buildInfo.ts** — Build metadata used in the UI.
- **services/nagerHolidayService.ts** — Optional public holiday overlay for non-UK calendars.

## Utilities (src/lib/utils)
- **calendarHelpers.ts** — Calendar layout helpers.
- **dateFormatting.ts** — Date formatting utilities for display/export.
- **exportHelpers.ts** — CSV and ICS export builders.
- **holidayCache.ts** — Cache helpers for additional holiday data.
- **inputPersistence.ts** — Persisting form state in local storage.
- **statePensionAge.ts** — State Pension age calculation.
- **pwaInstall.ts** — PWA install prompt helpers.
- **inAppBrowser.ts** — In-app browser detection.
- **timezoneDetection.ts** — Uses time zone for optional country defaults.

## Routes (src/routes)
- **+layout.ts** — Fetches UK bank holidays for the app.
- **+page.svelte** — Main calculator UI and data flow.
- **help/+page.svelte** — Help page (markdown rendered with dynamic placeholders).
- **sitemap.xml** — Generated sitemap endpoint.

## Data flow overview
1. User inputs are persisted to local storage.
2. `pensionEngine.generatePayments` generates a schedule and flags early payments.
3. Calendar components render the schedule with export options.
4. Help content is rendered from markdown with bank holiday metadata injected.

## External dependencies (at a glance)
- **GOV.UK Bank Holidays API** — Primary source for UK holiday data.
- **Nager.Date API** — Optional extra holiday overlays for other countries.

See code comments and types for details on data formats and edge cases.
