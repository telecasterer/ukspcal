import { fetchUKBankHolidays } from "$lib/fetchBankHolidays";

export const load = async ({ fetch }) => {
    const bankHolidays = await fetchUKBankHolidays(fetch);
    return { bankHolidays };
};
