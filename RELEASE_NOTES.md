# Release notes (2026-01-25)

## Changes

- Fix Flowbite Datepicker styling that could make the selected month label appear blank (Tailwind now includes the relevant Flowbite templates + a `primary` palette is defined).
- Change persistence to **commit-only** (writes happen on blur/change rather than per-keystroke), reducing UI stalls in iOS WebKit contexts (including in-app browsers such as Facebook Messenger).
- Restore Flowbite-Svelte Datepicker’s built-in calendar icon behavior (remove custom icon workarounds).

## Developer notes

- Node.js: use `nvm` and `nvm use` (see `.nvmrc`). This project requires Node 18+.

## QA checklist (focus: iPad Chrome + Messenger in-app browser)

1. NI field
   - Type `12D` (or other valid value) and ensure typing stays responsive.
   - Verify nothing is persisted until you leave the field (blur).
2. Date of birth Datepicker
   - Tap the built-in calendar icon and confirm the picker stays open.
   - Select a date and confirm it persists after a reload.
3. Year range / cycle
   - Change start/end year and payment cycle; confirm persistence on change and restore after reload.
4. Calendar export options
   - Toggle calendar options and CSV format; confirm persistence on change.
   - In ICS modal: edit event name/category/colour; confirm persistence on blur.

If any step fails specifically in Messenger/Chrome but not Safari, capture:
- iOS version
- App (Safari vs Chrome vs Messenger)
- Exact tap sequence
- Screen recording if possible
