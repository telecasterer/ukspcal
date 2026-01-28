## Data privacy (plain English)

- **Nothing you enter in the page is sent to a server.** Your NI code and date of birth are used only to calculate results **in the browser**.
- **No data is shared.** The information you enter is **not shared with any third parties**.
- **What is stored:** the app may save your **settings** (e.g. NI suffix, date of birth, payment cycle, start/end years) in your browser’s **local storage** so they’re remembered next time.
- **Where it’s stored:** only **on your device**, inside your browser’s storage for this site (not in your files and not in a database).
- **Exports:** CSV/ICS files are **created and downloaded on your device** when you click Export.
- **How to remove it:** clear this site’s browser data (Site settings → Clear data / Clear storage) or use a private/incognito window so nothing is saved.
  
## Tips for usage

- **Works in any browser:** This app runs in all modern browsers on desktop and mobile.
- **In-app browsers (like Facebook/Messenger):** Some features (such as printing, exporting, or installing as an app) may not work properly in Facebook, Messenger, or other in-app browsers. For the best experience, open the app in Chrome, Safari, or Edge.
- **Recommended browsers:** For full functionality and best performance, use a recent version of Chrome, Safari, or Edge.
  
- **Installing as an app:**
  - **Install button:** For most users, click the **Install** button at the top of the page (on both desktop and mobile) to 
  install the app on your device.
  ![Example](/help/images/install.png)
  - **On mobile:** In Chrome (Android) or Safari (iOS), you can also use your browser’s menu (three dots or share icon) and select “Add to Home Screen.”
  - **On desktop:** In the browser, look for the install icon in the address bar or open the browser menu and select “Install app.”
- **Advantages of installing as a app:**
  - The app launches like a native application from your home screen or desktop.
  - You get a cleaner, fullscreen experience without browser address bars or tabs.
  - Updates are automatic.
- **Offline use:** After installing as an app, most features will work even without an internet connection.

## Inputs (NI code and date of birth) 

- **NI code**
    - When the app asks for an **NI code**, it means the last 3 characters of your National Insurance number: 2 digits + a letter A–D (for example, **22D**).

- **Date of birth**
    - Your date of birth is required to calculate the date you reach UK State Pension age (SPA) and is also used to set the calendar start month.

The calendar is automatically clamped so it won’t show months before your first payment after reaching SPA.

State Pension age can change based on government policy. The app uses the current policy, to the best of our knowledge, at the time of writing.

**Note**: the payment rules in this app assume your SPA is on or after **6 April 2016**. If your SPA is earlier than that, results may be inaccurate (the app will show a warning).

## Payment Frequency

By default, UK State Pension is paid every 28 days (4 weeks). Alternative payment frequencies (such as every 14 days or every 7 days) may be arranged by contacting the Pension Service. Pensioners living outside the UK may choose to be paid every 13 weeks.

Note: official GOV\.UK guidance documents the 28-day cycle; other cycles may depend on individual arrangements.

### The boring details

#### 28-day (4-week, the default) rule

- For the **28-day** cycle, the app uses the NI suffix letter (A–D) as a **phase** (which week within the repeating 4-week pattern), and the last two digits to choose your normal weekday.
- **Payment weekday** comes from the last two digits: 00–19 Mon, 20–39 Tue, 40–59 Wed, 60–79 Thu, 80–99 Fri.
- **Phase (A–D)** shifts the schedule in one-week steps (A, B, C, D).
- Payments then repeat every 28 days. Bank-holiday payments are paid early (previous working day).

#### Weekly (7-day) rule
- For the **7-day** cycle, the app uses the same NI-based weekday/phase mapping as the 28-day schedule, but repeats every 7 days.
- Your normal weekday comes from the last two digits (00–19 Mon … 80–99 Fri).
- Payments repeat every 7 days, with bank-holiday payments paid early.

- Fortnightly (14-day) rule
- For the **14-day** cycle, payments run on a two-week rhythm (Week 1 / Week 2). The app applies these confirmed rules (anchored to January 2026)
- **Week 1 vs Week 2** is based on the parity (odd/even) of the final digit of the NI number: even → Week 1, odd → Week 2.
- **Payment weekday** comes from the last two digits: 00–19 Mon, 20–39 Tue, 40–59 Wed, 60–79 Thu, 80–99 Fri.
- Payments then repeat every 14 days. Bank-holiday payments are paid early (previous working day).
- The NI suffix letter (A–D) is **ignored** for this cycle.

#### 13-week (91-day) rule
- For the **91-day** cycle (used for some overseas payments), the app again uses the same NI-based weekday/phase mapping, but repeats every 91 days.
- Your normal weekday comes from the last two digits (00–19 Mon … 80–99 Fri).
- The suffix letter (A–D) affects the phase.
- Payments repeat every 91 days, with bank-holiday payments paid early.*


## Date range

Choose the start and end year you want to include. Only payment dates within that range are shown. If your calculated first payment after SPA falls outside the selected years, the app will expand the range to include it.

### Early payments

Payments are not made on UK bank holidays. If a payment date would fall on one, it is usually paid earlier.

Where available, the reason for an early payment is shown in the calendar and included in exports.

## Payment calendar

This tool calculates your UK State Pension payment dates based on a repeating payment cycle and UK bank holidays.

- The calendar updates automatically once the inputs are valid.
- Pension payment days are shown in with a coloured background. 
- If a payment is paid early due to a bank holiday a different colour is user (see the calender legend for colour details)
- Weekends and bank holidays are also shown on the calender
- The earliest month shown is the first payment after you reach state pension age (SPA).
- Payment dates are calculated based on a repeating payment cycle (normally every 28 days).
- Your normal payment weekday is determined from your NI code (the last 3 characters of your National Insurance number).
- Payments that would fall on a UK bank holiday are adjusted so they are paid earlier.


## Exports and printing

Use **Export** to download:

- **CSV** (spreadsheet data) for Excel/Google Sheets etc.
- **ICS** (calendar file) to import into Apple/Google/Outlook calendars.

Note: calendar apps differ. Category/colour in an ICS file may be ignored (Google Calendar often ignores event colour from ICS imports).

Use **Print** to print the calendar. Print output is optimised for paper.

## Disclaimer

This is an unofficial calculator. **It is not affiliated with, endorsed by, or connected to DWP, HMRC, or GOV\.UK**.

Dates and calculations are based on publicly available information (for example, published pension schedules, the State Pension age timetable, UK and bank holiday lists) and may change.

No warranty is provided. Use at your own risk and always check official sources if you need a definitive answer.

