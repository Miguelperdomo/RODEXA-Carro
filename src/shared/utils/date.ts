import { getFormatPreferences } from './formatPreferences';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** "2026-09-20" → Date local (sin desfase de zona horaria). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Date → "2026-09-20" */
export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function today(): Date {
  return startOfDay(new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return startOfDay(result);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Días completos entre dos fechas (b − a). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

/** 28/09/2026 */
export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  // Formato según la preferencia global (DD/MM/YYYY por defecto en Colombia).
  return getFormatPreferences().dateFormat === 'MM/DD/YYYY'
    ? `${m}/${d}/${date.getFullYear()}`
    : `${d}/${m}/${date.getFullYear()}`;
}

/** "Hoy · 28/09/2026", "Ayer · 27/09/2026" o "25/09/2026" */
export function formatDateWithRelative(date: Date): string {
  const diff = daysBetween(date, today());
  if (diff === 0) return `Hoy · ${formatDate(date)}`;
  if (diff === 1) return `Ayer · ${formatDate(date)}`;
  return formatDate(date);
}

/** "septiembre 2026" */
export function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "Martes 6 de octubre" (sin año: para el día de hoy). */
export function formatWeekdayDate(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** "28 de septiembre de 2026" */
export function formatLongDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}
