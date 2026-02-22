# UK State Pension Calendar

SvelteKit web app for calculating UK State Pension age and payment dates, with calendar exports and print-ready views.

Currently released app: https://ukspcal.vercel.app

[![unit test status](https://github.com/telecasterer/ukspcal/actions/workflows/test.yml/badge.svg)](https://github.com/telecasterer/ukspcal/actions/workflows/test.yml)

## Features

- Calculates State Pension age and payment schedules.
- Supports 7/14/28/91-day payment cycles.
- Adjusts for UK bank holidays and weekends.
- Optional additional holiday overlays for other countries.
- Export to CSV or ICS (with alarms, category, colour, and event time).
- Print-friendly calendar view.
- Works offline and can be installed as a PWA.
- Privacy-first: all calculations run locally in the browser.

## Documentation

- User guide: doc/user-guide.md
- Developer guide: doc/developer-guide.md
- Component reference: doc/components.md
- Maintenance guide: doc/maintenance.md

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Test

```sh
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

## Check

```sh
npm run check       # Run type checks
npm run check:watch # Run type checks in watch mode
```

## Release Workflow (Solo / Main Branch)

This repo supports direct-to-`main` development with local release automation.

1. Install commit hooks once:

```sh
npm run hooks:install
```

2. Use Conventional Commits:

```text
feat(calendar): add today highlight
fix(export): correct ICS time format
docs(readme): add release workflow
```

3. Create a release when ready:

```sh
npm run release
```

`npm run release` will:
- run checks and tests
- bump semver in `package.json` (and lockfile)
- append a new top section to `RELEASE_NOTES.md` from commits since last `v*` tag
- create release commit `chore(release): vX.Y.Z`
- create annotated tag `vX.Y.Z`

4. Push to production:

```sh
git push origin main --follow-tags
```

Vercel will deploy from `main`, and Help page version info will show readable semver + build metadata.

## License
MIT
