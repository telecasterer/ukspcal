import type { DateFormat } from "$lib/utils/dateFormatting";

export const PERSIST_KEY = "ukspcal.inputs.v1";

export const ANDROID_PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=app.vercel.ukspcal.twa";

export const ALLOWED_CYCLE_DAYS = new Set([7, 14, 28, 91]);

/** Longest calendar range the app will generate, in years. */
export const MAX_NUMBER_OF_YEARS = 50;

/**
 * Earliest accepted date of birth. Also guards against the partial years a date
 * input emits while a year is being typed (0001, 0019, 0196, …).
 */
export const MIN_DOB_ISO = "1900-01-01";

export const ALLOWED_DATE_FORMATS = new Set<DateFormat>([
    "dd/mm/yyyy",
    "dd-mmm-yyyy",
    "yyyy-mm-dd",
    "mm/dd/yyyy",
    "ddd, d mmmm yyyy",
]);
