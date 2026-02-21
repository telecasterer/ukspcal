# Maintenance & Admin Guide

## Deployment

- Build with `npm run build` and deploy (Vercel is the default adapter).
- Run `npm run preview` to verify production output locally.
- Static assets live in `static/` and are served as-is.

## Environments & configuration

- No sensitive environment variables are required.
 - Bank holiday and regional overlays are fetched from Nager.Date via `src/lib/services/nagerHolidayService.ts`.

## Release checklist

1. Run tests: `npm run test`.
2. Run type checks: `npm run check`.
3. Update `RELEASE_NOTES.md` if user-visible changes are included.
4. Verify the help page content renders correctly.
5. Confirm build output: `npm run build`.
6. Smoke-test calendar navigation:
   - Change `Duration` and verify the header range updates.
   - Click `Next` at the end of range and verify duration auto-extends by 1 year.

## Dependency updates

- For minor updates: `npm update`.
- For targeted upgrades: edit `package.json`, then run `npm install`.
- After upgrades, re-run tests and verify build output.

## Holiday data updates

- Holiday data is fetched from Nager.Date; no manual updates needed.
- If holiday rules change, update `src/lib/pensionEngine.ts` and tests accordingly.
- For non-UK holidays, update `src/lib/services/nagerHolidayService.ts` or caching logic.

## Backup & data retention

- User data stays in local storage; there is no server-side user data.
- Backup code using git and a remote repository (GitHub, GitLab, etc.).

## Monitoring & support

- Monitor GitHub issues for bug reports.
- Use Vercel/Netlify dashboards for deployment status and logs.
- Validate analytics and PWA install metrics as part of release checks.
