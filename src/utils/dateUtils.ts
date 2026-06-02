import { i18n } from '../constants/i18n';

/**
 * Safely converts a date parameter (Date object or string) into a Date instance.
 */
export function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * Checks if the given date represents today.
 */
export function isToday(date: Date | string): boolean {
  const d = toDate(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Checks if the given date represents yesterday.
 */
export function isYesterday(date: Date | string): boolean {
  const d = toDate(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

/**
 * Formats date into localized string ("M月D日" for zh, "MMM DD" for others).
 */
export function formatDate(date: Date | string): string {
  const d = toDate(date);
  if (i18n.locale === 'zh') {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

/**
 * Formats time into "HH:mm".
 */
export function formatTime(date: Date | string): string {
  const d = toDate(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a Date object into SQLite-friendly "YYYY-MM-DD" string.
 */
export function formatToSqlDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets start and end date for a given month as SQLite-friendly strings (inclusive).
 * e.g., getMonthRange(new Date("2026-05-15")) -> { start: "2026-05-01", end: "2026-05-31" }
 */
export function getMonthRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: formatToSqlDate(start),
    end: formatToSqlDate(end)
  };
}

/**
 * Gets start and end date for a given year as SQLite-friendly strings (inclusive).
 * e.g., getYearRange(new Date("2026-05-15")) -> { start: "2026-01-01", end: "2026-12-31" }
 */
export function getYearRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);
  return {
    start: formatToSqlDate(start),
    end: formatToSqlDate(end)
  };
}
