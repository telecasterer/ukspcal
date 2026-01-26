import type { DateFormat } from "./dateFormatting";

export type PersistedInputs = {
	ni: string;
	dob: string;
	startYear: number;
	endYear: number;
	cycleDays: number;
	showWeekends: boolean;
	showBankHolidays: boolean;
	csvDateFormat: DateFormat;
	icsEventName: string;
	icsCategory: string;
	icsColor: string;
};

export type PersistedInputsParseOptions = {
	allowedCycleDays: ReadonlySet<number>;
	allowedDateFormats: ReadonlySet<DateFormat>;
};

export type StorageLike = {
	getItem: (key: string) => string | null;
};

export type StorageWriterLike = {
	setItem: (key: string, value: string) => void;
};

function toYear(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = Number.parseInt(value, 10);
		if (Number.isFinite(n)) return n;
	}
	return null;
}

function toInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
	if (typeof value === "string") {
		const n = Number.parseInt(value, 10);
		if (Number.isFinite(n)) return n;
	}
	return null;
}

function toBool(value: unknown): boolean | null {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		if (value.toLowerCase() === "true") return true;
		if (value.toLowerCase() === "false") return false;
	}
	return null;
}

function toLimitedString(value: unknown, maxLen: number): string | null {
	if (typeof value !== "string") return null;
	const s = value.trim();
	if (!s) return "";
	return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function toHexColor(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const s = value.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
	return null;
}

export function parsePersistedInputsObject(
	value: unknown,
	options: PersistedInputsParseOptions
): Partial<PersistedInputs> {
	if (!value || typeof value !== "object") return {};
	const parsed = value as Partial<Record<keyof PersistedInputs, unknown>>;
	const out: Partial<PersistedInputs> = {};

	if (typeof parsed.ni === "string") out.ni = parsed.ni;
	if (typeof parsed.dob === "string") out.dob = parsed.dob;

	const sy = toYear(parsed.startYear);
	if (sy !== null) out.startYear = sy;
	const ey = toYear(parsed.endYear);
	if (ey !== null) out.endYear = ey;

	const cd = toInt(parsed.cycleDays);
	if (cd !== null && options.allowedCycleDays.has(cd)) out.cycleDays = cd;

	const sw = toBool(parsed.showWeekends);
	if (sw !== null) out.showWeekends = sw;
	const sbh = toBool(parsed.showBankHolidays);
	if (sbh !== null) out.showBankHolidays = sbh;

	if (
		typeof parsed.csvDateFormat === "string" &&
		options.allowedDateFormats.has(parsed.csvDateFormat as DateFormat)
	) {
		out.csvDateFormat = parsed.csvDateFormat as DateFormat;
	}

	const eventName = toLimitedString(parsed.icsEventName, 120);
	if (eventName !== null) out.icsEventName = eventName;
	const category = toLimitedString(parsed.icsCategory, 60);
	if (category !== null) out.icsCategory = category;
	const color = toHexColor(parsed.icsColor);
	if (color !== null) out.icsColor = color;

	return out;
}

export function parsePersistedInputsJson(
	raw: string,
	options: PersistedInputsParseOptions
): Partial<PersistedInputs> {
	try {
		const parsed = JSON.parse(raw) as unknown;
		return parsePersistedInputsObject(parsed, options);
	} catch {
		return {};
	}
}

export function loadPersistedInputs(
	storage: StorageLike,
	key: string,
	options: PersistedInputsParseOptions
): Partial<PersistedInputs> {
	try {
		const raw = storage.getItem(key);
		if (!raw) return {};
		return parsePersistedInputsJson(raw, options);
	} catch {
		return {};
	}
}

export function savePersistedInputs(storage: StorageWriterLike, key: string, value: unknown): boolean {
	try {
		storage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}
