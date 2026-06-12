import jalaali from "jalaali-js";

/**
 * Jalali (Shamsi) calendar layer.
 * Rule: the database speaks Gregorian/UTC; every user-facing surface speaks
 * Jalali with Persian digits. All conversion goes through this module.
 */

export interface JDate {
  jy: number;
  jm: number; // 1..12
  jd: number; // 1..31
}

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
] as const;

/** Iranian week starts Saturday (شنبه). Index 0 = Saturday … 6 = Friday. */
export const WEEKDAYS_FA = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه",
] as const;

export const WEEKDAYS_FA_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert ASCII digits in any value to Persian digits. */
export function faNum(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Convert Persian/Arabic digits back to ASCII (for parsing user input). */
export function enNum(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function toJalali(date: Date): JDate {
  const { jy, jm, jd } = jalaali.toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  return { jy, jm, jd };
}

export function fromJalali(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function jalaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function isValidJalali(jy: number, jm: number, jd: number): boolean {
  return jalaali.isValidJalaaliDate(jy, jm, jd);
}

/** Day-of-week index in the Iranian week: 0 = شنبه … 6 = جمعه. */
export function iranianWeekday(date: Date): number {
  // JS getDay(): 0 = Sunday … 6 = Saturday → shift so Saturday = 0.
  return (date.getDay() + 1) % 7;
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

export function todayJalali(): JDate {
  return toJalali(new Date());
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** «۱۴۰۵/۰۳/۲۲» */
export function formatJalaliNumeric(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseDateInput(date) : date;
  if (!d || isNaN(d.getTime())) return "—";
  const { jy, jm, jd } = toJalali(d);
  return faNum(`${jy}/${pad2(jm)}/${pad2(jd)}`);
}

/** «۲۲ خرداد ۱۴۰۵» — with weekday: «پنجشنبه ۲۲ خرداد ۱۴۰۵» */
export function formatJalaliLong(
  date: Date | string | null | undefined,
  opts: { weekday?: boolean; year?: boolean } = {},
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseDateInput(date) : date;
  if (!d || isNaN(d.getTime())) return "—";
  const { jy, jm, jd } = toJalali(d);
  const parts: string[] = [];
  if (opts.weekday) parts.push(WEEKDAYS_FA[iranianWeekday(d)]);
  parts.push(faNum(jd), JALALI_MONTHS[jm - 1]);
  if (opts.year !== false) parts.push(faNum(jy));
  return parts.join(" ");
}

/** «۱۴:۳۰» */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "—";
  return faNum(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
}

export function formatJalaliWithTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "—";
  return `${formatJalaliLong(d)} — ساعت ${formatTime(d)}`;
}

/**
 * Parse a date-ish string. Accepts ISO (`2026-06-12`, full ISO timestamps)
 * and Jalali numeric input (`1405/03/22`, with Persian or ASCII digits).
 */
export function parseDateInput(value: string): Date | null {
  const v = enNum(value.trim());
  const jalaliMatch = v.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (jalaliMatch) {
    const [, y, m, d] = jalaliMatch.map(Number) as unknown as [string, number, number, number];
    // Years ≥ 1700 are Gregorian; 1200–1599 are Jalali.
    if (y >= 1700) return new Date(y, m - 1, d);
    if (isValidJalali(y, m, d)) return fromJalali(y, m, d);
    return null;
  }
  const parsed = new Date(v);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Days from today (local midnight) to the given date. Negative = past. */
export function daysFromToday(date: Date | string): number {
  const d = typeof date === "string" ? parseDateInput(date) : date;
  if (!d) return 0;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** «امروز» / «فردا» / «۳ روز دیگر» / «دیروز» / «۵ روز پیش» */
export function relativeDayFa(date: Date | string): string {
  const diff = daysFromToday(date);
  if (diff === 0) return "امروز";
  if (diff === 1) return "فردا";
  if (diff === -1) return "دیروز";
  if (diff > 1) return `${faNum(diff)} روز دیگر`;
  return `${faNum(-diff)} روز پیش`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** ISO `YYYY-MM-DD` for date columns (local calendar date, not UTC-shifted). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Format Rials with grouping: «۲٬۵۰۰٬۰۰۰٬۰۰۰ ریال» */
export function formatRials(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `${faNum(amount.toLocaleString("en-US").replace(/,/g, "٬"))} ریال`;
}

/**
 * Build the 6×7 Jalali month grid (weeks Saturday→Friday) for calendar views.
 * Returns Gregorian `Date`s with in/out-of-month flags.
 */
export function jalaliMonthGrid(jy: number, jm: number): {
  date: Date;
  jd: number;
  inMonth: boolean;
}[] {
  const first = fromJalali(jy, jm, 1);
  const startOffset = iranianWeekday(first); // cells before day 1
  const length = jalaliMonthLength(jy, jm);
  const cells: { date: Date; jd: number; inMonth: boolean }[] = [];
  for (let i = -startOffset; cells.length < 42; i++) {
    const date = addDays(first, i);
    const j = toJalali(date);
    cells.push({ date, jd: j.jd, inMonth: i >= 0 && i < length });
  }
  return cells;
}

export function prevJalaliMonth(jy: number, jm: number): { jy: number; jm: number } {
  return jm === 1 ? { jy: jy - 1, jm: 12 } : { jy, jm: jm - 1 };
}

export function nextJalaliMonth(jy: number, jm: number): { jy: number; jm: number } {
  return jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 };
}
