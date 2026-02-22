# Release Notes

This changelog was backfilled from git history on 2026-02-22 to capture missing release notes.

## 2026-02-22 (v0.2.2)

### Fixes

- updates to PWA config to improve iOS installs (05b896f)

## 2026-02-22 (v0.2.1)

### Fixes

- calendar legend was missing for additional countries in some cases (4d8eb92)

## 2026-02-22 (v0.2.0)

### Features

- added percentage of full payment information to first payment information (5b89bd3)

## 2026-02-22 (v0.1.0)

### Features

- add semver release automation and improve help-page version display (92ff6a8)

### Chores

- add PaymentList, dateFormats util and calendar options tests (20f51ef)
- upgrade @vercel/analytics to include SvelteKit export (3e135bc)
- restore svelte.config.js; upgrade @sveltejs/adapter-vercel (02abb53)
- stop tracking node_modules (37b9cb7)

### Other

- Calender month tweaks: legend items only for current month. Current date is now highlighted in calendar. (f60f42a)
- Test coverage improvements,. code review and cleanup. Fixed dark mode page bg (24bf802)
- Auto extend calendar if user navs past the end (16f407c)
- Features (ui,help,analytics): streamline calendar UX, move/expand help content, add Today jump + hover tooltips, and update tests (153443d)
- Help page updates, added payment list buttons to save/print etc (649f61b)
- unify details/summary styling and improve help typography (03baf82)
- help page font tweaks (bd8ee75)
- Merge pull request #7 from telecasterer/pr/dependabot-6 (7df91cd)
- fix typings in calendarOptions.test.ts (deff4c5)
- Merge main into pr/dependabot-6: resolve conflicts (calendar tests + CalendarMonth) (bbb293c)
- Make calendar options tests robust; respect showBankHolidays in CalendarMonth (7946c40)
- Fix calendar showbbankholidays in the calendar month view (78fddc5)
- Bump svelte from 5.50.2 to 5.53.0 (a31122c)
- Added list or payment dates to summary section. Changed help page accordian to native elelements (02967a2)
- updated build and commit info timestamps to UTC (1949760)
- Moved GB SCT and NIR to the top of the country selector list. Added tests for flags (12b6265)
- A one-time migration on first load to clear per-region holiday caches (holiday_cache_GB-SCT, holiday_cache_GB-NIR) and remove legacy persisted ukRegion so England & Wales remain the canonical bank-holidays used for payment calculations. (fab5c56)
- Removed uk region selector. Added missing flags for uk regions and added GB-NIR and GB-SCT to the list of additional countries. Updated help page to reflect changes. (08e1c90)
- Tweaks to flag size in calendar month view (d65c6a0)
- Help page tweaks and docs (c8634d5)
- Help fixed (0c4724d)
- Persist ukRegion; support combined GB-ENG+GB-WLS; use Select for region; add persistence tests (4fdddf7)
- label size tweak (025fef8)
- Updated Calendar view nav buttons labels to show range of visible months (70cdb3f)
- Fixed calendar view bottom nav to keep viewport the same after next/previous (1736ea6)
- Add 2nd set of nav buttons below calendar months (67e54c0)
- Updated title in top page (00d14e6)
- Updated SEO meta tags and schema.org JSON-LD for better search engine optimization. Added prettier configuration for consistent code formatting. Updated tests to (0fdbea8)
- Added posthog config. More doc updates (50c18b4)
- fix  Sharebutton size type (e00055f)
- Update documentation coverage (a4f33bc)
- Reduce topbar buttons size (682409a)
- Code review, depuped, and added tests for the new features. Changed emoji flags to svg flags to support more countries and ensure consistent appearance across platforms.  Added a share ShareButton (7ed962a)
- Update addtional holidays when duration changes (732b682)
- fixed persistence for additional countries holidays (4168839)
- Added optional overlay of another countries public holidays in calendar view. (2298396)
- Corrected duration (years) which was n+1 instead of n (afd0afa)
- Updated help and calendar view controls layout (2927a8b)
- Change calendar payment day text to white (598a4db)
- Fix build error (5a93642)
- Fixed first payment date in Schedule summary (f367ee8)
- Updated Select components classes prop instead deprecated selectClass (9e20f51)
- Layout changes to improve ergonomics (f81ee2b)
- removed static sitemap (bdde271)
- SEO stuff (022082b)
- Added SEO meta tags (6b853c1)
- Updated tests (5d4f858)
- icon tweaks (2c3c27f)
- Change back to nate datepicker for date of birth input (61d527c)
- Tweaks to help page (675b2e8)
- Urgent fix (4d98acf)
- fixed problem with service worker not updating correctly (a5f6530)
- Added soft-reload when new service worker is available. (cfa4410)
- Added floating feedback button component to layout. (25d66c6)
- Added feedback link to footer (8fa2a0e)
- Allow vercel toolbar in CSP (72be258)
- remove hardcoded paths in CSP for service worker in vercel.json (18074bc)
- Fix CSP by adding root URL to precache list (19a8bbe)
- Added CSP to vercel.json to improve security. (05d4f3b)
- Bump tar from 7.5.6 to 7.5.7 (#4) (53f2d8b)
- ui tweaks to PensionInputsCard.svelte (1092657)
- Normalised checkbox styles and added corrected ICS event time format to use local time instead of UTC. (10435a9)
- Remove calendar reminder description and title because they arent supported by all calendar apps. Added support for event time in calendar exports. (bfb39fe)
- Renamed Alarms to Reminders for payments (9cda415)
- Added ICS alarm dialog and persistence functionality. Added reset app data feature. (96897e5)
- Updated calendar print styles and fixed layout issues in CalendarMonth component. (314fa5b)
- Updated calendar colors to use emerald, amber, and blue shades and legend sizes for better visual distinction. (3541751)
- Added icons 192 and 512 and updated manifest file for PWA compliance (0701f26)
- Remove offline message in help (c0024db)
- Added topbar to help page (d4c8660)
- Remove "more help" link. Added some basic project docs (a5e22b3)
- Clean up and comment throughout the project. Help page simplified. (46ff6b0)
- Fixed help renderer. Stripped out debug code (8296f75)
- Fixed duplicate months in Calendar prints. Updated help. (c513fe4)
- Moved Help to md format and updated it. (7cea01a)
- Merge pull request #3 from dylan-robins/test/automate_unit_test_execution (9f9ceb6)
- Added github action file to run tests automatically on commit + status badge in readme (4327c2d)
- Added an Install icon for PWA. Moved code into helper functions/files for better readability. (516c1fd)
- Added PWA support and updated dependencies. Added topbar message when in Fb browsers to open app in a real browser. (8585f70)
- Added a note about SPA before 6 April 2016 in the help page. (65069ab)
- Warn if SPA is before 6 April 2016 as rules changed then. (2f2f4e3)
- Merge branch 'pr-2' (8855f65)
- Merge pull request #1 from dylan-robins/feat/add_link_to_github (f2bd351)
- Updated README and gitignore after folder flattening (a89b287)
- Cleaned up a bunch of useless config stuff (d614d6b)
- Simplified whole structure by remove useless "monorepo" hierarchy level and removed old GAS code (5e3a2de)
- Added footer element with link to Github repo 🙂 (a9186bf)
- Regerate calendar onchange of inputs (c5e4e2f)
- Added in 14 day cycle rules and regenerate on changes, not just onblur (61d2793)
- Warn users in FB browser to open in a real browser to enable printing. (8c2e343)
- Enter in the NI field now commits and moves to the date field. (f2a9112)
- Optimisation of calender rendering. (8ca330d)
- Rollback datepicker hack for Ipad, save user input onblur (d921dc4)
- Datepicker frig for IPad (66b945d)
- Updates to input persistance and validation (8e56e57)
- Fixed datepicker showing current month name transparent in month picker in light mode. (6e96db8)
- Added unit tests, removed redundant files and code. (376cf0b)
- Changed datepicker, added 13 week cycle, ui and help page tweaks. (30ea50a)
- simplified logic and removed buttons, dob is now required (7fe65c0)
- Layout changes and calendar print view updated (f1072c5)
- Fix ics export for early payments. (2451247)
- Added build date to version info (fe38437)
- Updated ics to be Google Calendar compatible (234b8c6)
- Don't mark builds dirty on CI (849a872)
- Deploy hygiene + Vercel build version fix (2fefc9a)
- Fix Vercel install/build for SvelteKit (f381400)
- added file vercel.json (adb211f)
- Fix Vercel build commands (3cd9ca2)
- vercel config for SvelteKit project (f78fb0d)
- More updates after rename  to support Vercel deployment (4d4e62f)
- Renamed frontend to web and updated relevant files. (3b06560)
- Updated package.json and package-lock.json for vercel deployment fix (b883963)
- Added untracked files, modified files, deleted files, and unmerged paths. (dd17e01)
- Added SPA calculation, Help page, layout changes, Export options, and various improvements. (669fe1b)
- Change calender styles (f6b5ddd)
- Change calender styles (20a5d66)
- Fix responsive design, dark mode persistence, and improve layout (c812480)
- Use effect.pre for dark mode reactivity (6e22725)
- Use reactive statement instead of effect for dark mode (e8033b2)
- Add detailed debug logging to track state changes (5166ea6)
- Add debug logging to test button event binding (e5f5891)
- Fix test expectations to match correct pension engine calculations (ed05393)
- Replace Flowbite buttons with HTML and CSS classes to fix broken functionality and reduce class bloat (f34e2aa)
- Fix Svelte 5 runes compatibility - use $props instead of export let (f05106b)
- Add dark mode toggle and comprehensive dark mode styling (47e6664)
- Fix NI code validation to accept lowercase letters (4450ada)
- Fix calendar: start week on Monday, fix 1st of month day alignment (50da3b0)
- Fix calendar weekend detection to use UTC consistently (b0094b9)
- Improve UI styling: fix Normal Payment Day display, enhance calendar layout and responsiveness, better Tailwind styling (e798563)
- Initial commit: UK State Pension Calendar app with Flowbite UI, calendar and list views (d869d3b)

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
