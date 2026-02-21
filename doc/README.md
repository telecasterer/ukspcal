# UK State Pension Calendar App

A modern, privacy-focused web app to calculate and export your UK State Pension payment calendar. Built with SvelteKit, TypeScript, Tailwind CSS, and Flowbite-Svelte components.

## What this app does

- Calculates UK State Pension age and payment schedules.
- Supports official payment cycles (7-day, 14-day, 28-day, 91-day).
- Adjusts payment dates for weekends and UK bank holidays.
- Extends calendar duration automatically by 1 year if `Next` reaches the end of the generated range.
- Optional holiday overlays using a public holiday API for non-UK calendars.
- Exports payment schedules to CSV and ICS formats.
- Works offline and can be installed as a PWA.
- All calculations run locally in the browser; no personal data leaves the device.

## Quick start (users)

1. Open the app in your browser (desktop or mobile).
2. Enter your NI code suffix and date of birth.
3. Pick a payment cycle and the number of years to view.
4. Review the calendar, then export, print, or save as needed.

## Quick start (developers)

1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Run tests: `npm run test`
4. Type-check: `npm run check`

## Repository structure

- `src/` — Application source (SvelteKit + TypeScript).
    - `lib/` — Core business logic, components, and utilities.
    - `routes/` — Pages (main calculator, help page, sitemap).
    - `styles/` — Print styles and global CSS.
- `tests/` — Vitest unit tests.
- `static/` — Static assets (manifest, icons, robots).
- `doc/` — Documentation.

## Documentation map

- [User Guide](user-guide.md): How to use the app and export data.
- [Developer Guide](developer-guide.md): Architecture, data flow, and dev workflow.
- [Component Reference](components.md): UI components, utilities, services.
- [Maintenance Guide](maintenance.md): Releases, deployment, and operational care.
- [Contributing](CONTRIBUTING.md): How to contribute changes.

## Release notes

See `RELEASE_NOTES.md` at the repo root for release details.

## License

MIT
