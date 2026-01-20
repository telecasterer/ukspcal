// src/lib/pensionEngine.ts

export type Payment = {
  paid: string;        // YYYY-MM-DD (UTC)
  early: boolean;
  holidays?: string[];
};

export type PensionResult = {
  ni: string;
  normalDay: string;
  cycleDays: number;
  payments: Payment[];
};

/* ------------------------------------------------------------
   VERIFIED DWP ANCHOR
------------------------------------------------------------ */

// Known real payment:
// NI 29B → Tuesday 6 Jan 2026
const BASE_DATE = new Date(Date.UTC(2026, 0, 6));
const BASE_NI = "29B";

/* ------------------------------------------------------------
   DATE HELPERS (UTC SAFE)
------------------------------------------------------------ */

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekendUTC(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/* ------------------------------------------------------------
   NI GRID LOGIC (OFFSETS IN WEEKS)
------------------------------------------------------------ */

function parseNI(ni: string): { digits: number; letter: string } {
  const m = ni.toUpperCase().match(/^(\d{2})([A-D])$/);
  if (!m) throw new Error(`NI parsing failed: ${ni}`);
  return { digits: +m[1], letter: m[2] };
}

function rowFromDigits(d: number): number {
  if (d <= 19) return 0;
  if (d <= 39) return 1;
  if (d <= 59) return 2;
  if (d <= 79) return 3;
  return 4;
}

function niOffsetDays(ni: string): number {
  const base = parseNI(BASE_NI);
  const target = parseNI(ni);

  const rowOffset =
    (rowFromDigits(target.digits) - rowFromDigits(base.digits)) * 7;

  const colOffset =
    (target.letter.charCodeAt(0) - base.letter.charCodeAt(0)) * 7;

  return rowOffset + colOffset;
}

/* ------------------------------------------------------------
   BANK HOLIDAY ADJUSTMENT (EARLY ONLY)
------------------------------------------------------------ */

function adjustForNonWorkingDays(
  date: Date,
  bankHolidays: Record<string, string>
): { date: Date; early: boolean; holidays: string[] } {

  let d = new Date(date);
  const reasons: string[] = [];

  while (true) {
    const iso = formatISO(d);

    if (isWeekendUTC(d)) {
      reasons.push("Weekend");
      d = addDaysUTC(d, -1);
      continue;
    }

    if (bankHolidays[iso]) {
      reasons.push(bankHolidays[iso]);
      d = addDaysUTC(d, -1);
      continue;
    }

    break;
  }

  return {
    date: d,
    early: d.getTime() !== date.getTime(),
    holidays: reasons
  };
}

/* ------------------------------------------------------------
   MAIN ENGINE (LOCKED)
------------------------------------------------------------ */

export function generatePayments(
  ni: string,
  startYear: number,
  endYear: number,
  cycleDays: number = 28,
  bankHolidays: Record<string, string>
): PensionResult {

  if (![7, 14, 28].includes(cycleDays)) {
    throw new Error(`Invalid cycleDays: ${cycleDays}`);
  }

  // 1️⃣ Anchor NI to real DWP grid
  let d = addDaysUTC(BASE_DATE, niOffsetDays(ni));

  // 2️⃣ Rewind to cover requested range
  while (d.getUTCFullYear() > startYear) {
    d = addDaysUTC(d, -cycleDays);
  }

  // 3️⃣ Move forward into range
  while (d.getUTCFullYear() < startYear) {
    d = addDaysUTC(d, cycleDays);
  }

  const payments: Payment[] = [];

  // 4️⃣ Collect payments
  while (d.getUTCFullYear() <= endYear) {
    const adjusted = adjustForNonWorkingDays(d, bankHolidays);

    payments.push({
      paid: formatISO(adjusted.date),
      early: adjusted.early,
      holidays: adjusted.holidays.length ? adjusted.holidays : undefined
    });

    d = addDaysUTC(d, cycleDays);
  }

  // 5️⃣ Derive weekday name correctly
  const normalDay = addDaysUTC(BASE_DATE, niOffsetDays(ni))
    .toLocaleDateString("en-GB", {
      weekday: "long",
      timeZone: "UTC"
    });

  return {
    ni,
    normalDay,
    cycleDays,
    payments
  };
}
