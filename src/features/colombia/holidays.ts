import { addDays, toISODate } from '@/shared/utils/date';
import { cmpText } from '@/shared/utils/compare';

/**
 * Festivos de Colombia, CALCULADOS por la ley (no una lista escrita a mano), para cualquier año:
 * - Fijos: 1 ene, 1 may, 20 jul, 7 ago, 8 dic y 25 dic.
 * - Ley Emiliani (Ley 51 de 1983): se corren al lunes siguiente si no caen en lunes: Reyes
 *   (6 ene), San José (19 mar), San Pedro y San Pablo (29 jun), Asunción (15 ago), Día de la
 *   Raza (12 oct), Todos los Santos (1 nov) e Independencia de Cartagena (11 nov).
 * - Según la Pascua: Jueves y Viernes Santo; Ascensión, Corpus Christi y Sagrado Corazón (el
 *   lunes que les corresponde).
 * - Desde 2026: Virgen de Chiquinquirá (9 de julio, al lunes por la Ley Emiliani), Ley 2578 del
 *   1 de junio de 2026 (Ministerio del Interior). En 2026 el descanso fue el lunes 13 de julio.
 * ACTUALIZAR si una ley crea, quita o cambia un festivo.
 */
export type Holiday = { date: string; name: string };

/** Domingo de Pascua (algoritmo de Gauss para el calendario gregoriano). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** El mismo día si es lunes; si no, el lunes siguiente. */
const toMonday = (date: Date) => addDays(date, (8 - date.getDay()) % 7);

/** Festivos del año, en orden. */
export function colombianHolidays(year: number): Holiday[] {
  const day = (month: number, d: number) => new Date(year, month - 1, d);
  const easter = easterSunday(year);
  const list: [Date, string][] = [
    [day(1, 1), 'Año Nuevo'],
    [toMonday(day(1, 6)), 'Reyes Magos'],
    [toMonday(day(3, 19)), 'San José'],
    [addDays(easter, -3), 'Jueves Santo'],
    [addDays(easter, -2), 'Viernes Santo'],
    [day(5, 1), 'Día del Trabajo'],
    [toMonday(addDays(easter, 39)), 'Ascensión del Señor'],
    [toMonday(addDays(easter, 60)), 'Corpus Christi'],
    [toMonday(addDays(easter, 68)), 'Sagrado Corazón'],
    [toMonday(day(6, 29)), 'San Pedro y San Pablo'],
    [day(7, 20), 'Día de la Independencia'],
    [day(8, 7), 'Batalla de Boyacá'],
    [toMonday(day(8, 15)), 'Asunción de la Virgen'],
    [toMonday(day(10, 12)), 'Día de la Raza'],
    [toMonday(day(11, 1)), 'Todos los Santos'],
    [toMonday(day(11, 11)), 'Independencia de Cartagena'],
    [day(12, 8), 'Inmaculada Concepción'],
    [day(12, 25), 'Navidad'],
  ];
  if (year >= 2026) list.push([toMonday(day(7, 9)), 'Virgen de Chiquinquirá']);
  return list.map(([date, name]) => ({ date: toISODate(date), name })).sort((x, y) => cmpText(x.date, y.date));
}

/** ¿Es festivo? (ISO "2026-11-16"). */
export function isHoliday(iso: string): boolean {
  return colombianHolidays(Number(iso.slice(0, 4))).some((h) => h.date === iso);
}

/** Un puente: fin de semana largo de 3 días (o Semana Santa, de jueves a domingo). */
export type LongWeekend = { start: string; end: string; name: string; days: number };

/** Puentes del año: festivo en lunes (sáb–lun), en viernes (vie–dom) y Semana Santa. */
export function longWeekends(year: number): LongWeekend[] {
  const out: LongWeekend[] = [];
  for (const h of colombianHolidays(year)) {
    const [y, m, d] = h.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (h.name === 'Viernes Santo') continue; // va con el Jueves Santo
    if (h.name === 'Jueves Santo') {
      out.push({ start: h.date, end: toISODate(addDays(date, 3)), name: 'Semana Santa', days: 4 });
    } else if (date.getDay() === 1) {
      out.push({ start: toISODate(addDays(date, -2)), end: h.date, name: h.name, days: 3 });
    } else if (date.getDay() === 5) {
      out.push({ start: h.date, end: toISODate(addDays(date, 2)), name: h.name, days: 3 });
    }
  }
  return out;
}

/** El próximo puente que aún no empieza (este año o el siguiente). */
export function nextLongWeekend(today: Date): LongWeekend | undefined {
  const iso = toISODate(today);
  const year = today.getFullYear();
  return [...longWeekends(year), ...longWeekends(year + 1)].find((w) => w.start > iso);
}

/** Avisos del celular: 3 días antes de cada puente (los próximos 2), para la revisión de viaje. */
export const LONG_WEEKEND_NOTICE_DAYS = 3;

export function upcomingLongWeekends(today: Date, count = 2): LongWeekend[] {
  const iso = toISODate(today);
  const year = today.getFullYear();
  return [...longWeekends(year), ...longWeekends(year + 1)].filter((w) => w.start > iso).slice(0, count);
}
