# UK State Pension Calendar – AI Context

## Project

Port of a working Google Apps Script app to SvelteKit + Vercel.
A copy of the source files from the Google Apps Script app are visble
in ../gas. The goal is to implement the same features in the
SvelteKit/Vercel app using Flowbyte/Tailwind elements and styles, so that 
the new app works well as a mobile and web app. The existing styling need 
not be recreated, we want a clean modern look using the new tools.


## Ground Truth

- Pension dates are based on the official DWP 28-day grid
- Anchor date:
  - NI 29B → paid Tuesday 6 Jan 2026
- Grid offset logic MUST match the GAS implementation
- Bank holidays must shift payments earlier

## Current Status (IMPORTANT)

- pensionEngine.ts is working again
- Known regressions already fixed:
  - “everything is Tuesday”
  - December start bug
  - NI grid offset regression
- Tests are being added to lock behaviour

## Files of interest

- src/lib/pensionEngine.ts (DO NOT change logic casually)
- src/lib/fetchBankHolidays.ts (uses gov.uk JSON)
- +layout.ts (loads bank holidays)
- +page.svelte (UI)

## Known rules

- First payment of a year must be january
- Weekday is derived from NI grid, not calendar math
- Bank holidays: shift to previous working day

## Next steps

- Freeze engine with test harness
- Build Flowbite UI
