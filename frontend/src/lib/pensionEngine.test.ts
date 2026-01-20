import { generatePayments } from "./pensionEngine";
import type { BankHolidayMap } from "./fetchBankHolidays";

/* ------------------------------------------------------------
   MOCK BANK HOLIDAYS (known real dates)
------------------------------------------------------------ */
const bankHolidays: BankHolidayMap = {
  "2026-01-05": "New Year (substitute)", // Monday
  "2026-04-03": "Good Friday",
  "2026-04-06": "Easter Monday"
};

/* ------------------------------------------------------------
   TEST CASES
------------------------------------------------------------ */
const tests = [
  {
    name: "29B – Tuesday payments",
    ni: "29B",
    startYear: 2024,
    endYear: 2026,
    expectedWeekday: "Tuesday",
    firstPayment2024: "2024-01-02"
  },
  {
    name: "84D – Friday payments",
    ni: "84D",
    startYear: 2024,
    endYear: 2026,
    expectedWeekday: "Friday",
    firstPayment2024: "2024-01-05"
  }
];

/* ------------------------------------------------------------
   RUN TESTS
------------------------------------------------------------ */
for (const t of tests) {
  const result = generatePayments(
    t.ni,
    t.startYear,
    t.endYear,
    28,
    bankHolidays
  );

  console.group(t.name);

  console.log("Normal day:", result.normalDay);
  console.log("First payment:", result.payments[0]?.paid);

  if (result.normalDay !== t.expectedWeekday) {
    console.error(
      `❌ Weekday mismatch: expected ${t.expectedWeekday}`
    );
  } else {
    console.log("✅ Weekday OK");
  }

  if (result.payments[0]?.paid !== t.firstPayment2024) {
    console.error(
      `❌ First payment wrong: expected ${t.firstPayment2024}`
    );
  } else {
    console.log("✅ First payment OK");
  }

  console.groupEnd();
}
