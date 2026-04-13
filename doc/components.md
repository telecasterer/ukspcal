# Component & Module Reference

## UI components (src/lib/components)

- **AppFooter.svelte** — Footer with links and disclosures.
- **CalendarMonth.svelte** — Renders a single month’s payment calendar grid.
- **CalendarView.svelte** — Main calendar view; handles navigation, layout, and print controls.
  - `Previous`/`Next` move in 6-month steps.
  - If `Next` reaches the end of generated months, it requests a one-year extension from the parent and regenerates.
  - Export and country-selector UI is delegated to sub-components (see below).
- **CalendarPager.svelte** — Reusable previous/next/today pager row used above and below the month grid.
- **CountryHolidaySelector.svelte** — Checkbox + country dropdown for optional non-UK holiday overlays, including loading/error states.
- **CsvExportModal.svelte** — Modal for CSV export with date-format selection.
- **IcsAlarmDialog.svelte** — Modal to configure ICS alarm settings.
- **IcsExportModal.svelte** — Modal for ICS export with event name, category, colour, time, and reminder settings.
- **PensionInputsCard.svelte** — Input form for NI code, date of birth, cycles, and display options. Computes a mini SPA schedule internally and emits the result upward via the `onSpaPreviewData` callback prop; it no longer renders the SPA preview itself.
- **SummaryCard.svelte** — Summary panel wrapper. Accepts a nullable `result` (renders before a full schedule is generated) and a `spaPreviewData` prop forwarded from the page.
- **SummaryCardContent.svelte** — Summary panel content. Renders in three layers: (1) SPA details block (age, first/second payment, comprising text) driven by `spaPreviewData`; (2) coloured info grid (NI code, payment day, cycle, next payment) driven by `result`; (3) collapsible payment date list with copy/save/print actions. The panel header also has copy/save/print icon buttons for the full summary.
- **ShareButton.svelte** — Share/copy action button with optional size.
- **TopBar.svelte** — App header with title, icon, and action slot.

## Core logic (src/lib)

- **pensionEngine.ts** — Generates payment schedules and applies holiday adjustments.
- **config.ts** — Shared app constants: `PERSIST_KEY`, `ANDROID_PLAY_STORE_URL`, `ALLOWED_CYCLE_DAYS`, `ALLOWED_DATE_FORMATS`.
- **buildInfo.ts** — Build metadata used in the UI.
- **services/nagerHolidayService.ts** — Optional public holiday overlay for non-UK calendars.

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
- **isoDateHelpers.ts** — Shared ISO date utilities: `isIsoDate`, `subtractMonthsFromIso`, `formatIsoDateLong`, `daysUntilIso`.
- **loadAdditionalHolidays.ts** — Fetches and caches additional (non-UK) public holidays for a given country and year range, with stale-cache invalidation, incremental year fetching, and race-condition guarding.
- **persistedInputsMigration.ts** — One-time migration for legacy persisted input keys.
- **posthog.ts** — Analytics event helpers.
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
2. `PensionInputsCard` computes a mini schedule for the SPA year and emits `SpaPreviewData` via `onSpaPreviewData`; the page stores this in state and passes it down to `SummaryCard`/`SummaryCardContent`.
3. `pensionEngine.generatePayments` generates the full schedule and flags early payments.
4. Calendar components render the full schedule with export options.
5. `SummaryCardContent` renders the SPA details block as soon as `spaPreviewData` is available (before the full schedule), then adds the coloured grid and payment list once `result` is set.
6. Help content is rendered from markdown with bank holiday metadata injected.

## External dependencies (at a glance)

- **Nager.Date API** — Primary source for holiday overlays and region-specific data used by the app.

See code comments and types for details on data formats and edge cases.
