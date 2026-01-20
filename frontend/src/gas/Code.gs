/*************************************************
 * UK STATE PENSION PAYMENT DATES
 * Backend – Optimised & Stable
 *************************************************/

/* =================================================
   CONFIG / VERSIONING
================================================= */

const VERSION_COMMENT = "v1.21 short ni code, updated guide and tool tips";
const BASE_DATE = new Date(Date.UTC(2025, 11, 29)); // Monday 29 Dec 2025
const BANK_HOLIDAY_URL = "https://www.gov.uk/bank-holidays.json";

/* =================================================
   HTML TEMPLATE SUPPORT
================================================= */

function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}

/* =================================================
   DEPLOYMENT METADATA
================================================= */

function stampDeployment(comment) {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    VERSION: Utilities.getUuid().slice(0, 8),
    DEPLOYED_AT: new Date().toISOString(),
    COMMENT: comment || "No comment"
  });
}

function deploy_release() {
  stampDeployment(VERSION_COMMENT);
}

function getAppMetadata() {
  const props = PropertiesService.getScriptProperties();
  return {
    version: props.getProperty("VERSION") || "",
    deployedAt: props.getProperty("DEPLOYED_AT") || "",
    comment: props.getProperty("COMMENT") || ""
  };
}

/* =================================================
   NI PARSING
================================================= */

function parseNI(input) {
  if (!input) {
    throw new Error("National Insurance number is required (last 3 characters)");
  }

  const cleaned = String(input).toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/(\d{2})([A-D])$/);

  if (!match) {
    throw new Error("NI number must end with two digits and A, B, C or D");
  }

  return {
    digits: Number(match[1]),
    letter: match[2],
    ni: match[1] + match[2]
  };
}

/* =================================================
   BANK HOLIDAYS (CACHED)
================================================= */

function fetchUKBankHolidays() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("UK_BANK_HOLIDAYS");
  if (cached) {
    return JSON.parse(cached);
  }

  const response = UrlFetchApp.fetch(BANK_HOLIDAY_URL, {
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error("Failed to fetch UK bank holidays");
  }

  const json = JSON.parse(response.getContentText());
  const events = json["england-and-wales"].events;

  const byYear = {};

  events.forEach(function (e) {
    const year = Number(e.date.slice(0, 4));
    if (!byYear[year]) byYear[year] = {};

    let name = e.title;
    if (e.notes && e.notes.toLowerCase().indexOf("substitute") !== -1) {
      name = "Substitute bank holiday for " + e.title;
    }

    byYear[year][e.date] = name;
  });

  cache.put("UK_BANK_HOLIDAYS", JSON.stringify(byYear), 6 * 60 * 60); // 6 hours
  return byYear;
}

/* =================================================
   DATE HELPERS
================================================= */

function isWeekendUTC(d) {
  const w = d.getUTCDay();
  return w === 0 || w === 6;
}

/* =================================================
   PAYMENT GROUP OFFSETS
================================================= */

function rowOffsetFromDigits(d) {
  if (d <= 19) return 0;
  if (d <= 39) return 1;
  if (d <= 59) return 2;
  if (d <= 79) return 3;
  return 4;
}

function columnOffsetFromLetter(l) {
  return { A: 0, B: 1, C: 2, D: 3 }[l];
}

/* =================================================
   DATE ADJUSTMENT
================================================= */

function adjustForNonWorkingDays(scheduled, holidaysByYear) {
  let paid = new Date(scheduled);
  let early = false;
  let holidayName = null;

  while (true) {
    const iso = Utilities.formatDate(paid, "UTC", "yyyy-MM-dd");
    const year = paid.getUTCFullYear();
    const holiday =
      holidaysByYear[year] && holidaysByYear[year][iso];

    if (holiday) {
      if (!holidayName) holidayName = holiday;
      early = true;
      paid.setUTCDate(paid.getUTCDate() - 1);
      continue;
    }

    if (isWeekendUTC(paid)) {
      early = true;
      paid.setUTCDate(paid.getUTCDate() - 1);
      continue;
    }

    break;
  }

  return {
    paid: Utilities.formatDate(paid, "UTC", "yyyy-MM-dd"),
    paidDay: Utilities.formatDate(paid, "UTC", "EEEE"),
    early: early,
    holidays: holidayName ? [holidayName] : []
  };
}

/* =================================================
   MAIN CALCULATION
================================================= */

function generatePayments(ni, startYear, endYear, cycleDays) {
  cycleDays = Number(cycleDays) || 28;

  const parsed = parseNI(ni);
  const holidaysByYear = fetchUKBankHolidays();

  let d = new Date(BASE_DATE);

  d.setUTCDate(
    d.getUTCDate() +
    rowOffsetFromDigits(parsed.digits) +
    columnOffsetFromLetter(parsed.letter) * 7
  );

  const normalPaymentDay =
    Utilities.formatDate(d, "UTC", "EEEE");

  const payments = [];

  while (d.getUTCFullYear() < startYear) {
    d.setUTCDate(d.getUTCDate() + cycleDays);
  }

  while (d.getUTCFullYear() <= endYear) {
    payments.push(adjustForNonWorkingDays(d, holidaysByYear));
    d.setUTCDate(d.getUTCDate() + cycleDays);
  }

  // Flatten holidays for frontend calendar shading
  const bankHolidays = {};
  Object.keys(holidaysByYear).forEach(function (y) {
    Object.assign(bankHolidays, holidaysByYear[y]);
  });

  return {
    ni: ni,
    normalDay: normalPaymentDay,
    cycleDays: cycleDays,
    payments: payments,
    bankHolidays: bankHolidays
  };

}

/* =================================================
   ENTRY POINT
================================================= */

function doGet() {
  return HtmlService
    .createTemplateFromFile("index")
    .evaluate()
    .setTitle("UK State Pension payment dates")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
