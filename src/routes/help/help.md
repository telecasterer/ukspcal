## Quick Start

1. Enter your National Insurance (NI) code suffix (the last 3 characters of your National Insurance number, e.g. <strong>35C</strong>) and your date of birth.
2. Choose your payment cycle and date range.
3. View your personalised State Pension payment calendar.
4. Export your calendar as CSV (spreadsheet) or ICS (calendar app), or print it for your records.
5. (Optional, recommended) Install the app.

Know someone approaching retirement who might find this useful? {{handleCopyLink}}

## Data Privacy

- **Your data stays on your device.** Nothing you enter is sent to a server or shared with third parties.
- **Settings are saved locally** in your browser’s storage, not in the cloud or on the application server.
- **To remove saved data:** Click _Restore defaults_ on the right hand side of the Input form. All saved values and choices will be removed and reset to the application defaults.

## Using the App

### Inputs

- **NI code:** Enter the last 3 characters (2 digits and a letter, e.g., 22D) of your National Insurance number.
- **Date of birth:** Used to calculate your State Pension Age (SPA) and set your calendar start.

### Calendar Date Range

- By defalt the calendar view will start with month of your first pension payment after reaching SPA.
- You can select how many years of calendar you want to view, print, export but bear in mind that we usually only have the official UK bank holiday dates for the next two years.

### Display Options

- **Weekends:** Toggle weekend days highlight on/off (weekends are shown in a light gray).
- **UK Holidays:** Toggle UK bank holidays on/off (shown with a blue background and white text). These are the official UK bank holidays that affect payment dates—if your payment date falls on a UK bank holiday, it will be paid on the previous working day.
- **Additional holidays:** Optionally display public holidays from another country alongside UK holidays for reference. Currently supports France, Germany, Spain, Italy, Netherlands, Belgium, Austria, Portugal, Ireland, Sweden, Denmark, Norway, Switzerland, United States, Canada, Australia, New Zealand, and Japan. These are marked with a flag 🇫🇷 (respective country emoji) icon on calendar days. **Important:** These additional country holidays are shown for information only and do not affect when the UK issues your payment. However, they may affect when your receiving bank credits the funds to your account, so they are useful for reference if you are receiving payments in another country.

### Payment Frequency

**Note:** Most users do not need to read the detailed rules below. The app will automatically calculate your payment dates based on your NI code and chosen cycle. The following sections are for those who want to understand the calculation logic.

- Choose from 28-day (default), 7-day, 14-day, or 91-day cycles.
- See below for details on how each cycle is calculated.

#### 28-day (4-week) Cycle

- Uses your NI suffix letter (A–D) as a phase (which week in the 4-week pattern).
- The last two digits of your NI code determine your payment weekday:
    - 00–19: Monday
    - 20–39: Tuesday
    - 40–59: Wednesday
    - 60–79: Thursday
    - 80–99: Friday
- Phase (A–D) shifts the schedule by one week per letter.
- Payments repeat every 28 days. Bank-holiday payments are paid early (previous working day).

#### 7-day (Weekly) Cycle

- Same NI-based weekday/phase mapping as the 28-day schedule, but repeats every 7 days.
- Payments repeat every 7 days, with bank-holiday payments paid early.

#### 14-day (Fortnightly) Cycle

- Payments run on a two-week rhythm (Week 1 / Week 2).
- Week 1 vs Week 2 is based on the parity (odd/even) of the final digit of the NI number: even → Week 1, odd → Week 2.
- The NI suffix letter (A–D) is ignored for this cycle.
- Payments repeat every 14 days. Bank-holiday payments are paid early.

#### 91-day (13-week) Cycle

- Used for some overseas payments.
- Same NI-based weekday/phase mapping as the 28-day schedule, but repeats every 91 days.
- The suffix letter (A–D) affects the phase.
- Payments repeat every 91 days, with bank-holiday payments paid early.

### Exporting Data

- Click **Export** to download your payment calendar as a CSV or ICS file. Files are generated on your device and never uploaded.

When exporting as an **ICS** (calendar) file for Apple, Google, or Outlook calendars:

- All your _normal payment_ dates are exported as a single **recurring event**. This event repeats according to your chosen **Payment frequency** (e.g. every 28 days, 14 days, etc.).
- If a payment would fall on a bank holiday, it is moved to the previous working day as an _early payment_. Each _early payment_ is exported as a separate **single event**, so you will see these as individual entries in your calendar.
- This approach ensures your calendar app shows your regular payment pattern, but also highlights any early payments due to bank holidays.
- **Payment Reminders** You can set up calendar reminders for your payment days. Choose how many days in advance you want to be notified. Reminders are included in exported calendar files (ICS) for easy import into your calendar app.

### Installing as an App

- Click the **Install** button or use your browser’s “Add to Home Screen”/“Install App” feature.
- ![Example](/help/images/install.png)
- Once installed, the app updates automatically.

## UK Bank Holiday Data

This app uses the official UK government source for bank holiday dates (https://www.gov.uk/bank-holidays). The published data typically covers up to 2 years ahead from today. If you select a date range beyond the latest available bank holiday, the app will still work, but future bank holidays may not be included until the government updates their data.

**Latest official UK bank holiday currently available:** {{LATEST_BANK_HOLIDAY}}

## Troubleshooting

### In-app browser issues

- Some features may not work in Facebook, Messenger, or other in-app browsers. Open the app in Chrome, Safari, or Edge for best results.

### Printing problems

- For best results, install the app or open in a standard browser.

### Export not working

- Ensure you are not in an in-app browser. Try Chrome, Safari, or Edge.

### How to clear saved data

- Click **Restore defaults** on the right hand side of the Input form. All saved values and choices will be removed and reset to the application defaults.

## About State Pension Age

- The app uses the latest available government policy to calculate SPA.
- If your SPA is before 6 April 2016, results may be inaccurate (a warning will be shown).

## Disclaimer

This tool is an unofficial calculator and is **not affiliated with, endorsed by, or connected to DWP, HMRC, or GOV.UK**.

All dates and calculations are based on publicly available information (such as published pension schedules, the State Pension age timetable, and UK bank holiday lists) and may change at any time.

**No warranty is provided.** Use at your own risk, and always check official sources if you need a definitive answer.

## Feedback & Support

Found a bug or have a suggestion? [Send us your feedback](https://tally.so/r/q4Vbq2) - we'd love to hear from you.

## Version information

|                 |                           |
| --------------- | ------------------------- |
| **Developer**   | Paul Robins               |
| **Version**     | {{BUILDINFO_VERSION}}     |
| **Commit**      | {{BUILDINFO_COMMIT}}      |
| **Commit date** | {{BUILDINFO_COMMIT_DATE}} |
| **Build date**  | {{BUILDINFO_BUILD_TIME}}  |
