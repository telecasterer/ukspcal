export type SpaResult = {
    spaDate: string; // ISO yyyy-mm-dd
    spaAgeYears: number;
    spaAgeMonths: number;
    source: "fixed" | "offset" | "birthday";
};

type Rule =
    | {
          start: string;
          end: string;
          type: "fixed";
          spaDate: string;
      }
    | {
          start: string;
          end: string;
          type: "offset";
          years: number;
          months: number;
      }
    | {
          start: string;
          end: string;
          type: "birthday";
          years: number;
      };

function isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseIsoDate(value: string): Date {
    // Interpreted as UTC midnight to avoid TZ drift.
    const d = new Date(value + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
    return d;
}

function formatIsoDateUTC(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function daysInMonthUTC(year: number, month0: number): number {
    // month0 is 0-based
    return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

function addYearsMonthsClampedUTC(dob: Date, years: number, months: number): Date {
    const y = dob.getUTCFullYear();
    const m = dob.getUTCMonth();
    const day = dob.getUTCDate();

    const totalMonths = m + months;
    const targetYear = y + years + Math.floor(totalMonths / 12);
    const targetMonth = ((totalMonths % 12) + 12) % 12;

    const dim = daysInMonthUTC(targetYear, targetMonth);
    const clampedDay = Math.min(day, dim);

    return new Date(Date.UTC(targetYear, targetMonth, clampedDay));
}

function inRange(iso: string, start: string, end: string): boolean {
    return iso >= start && iso <= end;
}

// Source: DWP “State Pension age timetable” (GOV.UK), updated 15 May 2014.
// https://www.gov.uk/government/publications/state-pension-age-timetable/state-pension-age-timetable
const RULES: Rule[] = [
    // Table 3 (selected): 65 → 66 transition (fixed SPA dates)
    { start: "1953-12-06", end: "1954-01-05", type: "fixed", spaDate: "2019-03-06" },
    { start: "1954-01-06", end: "1954-02-05", type: "fixed", spaDate: "2019-05-06" },
    { start: "1954-02-06", end: "1954-03-05", type: "fixed", spaDate: "2019-07-06" },
    { start: "1954-03-06", end: "1954-04-05", type: "fixed", spaDate: "2019-09-06" },
    { start: "1954-04-06", end: "1954-05-05", type: "fixed", spaDate: "2019-11-06" },
    { start: "1954-05-06", end: "1954-06-05", type: "fixed", spaDate: "2020-01-06" },
    { start: "1954-06-06", end: "1954-07-05", type: "fixed", spaDate: "2020-03-06" },
    { start: "1954-07-06", end: "1954-08-05", type: "fixed", spaDate: "2020-05-06" },
    { start: "1954-08-06", end: "1954-09-05", type: "fixed", spaDate: "2020-07-06" },
    { start: "1954-09-06", end: "1954-10-05", type: "fixed", spaDate: "2020-09-06" },

    // 66th birthday
    { start: "1954-10-06", end: "1960-04-05", type: "birthday", years: 66 },

    // Table 4: 66 → 67 transition (age offsets)
    { start: "1960-04-06", end: "1960-05-05", type: "offset", years: 66, months: 1 },
    { start: "1960-05-06", end: "1960-06-05", type: "offset", years: 66, months: 2 },
    { start: "1960-06-06", end: "1960-07-05", type: "offset", years: 66, months: 3 },
    { start: "1960-07-06", end: "1960-08-05", type: "offset", years: 66, months: 4 },
    { start: "1960-08-06", end: "1960-09-05", type: "offset", years: 66, months: 5 },
    { start: "1960-09-06", end: "1960-10-05", type: "offset", years: 66, months: 6 },
    { start: "1960-10-06", end: "1960-11-05", type: "offset", years: 66, months: 7 },
    { start: "1960-11-06", end: "1960-12-05", type: "offset", years: 66, months: 8 },
    { start: "1960-12-06", end: "1961-01-05", type: "offset", years: 66, months: 9 },
    { start: "1961-01-06", end: "1961-02-05", type: "offset", years: 66, months: 10 },
    { start: "1961-02-06", end: "1961-03-05", type: "offset", years: 66, months: 11 },

    // 67th birthday
    { start: "1961-03-06", end: "1977-04-05", type: "birthday", years: 67 },

    // Table 5: 67 → 68 transition (fixed SPA dates)
    { start: "1977-04-06", end: "1977-05-05", type: "fixed", spaDate: "2044-05-06" },
    { start: "1977-05-06", end: "1977-06-05", type: "fixed", spaDate: "2044-07-06" },
    { start: "1977-06-06", end: "1977-07-05", type: "fixed", spaDate: "2044-09-06" },
    { start: "1977-07-06", end: "1977-08-05", type: "fixed", spaDate: "2044-11-06" },
    { start: "1977-08-06", end: "1977-09-05", type: "fixed", spaDate: "2045-01-06" },
    { start: "1977-09-06", end: "1977-10-05", type: "fixed", spaDate: "2045-03-06" },
    { start: "1977-10-06", end: "1977-11-05", type: "fixed", spaDate: "2045-05-06" },
    { start: "1977-11-06", end: "1977-12-05", type: "fixed", spaDate: "2045-07-06" },
    { start: "1977-12-06", end: "1978-01-05", type: "fixed", spaDate: "2045-09-06" },
    { start: "1978-01-06", end: "1978-02-05", type: "fixed", spaDate: "2045-11-06" },
    { start: "1978-02-06", end: "1978-03-05", type: "fixed", spaDate: "2046-01-06" },
    { start: "1978-03-06", end: "1978-04-05", type: "fixed", spaDate: "2046-03-06" },

    // 68th birthday
    { start: "1978-04-06", end: "9999-12-31", type: "birthday", years: 68 }
];

export function calculateStatePensionAge(dobIso: string): SpaResult {
    if (!isIsoDate(dobIso)) {
        throw new Error("DOB must be in YYYY-MM-DD format");
    }

    const dob = parseIsoDate(dobIso);

    for (const rule of RULES) {
        if (!inRange(dobIso, rule.start, rule.end)) continue;

        if (rule.type === "fixed") {
            return {
                spaDate: rule.spaDate,
                spaAgeYears: 0,
                spaAgeMonths: 0,
                source: "fixed"
            };
        }

        if (rule.type === "birthday") {
            const spa = addYearsMonthsClampedUTC(dob, rule.years, 0);
            return {
                spaDate: formatIsoDateUTC(spa),
                spaAgeYears: rule.years,
                spaAgeMonths: 0,
                source: "birthday"
            };
        }

        // offset
        const spa = addYearsMonthsClampedUTC(dob, rule.years, rule.months);
        return {
            spaDate: formatIsoDateUTC(spa),
            spaAgeYears: rule.years,
            spaAgeMonths: rule.months,
            source: "offset"
        };
    }

    // Should never happen due to final catch-all rule.
    throw new Error("Unable to calculate State Pension age");
}
