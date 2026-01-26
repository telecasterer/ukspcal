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
