# Maintenance & Admin Guide

## Deployment
- Build with `npm run build` and deploy the output (e.g. to Vercel, Netlify, or static hosting)
- Static assets are in `static/`

## Environment
- No sensitive environment variables required
- Bank holiday data is fetched live from GOV.UK

## Updating
- To update dependencies: `npm update` or edit `package.json` and run `npm install`
- To update bank holiday logic, edit `src/lib/fetchBankHolidays.ts` and `src/lib/bankHolidays.ts`

## Backup
- User data is only in browser local storage (no server-side data)
- To backup code, use git and a remote repository (e.g. GitHub)

## Monitoring
- Check GitHub issues for bug reports
- Use Vercel/Netlify dashboards for deployment status

## Contact
- For issues, see the GitHub repository
