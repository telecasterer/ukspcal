# Release Notes

This changelog was backfilled from git history on 2026-02-22 to capture missing release notes.

## 2026-02-22

- Calendar month legend now only shows event types that appear in that month.
- Removed weekend legend entry.
- Current day is now highlighted in the calendar.

## 2026-02-21

- Calendar navigation now auto-extends the generated range when navigating past the end.
- Test coverage improvements and cleanup.
- Fixed dark-mode page background issue.

## 2026-02-20

- Added jump-to-today calendar action.
- Added hover/focus tooltips for calendar day details.
- Streamlined calendar controls and UX flow.
- Expanded and reorganized Help content.
- Added analytics events for key calendar interactions.

## 2026-02-19

- Added payment date list in Summary, with list-focused actions.
- Added calendar options/date-format test coverage and robustness fixes.
- Ensured `showBankHolidays` is consistently respected in month rendering.
- Improved Help page typography and details/summary UI consistency.
- Upgraded core dependencies (including Svelte and adapter-vercel).

## 2026-02-13

- Removed legacy UK region selector from payment-calculation path.
- England + Wales (`GB-ENG+GB-WLS`) is now the canonical UK bank-holiday baseline for payment calculations.
- Scotland and Northern Ireland are available as optional additional holiday overlays.
- Added first-load migration to clear legacy `ukRegion` and related regional holiday caches.
- Added one-time in-app migration notice.

## 2026-02-10 to 2026-02-12

- Calendar navigation labels updated to show visible month ranges.
- Added secondary calendar pager controls below the month grid.
- Improved paging behavior to keep viewport stable after next/previous.
- SEO metadata and structured data improvements.

## 2026-02-04

- Added optional overlay of additional countries' public holidays.
- Fixed persistence and regeneration behavior for additional-country holiday data.
- Updated holiday overlays when duration changes.

## 2026-02-01 to 2026-02-03

- Added CSP hardening and follow-up fixes for Vercel/runtime compatibility.
- Added soft reload support when a new service worker is available.
- Added feedback entry points (floating button and footer link).
- Improved help docs, layout ergonomics, and multiple UI polish fixes.
- Fixed duration off-by-one issue (`n+1` years) and summary first-payment accuracy.

## 2026-01-31

- Added ICS reminder dialog and persistence.
- Added reset app data capability.
- Added ICS event-time support and corrected local-time formatting behavior.
- Renamed "Alarms" to "Reminders" in UI language.

## 2026-01-26 to 2026-01-30

- Added/expanded PWA support (manifest/icons/install UX).
- Added top bar improvements and in-app browser guidance.
- Help content moved to Markdown and expanded.
- Improved print layout and calendar visual styling (payment/early/holiday distinction).
- Added GitHub Actions unit-test workflow and status badge.

## 2026-01-24 to 2026-01-25

- Initial SvelteKit/Vercel deployment stabilization and build fixes.
- Added SPA calculation, export options, help page, and major layout updates.
- Added/fixed ICS compatibility behavior (including early-payment handling).
- Added payment-cycle improvements (including 14-day and 13-week options) and input UX/persistence updates.
- Added early project unit tests and rendering/performance tweaks.

## 2026-01-20 to 2026-01-23

- Initial app release: UK State Pension Calendar with calendar/list views.
- Calendar correctness fixes: Monday-start weeks, UTC weekend detection, and first-of-month alignment.
- Added NI code input validation improvements.
- Added dark mode toggle, persistence, and styling refinements.
- Improved responsive layout and calendar styling.
- Updated Svelte 5 runes usage (`$props`) and button implementation reliability.
- Added early debugging/test hardening work prior to subsequent feature expansion.

## Developer Notes

- Node.js: use `nvm` and `nvm use` (see `.nvmrc`). Project requires Node 18+.
- Git history in this repository currently begins on 2026-01-20.
