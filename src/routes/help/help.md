## What This App Does

- Calculates your State Pension Age (SPA) date from your date of birth.
- Builds a payment schedule from your NI suffix and selected cycle.
- Adjusts payments that fall on UK bank holidays to the previous working day.
- Lets you export, print, share, and install the app for easier repeat use.

The tool is designed to help you plan ahead and keep your likely payment dates in one place.

## Quick Start

1. Enter your National Insurance (NI) code suffix (the last 3 characters of your NI number, for example **22D**) and your date of birth.
2. Choose your payment cycle and the calendar year range you want to generate.
3. Review your personalised State Pension payment calendar.
4. Export as CSV/ICS or print the calendar if you want to keep a copy.
5. (Optional, recommended) Install the app.

To share the app with someone else, use the **Share** button in the top toolbar.

## Using the App

### Inputs

- **NI code suffix:** Enter the last 3 characters (2 digits and a letter, for example **22D**).
- **Date of birth:** Used to calculate your SPA and estimate your first payment date.
- **Payment frequency:** Choose 28-day (default), 7-day, 14-day, or 91-day cycles.

### Calendar Range and Navigation

- By default, the calendar starts from your first payment month after SPA.
- Choose how many years to include in the generated schedule.
- Use the **Previous/Next** controls above or below the calendar grid to move through month blocks.

### Calendar Display Options

- **UK holidays:** Show or hide UK bank holidays used for early-payment adjustments.
- **Additional holidays:** Optionally show another country/region’s holidays for reference.
  - These additional holidays are informational only and do not change DWP payment dates.
  - They can still be useful if your bank account is outside the UK and local holidays may affect when funds appear.

### Profiles

- Use **Profiles** in the input form to save and reload your NI suffix and date of birth.
- Give each profile a name, then use the load/delete buttons to manage them. Saving a profile with a name that already exists will overwrite the previous entry.
- Profiles are stored locally in your browser — nothing is sent to a server.
- Useful if more than one person uses the same device.

### Summary Panel

The summary panel shows your SPA date, first payment date, and related information. From here you can:

- **Export SPA date** or **Export claiming date** as a single-event ICS file to add to your calendar app.
- **Copy**, **Save**, or **Print** the summary text or payment list.

### Exporting and Printing

- Use **Export** in the calendar toolbar to download:
  - **CSV** for spreadsheet apps.
  - **ICS** for calendar apps (Apple, Google, Outlook, etc.).
- Use **Print** for a paper/PDF version of the calendar.

When exporting ICS from the calendar toolbar:

- Regular payments are exported as a recurring event.
- Early payments (due to bank holidays) are exported as individual events.
- Optional reminders can be included.

This keeps your imported calendar both compact and accurate for early-payment exceptions.

### Installing as an App

- On **Android**, use **Get Android app** to install from **Google Play**.
- On **iPhone/iPad**, use Safari’s **Share -> Add to Home Screen** option.
- On **desktop browsers**, use the **Install** button when available, or your browser’s **Install App** option.
- ![Example](/help/images/install.png)
- Once installed, updates are delivered automatically through Google Play on Android or through your browser for PWA installs.

## How Calculations Work

### About State Pension Age

- The SPA calculation follows published UK government policy.
- If your SPA is before **6 April 2016**, results may be less reliable and a warning is shown.
- Need guidance on how to claim? See [Claiming your State Pension](/claiming).

### UK Holiday Data

The app uses public holiday data to determine early-payment adjustments.
England & Wales is the default UK holiday set for calculation purposes. Scotland and Northern Ireland are available in additional holidays for reference display.

## Troubleshooting

### In-App Browser Issues

- Printing and exporting may fail in Facebook/Messenger or other in-app browsers.
- For best results, open in Safari/Chrome/Edge/Firefox or install the app.
- If install/print options are missing, use your app/browser menu and choose an option such as **Open in browser**.

## Data Privacy & Disclaimer

- **Your data stays on your device.** Nothing you enter is sent to a server.
- **Settings are saved locally** in your browser storage so the app remembers your choices next time.
- To remove saved data, use **Restore defaults** in the input form.
- Full policy: [Privacy Policy](/privacy).

This is an unofficial calculator and is **not affiliated with, endorsed by, or connected to DWP, HMRC, or GOV.UK**.
Dates and calculations use publicly available information and may change over time.
**No warranty is provided.** Use at your own risk and verify with official sources when you need a definitive answer.

## Official Sources

- [GOV.UK State Pension age guidance](https://www.gov.uk/state-pension-age)
- [GOV.UK: Get your State Pension](https://www.gov.uk/get-state-pension)
- [State Pension age timetable](https://www.gov.uk/government/publications/state-pension-age-timetable/state-pension-age-timetable)
- [UK bank holidays](https://www.gov.uk/bank-holidays)
- [Nager.Date worldwide public holidays](https://date.nager.at)

## Feedback & Support

Found a bug or have a suggestion? [Send feedback](https://tally.so/r/q4Vbq2).

Useful details to include:
- Which device/browser you were using.
- What you expected to happen.
- What actually happened.

## Version Information

|                 |                           |
| --------------- | ------------------------- |
| **Developer**   | Paul Robins               |
| **Release**     | {{BUILDINFO_RELEASE}}     |
| **Build**       | {{BUILDINFO_SUMMARY}}     |
| **Build date**  | {{BUILDINFO_BUILD_TIME}}  |
