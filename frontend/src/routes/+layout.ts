
import { fetchUKBankHolidays } from "$lib/fetchBankHolidays";

export const load = async () => {
  const bankHolidays = await fetchUKBankHolidays();
  return { bankHolidays };
};
