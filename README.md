# UK State Pension Payment Calendar

A small web app that helps you:

- Check an estimated **State Pension age date** from your date of birth (optional)
- Generate a **UK State Pension payment calendar** from an NI code
- Export results as **CSV** or an **ICS** calendar file, or print the calendar

## Privacy

This app is designed to run in your browser and **does not save your NI code or date of birth**.

## NI code (what to enter)

When the app asks for an **NI code**, it means the **last 3 characters of your National Insurance number**:

- Format: **2 digits + a letter A–D** (example: `22D`)

## Running locally

Prerequisites: Node.js 18+.

```sh
cd frontend
npm install
npm run dev
```

Then open the URL shown in the terminal.

## Building

```sh
cd frontend
npm run build
npm run preview
```

## Export notes (ICS)

The ICS export includes an event name, category, and (best-effort) colour.
Calendar apps vary in what they import:

- **Category/colour may be ignored** by some calendar apps.
- In particular, **Google Calendar often ignores event colour** from ICS imports.

## About / disclaimer

- This is an **unofficial** calculator.
- It is **not affiliated with, endorsed by, or connected to** the Department for Work and Pensions (DWP), HMRC, or GOV.UK.
- Calculations and dates are based on **publicly available information** (for example, published pension schedules, the State Pension age timetable, and bank holiday lists) and may change.
- **No warranty** is provided. Use at your own risk and always check official sources if you need a definitive answer.

## Tech stack

- SvelteKit (Svelte 5)
- Tailwind CSS
- Flowbite-Svelte
