# Component & Module Reference

## UI components (src/lib/components)

- **AppFooter.svelte** — Footer with links and disclosures.
- **CalendarMonth.svelte** — Renders a single month’s payment calendar grid.
- **CalendarView.svelte** — Main calendar view; handles navigation and layouts.
- **FloatingFeedbackButton.svelte** — Floating feedback launcher.
- **IcsAlarmDialog.svelte** — Modal to configure ICS alarm settings.
- **PensionInputsCard.svelte** — Input form for NI code, date of birth, cycles, and display options.
	- Note: `PensionInputsCard.svelte` uses Flowbite-Svelte `Select` components and exposes a bindable `ukRegion` prop; the selected region is persisted to local storage.
- **SummaryCard.svelte** — Summary panel (first payment, pension age, normal weekday).
- **SummaryCardContent.svelte** — Shared markup for summary content (used by SummaryCard).
- **ShareButton.svelte** — Share/copy action button with optional size.
- **TopBar.svelte** — App header with title, icon, and action slot.

## Core logic (src/lib)

- **pensionEngine.ts** — Generates payment schedules and applies holiday adjustments.
- **fetchBankHolidays.ts** — (unused) placeholder for alternate holiday fetchers.
- **bankHolidays.ts** — Types for bank holiday responses and maps.
- **buildInfo.ts** — Build metadata used in the UI.
- **services/nagerHolidayService.ts** — Optional public holiday overlay for non-UK calendars.
	- `nagerHolidayService.ts` supports filtering by GB region codes and accepts combined region codes (e.g., `GB-ENG+GB-WLS`) so England & Wales holidays can be applied together.

## Utilities (src/lib/utils)

- **calendarHelpers.ts** — Calendar layout helpers.
- **clearAllAppStorage.ts** — Clears app-specific local storage keys.
- **clipboard.ts** — Clipboard helper with fallback copy support.
- **darkMode.ts** — Dark mode persistence and DOM class helpers.
- **dateFormatting.ts** — Date formatting utilities for display/export.
- **exportHelpers.ts** — CSV and ICS export builders.
- **holidayCache.ts** — Cache helpers for additional holiday data.
- **icsAlarmPersistence.ts** — Persist ICS alarm settings.
- **icsEventTimePersistence.ts** — Persist ICS event time selection.
- **inputPersistence.ts** — Persisting form state in local storage.
- **statePensionAge.ts** — State Pension age calculation.
- **pwaInstall.ts** — PWA install prompt helpers.
- **inAppBrowser.ts** — In-app browser detection.
- **timezoneDetection.ts** — Uses time zone for optional country defaults.

## Routes (src/routes)

- **+layout.ts** — Exposes holiday data for the app (sourced via Nager.Date service).
- **+page.svelte** — Main calculator UI and data flow.
- **help/+page.svelte** — Help page (markdown rendered with dynamic placeholders).
- **sitemap.xml** — Generated sitemap endpoint.

## Data flow overview

1. User inputs are persisted to local storage.
2. `pensionEngine.generatePayments` generates a schedule and flags early payments.
3. Calendar components render the schedule with export options.
4. Help content is rendered from markdown with bank holiday metadata injected.

## External dependencies (at a glance)

- **Nager.Date API** — Primary source for holiday overlays and region-specific data used by the app.

See code comments and types for details on data formats and edge cases.
