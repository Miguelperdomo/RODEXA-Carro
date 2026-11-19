import { startOfDay } from './date';

/**
 * Lógica del calendario para saltar por año y por mes (sin botones tipo "+1 año": cada
 * documento tiene vigencias distintas y no se sugieren).
 */

/** Sin mínimo: desde 1950. */
export const CALENDAR_MIN_YEAR = 1950;
/** Sin máximo (vencimientos): hasta el año actual + 30. */
export const CALENDAR_YEARS_AHEAD = 30;
/** Años por página: 4 filas de 3. */
export const YEARS_PER_PAGE = 12;

export const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export type YearRange = { from: number; to: number };

/** Años que se pueden elegir según los límites del campo. */
export function yearRange(minDate: Date | undefined, maxDate: Date | undefined, now: Date): YearRange {
  return {
    from: minDate ? minDate.getFullYear() : CALENDAR_MIN_YEAR,
    to: maxDate ? maxDate.getFullYear() : now.getFullYear() + CALENDAR_YEARS_AHEAD,
  };
}

/** Primer año de la página de 12 que contiene `year` (2033 → 2028, página 2028–2039). */
export function yearPageStart(year: number): number {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

/** Los 12 años de la página que contiene `year`. */
export function yearPage(year: number): number[] {
  const start = yearPageStart(year);
  return Array.from({ length: YEARS_PER_PAGE }, (_, i) => start + i);
}

export const isYearInRange = (year: number, range: YearRange) => year >= range.from && year <= range.to;

/** ¿Hay algún año elegible en la página que empieza en `start`? (para activar las flechas). */
export function pageHasYears(start: number, range: YearRange): boolean {
  return start + YEARS_PER_PAGE - 1 >= range.from && start <= range.to;
}

/** Un mes es elegible si al menos uno de sus días lo es. */
export function isMonthSelectable(year: number, month: number, minDate?: Date, maxDate?: Date): boolean {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  if (maxDate && first > maxDate) return false;
  if (minDate && last < startOfDay(minDate)) return false;
  return true;
}
