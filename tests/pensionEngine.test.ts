import { describe, expect, it } from "vitest";
import { generatePayments } from "../src/lib/pensionEngine";
import type { BankHolidayMap } from "../src/lib/bankHolidays";

/* ------------------------------------------------------------
   MOCK BANK HOLIDAYS (known real dates)
------------------------------------------------------------ */
const bankHolidays: BankHolidayMap = {
  "2026-01-05": "New Year (substitute)", // Monday
  "2026-04-03": "Good Friday",
  "2026-04-06": "Easter Monday"
};

describe("generatePayments", () => {
  it("maps NI code 29B to Tuesday payments", () => {
    const result = generatePayments("29B", 2024, 2026, 28, bankHolidays);
    expect(result.normalDay).toBe("Tuesday");
    expect(result.payments[0]?.paid).toBe("2024-01-09");
  });

  it("uses the confirmed fortnightly (14-day) rule: 29B => Tue 13 Jan 2026", () => {
    const result = generatePayments("29B", 2026, 2026, 14, {});
    expect(result.normalDay).toBe("Tuesday");
    expect(result.payments[0]?.due).toBe("2026-01-13");
    expect(result.payments[0]?.paid).toBe("2026-01-13");
    expect(result.payments[1]?.due).toBe("2026-01-27");
  });

  it("ignores NI suffix letter for fortnightly (14-day) payments", () => {
    const a = generatePayments("29A", 2026, 2026, 14, {});
    const d = generatePayments("29D", 2026, 2026, 14, {});
    expect(a.normalDay).toBe(d.normalDay);
    expect(a.payments[0]?.due).toBe(d.payments[0]?.due);
    expect(a.payments[0]?.paid).toBe(d.payments[0]?.paid);
  });

  it("maps NI code 84D to Friday payments", () => {
    const result = generatePayments("84D", 2024, 2026, 28, bankHolidays);
    expect(result.normalDay).toBe("Friday");
    expect(result.payments[0]?.paid).toBe("2024-01-26");
  });

  it("moves payments earlier when due date is a bank holiday", () => {
    // Create a synthetic holiday on a due date we *know* is in the schedule,
    // then confirm it gets pulled earlier.
    const baseline = generatePayments("29B", 2026, 2026, 28, {});
    const holidayIso = baseline.payments[0]!.due;

    const withHoliday = generatePayments("29B", 2026, 2026, 28, {
      [holidayIso]: "Synthetic Holiday"
    });

    const affected = withHoliday.payments.find((p) => p.due === holidayIso);
    expect(affected).toBeDefined();
    expect(affected!.early).toBe(true);
    expect(affected!.paid < affected!.due).toBe(true);
    expect(affected!.holidays).toContain("Synthetic Holiday");
  });
});
