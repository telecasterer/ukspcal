
// --- Types for UK bank holiday data ---

// Map of ISO date string to holiday name
export type BankHolidayMap = Record<string, string>;

// Structure of the Gov.UK bank holidays API response
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
