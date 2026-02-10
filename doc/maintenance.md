# Maintenance & Admin Guide

## Deployment

- Build with `npm run build` and deploy (Vercel is the default adapter).
- Run `npm run preview` to verify production output locally.
- Static assets live in `static/` and are served as-is.

## Environments & configuration

- No sensitive environment variables are required.
- Bank holiday data is fetched at runtime from GOV.UK.
- Optional extra holiday data can be pulled from Nager.Date.

## Release checklist

1. Run tests: `npm run test`.
2. Run type checks: `npm run check`.
3. Update `RELEASE_NOTES.md` if user-visible changes are included.
4. Verify the help page content renders correctly.
5. Confirm build output: `npm run build`.

## Dependency updates

- For minor updates: `npm update`.
- For targeted upgrades: edit `package.json`, then run `npm install`.
- After upgrades, re-run tests and verify build output.

## Holiday data updates

- GOV.UK holiday data is fetched on each load; no manual updates needed.
- If holiday rules change, update `src/lib/pensionEngine.ts` and tests accordingly.
- For non-UK holidays, update `src/lib/services/nagerHolidayService.ts` or caching logic.

## Backup & data retention

- User data stays in local storage; there is no server-side user data.
- Backup code using git and a remote repository (GitHub, GitLab, etc.).

## Monitoring & support

- Monitor GitHub issues for bug reports.
- Use Vercel/Netlify dashboards for deployment status and logs.
- Validate analytics and PWA install metrics as part of release checks.
