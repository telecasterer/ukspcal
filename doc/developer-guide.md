# Developer Guide: UK State Pension Calendar App

## Project Structure
- `src/` — Main source code (SvelteKit, TypeScript)
  - `lib/` — Core logic, components, and utilities
  - `routes/` — SvelteKit routes (pages, API, help)
  - `styles/` — CSS (Tailwind, custom)
- `tests/` — Unit tests (Vitest)
- `static/` — Static assets (manifest, images)
- `doc/` — Documentation

## Key Technologies
- SvelteKit, Svelte, TypeScript
- Tailwind CSS, Flowbite-Svelte
- MarkdownIt (for help docs)
- Vite (build tool)

## Setup & Running
1. `npm install`
2. `npm run dev` (development)
3. `npm run build` (production build)
4. `npm run check` (type/lint/test)

## Adding Features
- Add new Svelte components in `src/lib/components/`
- Add new utilities in `src/lib/utils/`
- Add new pages in `src/routes/`
- Update help docs in `src/routes/help/`

## Testing
- Tests are in `tests/` and use Vitest
- Run all tests: `npm test` or `npm run test`

## Contribution
- Follow code style and add comments for clarity
- Write/maintain tests for new features
- Document new features in the appropriate doc

## Contact
See the GitHub repo for issues and contributions.