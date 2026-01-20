export type BankHolidayMap = Record<string, string>; 
export interface GovUKBankHolidayResponse {
  "england-and-wales": {
    division: string;
    events: {
      title: string;
      date: string; // YYYY-MM-DD
      notes: string;
      bunting: boolean;
    }[];
  };
}


// YYYY-MM-DD → "Holiday name"
export function flattenBankHolidays(
  byYear: Record<string, BankHolidayMap>
): BankHolidayMap {
  const flat: BankHolidayMap = {};
  Object.values(byYear).forEach(year =>
    Object.assign(flat, year)
  );
  return flat;
}
