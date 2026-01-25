import type { BankHolidayMap, GovUKBankHolidayResponse } from "./bankHolidays";

export async function fetchUKBankHolidays(fetchFn: typeof fetch = fetch): Promise<BankHolidayMap> {
  try {
    const res = await fetchFn("https://www.gov.uk/bank-holidays.json");
    if (!res.ok) {
      throw new Error(`Failed to fetch UK bank holidays: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as GovUKBankHolidayResponse;
    const map: BankHolidayMap = {};
    for (const ev of data["england-and-wales"].events) {
      map[ev.date] = ev.title;
    }
    return map;
  } catch (err) {
    console.error("Error fetching UK bank holidays:", err);
    // Fallback: return empty or mock data
    return {
      "2026-01-01": "New Year's Day (Fallback)",
      "2026-12-25": "Christmas Day (Fallback)"
    };
  }
}