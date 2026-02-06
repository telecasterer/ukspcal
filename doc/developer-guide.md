# Developer Guide: UK State Pension Calendar App

## Project structure
- `src/` — Main source code (SvelteKit, TypeScript).
  - `lib/` — Core logic, components, and utilities.
  - `routes/` — SvelteKit routes (pages and server-side load functions).
  - `styles/` — CSS (Tailwind and print styles).
- `tests/` — Unit tests (Vitest).
- `static/` — Static assets (manifest, icons, robots).
- `doc/` — Documentation.

## Key technologies
- SvelteKit + Svelte 5 (runes mode).
- TypeScript and Vite.
- Tailwind CSS and Flowbite-Svelte for UI.
- MarkdownIt for help page rendering.
- Vitest + Testing Library for tests.

## Local setup & running
1. `npm install`
2. `npm run dev` (development server)
3. `npm run build` (production build)
4. `npm run preview` (preview production build locally)
5. `npm run check` (type checking)

## How data flows
1. **Layout load** (`src/routes/+layout.ts`) fetches UK bank holidays and exposes them as `data`.
2. **Main page** (`src/routes/+page.svelte`) loads persisted inputs, computes state pension age, and calls `generatePayments` from `src/lib/pensionEngine.ts`.
3. **Calendar + summary UI** renders payments, highlights early payments, and supports CSV/ICS export.
4. **Help page** (`src/routes/help/+page.svelte`) renders markdown with dynamic bank holiday placeholders.

## Core logic modules
- `src/lib/pensionEngine.ts` — Payment schedule rules and holiday adjustment logic.
- `src/lib/fetchBankHolidays.ts` — GOV.UK bank holiday fetcher with fallback data.
- `src/lib/services/nagerHolidayService.ts` — Optional extra holiday overlay for other locales.
- `src/lib/utils/` — Date formatting, export helpers, persistence, and PWA helpers.

## Adding features
- **UI:** Add or update Svelte components in `src/lib/components/`.
- **Business logic:** Update `pensionEngine.ts` and ensure tests cover new rules.
- **Utilities:** Add helpers in `src/lib/utils/` and tests in `tests/`.
- **Help content:** Update `src/routes/help/help.md` and adjust parsing if needed.

## Testing
- Run unit tests: `npm run test`.
- Watch mode: `npm run test:watch`.
- Coverage: `npm run test:coverage`.

## Configuration notes
- PWA configuration is handled by `@vite-pwa/sveltekit` in `vite.config.ts`.
- Deployment target is Vercel (adapter in `svelte.config.js`), but the app is static-friendly.
- Environment secrets are not required.

## Contributing
- Follow the repo’s `doc/CONTRIBUTING.md`.
- Keep docs updated alongside behavior changes.
