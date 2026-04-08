import type { DateFormat } from "$lib/utils/dateFormatting";

export const PERSIST_KEY = "ukspcal.inputs.v1";

export const ANDROID_PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=app.vercel.ukspcal.twa";

export const ALLOWED_CYCLE_DAYS = new Set([7, 14, 28, 91]);

export const ALLOWED_DATE_FORMATS = new Set<DateFormat>([
    "dd/mm/yyyy",
    "dd-mmm-yyyy",
    "yyyy-mm-dd",
    "mm/dd/yyyy",
    "ddd, d mmmm yyyy",
]);
