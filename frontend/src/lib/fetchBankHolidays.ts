import type { GovUKBankHolidayResponse } from "./types/bankHolidays";

export async function fetchUKBankHolidays(): Promise<Record<string, string>> {
  const res = await fetch("https://www.gov.uk/bank-holidays.json");

  if (!res.ok) {
    throw new Error("Failed to fetch UK bank holidays");
  }

  const data = (await res.json()) as GovUKBankHolidayResponse;

  const map: Record<string, string> = {};

  for (const ev of data["england-and-wales"].events) {
    map[ev.date] = ev.title;
  }

  return map;
}