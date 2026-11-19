import { daysBetween, formatDate, parseISODate, toISODate } from '@/shared/utils/date';
import { formatKm } from '@/shared/utils/format';

/**
 * Recordatorios que crea el usuario ("Cambiar plumillas", "Revisar extintor"…), por fecha
 * o por kilometraje, una vez o repetidos. RODEXA no propone intervalos: los pone el usuario.
 */
export type CustomTrigger = { type: 'date'; date: string } | { type: 'km'; km: number };

export type CustomReminder = {
  id: string;
  title: string;
  note?: string;
  trigger: CustomTrigger;
  /** Cada cuántos meses (por fecha) o km (por kilometraje) se repite. Sin valor: una sola vez. */
  repeatEvery?: number;
  /** Fecha en que se marcó como hecho (solo los de una vez; los repetidos pasan al siguiente). */
  doneAt?: string;
  createdAt: string;
};

export const MAX_CUSTOM_REMINDERS = 30;
/** Cuándo se muestra como "próximo" (diseño de RODEXA, no un dato técnico). */
export const SOON_DAYS = 7;
export const SOON_KM = 500;
export const MAX_REPEAT_MONTHS = 120;
export const MAX_REPEAT_KM = 500_000;

export type CustomStatus = {
  level: 'due' | 'soon' | 'ok' | 'done';
  /** "Hoy", "En 5 días · 12/10/2026", "Faltan 300 km · a los 45.000 km"… */
  detail: string;
};

export function customStatus(reminder: CustomReminder, currentKm: number, today: Date): CustomStatus {
  if (reminder.doneAt) return { level: 'done', detail: `Hecho el ${formatDate(parseISODate(reminder.doneAt))}` };
  if (reminder.trigger.type === 'date') {
    const date = parseISODate(reminder.trigger.date);
    const days = daysBetween(today, date);
    const when = formatDate(date);
    if (days < 0) return { level: 'due', detail: `Era para el ${when} (hace ${-days} ${-days === 1 ? 'día' : 'días'})` };
    if (days === 0) return { level: 'due', detail: `Es para hoy · ${when}` };
    if (days <= SOON_DAYS) return { level: 'soon', detail: `En ${days} ${days === 1 ? 'día' : 'días'} · ${when}` };
    return { level: 'ok', detail: `El ${when}` };
  }
  const left = reminder.trigger.km - currentKm;
  const at = `a los ${formatKm(reminder.trigger.km)}`;
  if (left <= 0) return { level: 'due', detail: `Ya llegaste ${at}` };
  if (left <= SOON_KM) return { level: 'soon', detail: `Faltan ${formatKm(left)} · ${at}` };
  return { level: 'ok', detail: `Faltan ${formatKm(left)} · ${at}` };
}

export function repeatText(reminder: Pick<CustomReminder, 'trigger' | 'repeatEvery'>): string {
  const n = reminder.repeatEvery;
  if (!n) return 'Una sola vez';
  if (reminder.trigger.type === 'km') return `Cada ${formatKm(n)}`;
  return n === 1 ? 'Cada mes' : n === 12 ? 'Cada año' : `Cada ${n} meses`;
}

/**
 * Marcar como hecho. Repetido: pasa al siguiente (desde hoy o desde el km actual).
 * De una vez: queda como hecho.
 */
export function markDone(reminder: CustomReminder, currentKm: number, today: Date): CustomReminder {
  if (!reminder.repeatEvery) return { ...reminder, doneAt: toISODate(today) };
  const trigger: CustomTrigger =
    reminder.trigger.type === 'date'
      ? { type: 'date', date: toISODate(addMonthsClamped(today, reminder.repeatEvery)) }
      : { type: 'km', km: currentKm + reminder.repeatEvery };
  return { ...reminder, trigger, doneAt: undefined };
}

/** Hora del aviso de un recordatorio por fecha (la misma de los demás avisos del día). */
export const CUSTOM_REMINDER_HOUR = 9;
/** Cuántos recordatorios por fecha se dejan programados (el plan se rehace al abrir la app). */
export const MAX_CUSTOM_NOTIFICATIONS = 10;

/**
 * Notificaciones de los recordatorios por FECHA (los de km se ven en "Hoy": el teléfono no
 * sabe cuándo llegas a un kilometraje). A las 9:00 a. m. del día elegido; nunca en el pasado.
 */
export function customNotifications(list: CustomReminder[], now: Date) {
  return list
    .flatMap((r) => {
      if (r.doneAt || r.trigger.type !== 'date') return [];
      const fireAt = parseISODate(r.trigger.date);
      fireAt.setHours(CUSTOM_REMINDER_HOUR, 0, 0, 0);
      if (fireAt.getTime() <= now.getTime()) return [];
      return [
        {
          id: `custom-${r.id}-${r.trigger.date}`,
          category: 'custom' as const,
          title: r.title,
          body: r.note ? `Hoy: ${r.note}` : 'Es hoy, según el recordatorio que creaste.',
          fireAt,
          href: '/mi-carro/recordatorios',
        },
      ];
    })
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_CUSTOM_NOTIFICATIONS);
}

/** Suma meses sin desbordar (31 de enero + 1 mes → 28 o 29 de febrero). */
export function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

/** Activos ordenados: vencidos, próximos y después por fecha / km. */
export function sortReminders(list: CustomReminder[], currentKm: number, today: Date): CustomReminder[] {
  const rank = { due: 0, soon: 1, ok: 2, done: 3 } as const;
  return [...list].sort((a, b) => rank[customStatus(a, currentKm, today).level] - rank[customStatus(b, currentKm, today).level]);
}

export type CustomInput = {
  title: string;
  type: CustomTrigger['type'];
  date: Date | null;
  km: number | null;
  repeat: boolean;
  repeatEvery: number | null;
};
export type CustomErrors = { title?: string; date?: string; km?: string; repeatEvery?: string };

export function validateCustom(input: CustomInput, currentKm: number): CustomErrors {
  const errors: CustomErrors = {};
  if (!input.title.trim()) errors.title = 'Escribe qué te recordamos.';
  if (input.type === 'date' && !input.date) errors.date = 'Elige la fecha.';
  if (input.type === 'km') {
    if (input.km === null || !Number.isInteger(input.km) || input.km <= 0) errors.km = 'Escribe el kilometraje.';
    else if (input.km <= currentKm) errors.km = `Debe ser mayor que tu kilometraje actual (${formatKm(currentKm)}).`;
  }
  if (input.repeat) {
    const max = input.type === 'km' ? MAX_REPEAT_KM : MAX_REPEAT_MONTHS;
    if (input.repeatEvery === null || !Number.isInteger(input.repeatEvery) || input.repeatEvery <= 0 || input.repeatEvery > max) {
      errors.repeatEvery = input.type === 'km' ? 'Escribe cada cuántos km.' : 'Escribe cada cuántos meses (1 a 120).';
    }
  }
  return errors;
}

const isIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISODate(v).getTime());

/** Lectura tolerante: los elementos que no tienen la forma esperada se descartan. */
export function sanitizeCustomReminders(raw: unknown): CustomReminder[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.flatMap((v): CustomReminder[] => {
    if (typeof v !== 'object' || v === null) return [];
    const r = v as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.title !== 'string' || !r.title.trim() || !isIso(r.createdAt)) return [];
    const t = r.trigger as Record<string, unknown> | null;
    let trigger: CustomTrigger;
    if (t && t.type === 'date' && isIso(t.date)) trigger = { type: 'date', date: t.date };
    else if (t && t.type === 'km' && typeof t.km === 'number' && Number.isInteger(t.km) && t.km > 0) trigger = { type: 'km', km: t.km };
    else return [];
    const repeat = typeof r.repeatEvery === 'number' && Number.isInteger(r.repeatEvery) && r.repeatEvery > 0 ? r.repeatEvery : undefined;
    return [
      {
        id: r.id,
        title: r.title.trim(),
        trigger,
        createdAt: r.createdAt,
        ...(typeof r.note === 'string' && r.note.trim() ? { note: r.note.trim() } : {}),
        ...(repeat ? { repeatEvery: repeat } : {}),
        ...(isIso(r.doneAt) ? { doneAt: r.doneAt } : {}),
      },
    ];
  }).slice(0, MAX_CUSTOM_REMINDERS);
}
