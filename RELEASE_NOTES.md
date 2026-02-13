# Release notes (2026-02-08)

## Changes

- Top bar actions now use smaller Flowbite button sizing to reduce title overlap in compact layouts.
- Share button now supports a `size` prop (Flowbite sizes) and is used in top bar actions.
- Calendar day highlight styles were simplified (removed extra borders/rings).
- Added `SummaryCardContent` to dedupe summary markup.
- Expanded clear-all storage helper to cover all app keys and holiday cache.
- Added and expanded unit tests for new and existing components/utilities.
- Documentation updated (user guide, README, component reference).

## Developer notes

- Node.js: use `nvm` and `nvm use` (see `.nvmrc`). This project requires Node 18+.

## QA checklist (focus: top bar layout + calendar UI)

1. Top bar actions
    - Verify buttons do not overlap the title on narrow screens.
    - Confirm Help/Share/Install/Dark Mode buttons are still usable.
2. Share action
    - Share opens native share (if available) or copies link.
3. Calendar highlights
    - Payment/early/holiday/additional holiday cells render without heavy borders/rings.
4. Clear-all storage
    - Ensure reset clears inputs, ICS settings, and holiday cache.

If any step fails specifically in Messenger/Chrome but not Safari, capture:

- iOS version
- App (Safari vs Chrome vs Messenger)
- Exact tap sequence
- Screen recording if possible

## 2026-02-13

- Migration: remove legacy persisted `ukRegion` and clear regional holiday caches for Scotland/Northern Ireland on first load. Shows a one-time dismissible notice in the app. Keeps England & Wales as the canonical bank-holidays used for payment calculations; Scotland and Northern Ireland are available as additional overlays.
