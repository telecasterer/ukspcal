// src/lib/pensionEngine.ts

export type Payment = {
    due: string;         // YYYY-MM-DD (UTC scheduled date)
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

// VERIFIED DWP GRID ANCHOR
const BASE_DATE = new Date(Date.UTC(2025, 11, 29)); // Monday 29 Dec 2025
const BASE_NI = "00A";

// Fortnightly (14-day) anchors (national cycle reference weeks)
const FORTNIGHT_WEEK_1_ANCHOR = new Date(Date.UTC(2026, 0, 5)); // Monday 5 Jan 2026
const FORTNIGHT_WEEK_2_ANCHOR = new Date(Date.UTC(2026, 0, 12)); // Monday 12 Jan 2026

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

function fortnightlyBaseDueDate(ni: string): Date {
    // Fortnightly rule summary:
    // Ignore NI suffix letter; use odd/even of the last digit to pick Week 1/2 (anchored to Jan 2026),
    // use last two digits to pick weekday (00–19 Mon ... 80–99 Fri), then repeat every 14 days.
    const { digits } = parseNI(ni);
    const lastDigit = digits % 10;
    const isEven = lastDigit % 2 === 0;
    const anchor = isEven ? FORTNIGHT_WEEK_1_ANCHOR : FORTNIGHT_WEEK_2_ANCHOR;

    // rowFromDigits() gives 0..4 which maps to Mon..Fri
    const weekdayOffsetDays = rowFromDigits(digits);
    return addDaysUTC(anchor, weekdayOffsetDays);
}


function niOffsetDays(ni: string): number {
    const base = parseNI(BASE_NI);
    const target = parseNI(ni);

    const rowOffset =
        rowFromDigits(target.digits) - rowFromDigits(base.digits);

    const colOffset =
        (target.letter.charCodeAt(0) - base.letter.charCodeAt(0)) * 7;

    return rowOffset + colOffset;
}


function adjustForNonWorkingDays(
    date: Date,
    bankHolidays: Record<string, string>
): { date: Date; early: boolean; holidays: string[] } {

    let d = new Date(date);
    const holidays: string[] = [];
    let early = false;

    while (true) {
        const iso = d.toISOString().slice(0, 10);
        const dow = d.getUTCDay();

        const isWeekend = dow === 0 || dow === 6;
        const isHoliday = !!bankHolidays[iso];

        if (!isWeekend && !isHoliday) break;

        early = true;
        if (isHoliday) holidays.push(bankHolidays[iso]);

        d.setUTCDate(d.getUTCDate() - 1);
    }

    return { date: d, early, holidays };
}


/* ------------------------------------------------------------
   MAIN ENGINE
------------------------------------------------------------ */


export function generatePayments(
    ni: string,
    startYear: number,
    endYear: number,
    cycleDays: number = 28,
    bankHolidays: Record<string, string> = {}
): PensionResult {

    if (![7, 14, 28, 91].includes(cycleDays)) {
        throw new Error(`Invalid cycleDays: ${cycleDays}`);
    }

    // Base due date depends on cycle rules.
    let d = cycleDays === 14
        ? fortnightlyBaseDueDate(ni)
        : addDaysUTC(BASE_DATE, niOffsetDays(ni));

    const startBoundary = new Date(Date.UTC(startYear, 0, 1));

    // 2️⃣ Rewind until before the start boundary
    while (d >= startBoundary) {
        d = addDaysUTC(d, -cycleDays);
    }

    // 3️⃣ Move to first payment >= startBoundary
    do {
        d = addDaysUTC(d, cycleDays);
    } while (d < startBoundary);

    const payments: Payment[] = [];

    while (d.getUTCFullYear() <= endYear) {
        const adjusted = adjustForNonWorkingDays(d, bankHolidays);
        //console.log("RAW", formatISO(d), "→ ADJ", formatISO(adjusted.date));
        payments.push({
            due: formatISO(d),
            paid: formatISO(adjusted.date),
            early: adjusted.early,
            holidays: adjusted.holidays
        });

        d = addDaysUTC(d, cycleDays);
    }

    // Derive the "normal" payment weekday for this NI/cycle.
    const normalDayBase = cycleDays === 14
        ? fortnightlyBaseDueDate(ni)
        : addDaysUTC(BASE_DATE, niOffsetDays(ni));

    const normalDay = normalDayBase.toLocaleDateString("en-GB", {
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
