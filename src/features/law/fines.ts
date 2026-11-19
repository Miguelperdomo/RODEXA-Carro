import { isHoliday } from '@/features/colombia/holidays';
import { addDays, parseISODate, toISODate } from '@/shared/utils/date';

import { DISCOUNT_RULES } from './values';

/**
 * "¿Me multaron?": el comparendo que anota la persona y la cuenta regresiva del descuento en
 * DÍAS HÁBILES (sin sábados, domingos ni festivos de Colombia). Todo queda en el celular; RODEXA
 * no se conecta con el SIMIT.
 */
export type FineKind = 'street' | 'camera';

export type FineRecord = {
  id: string;
  kind: FineKind;
  /** Fecha del comparendo (vía pública) o de la notificación (cámara). */
  date: string;
  number?: string;
  amountCop?: number;
  note?: string;
  /** "Ya la pagué" (AAAA-MM-DD). */
  paidAt?: string;
};

export const FINE_KIND_LABEL: Record<FineKind, string> = {
  street: 'En la vía (agente de tránsito)',
  camera: 'Por cámara (fotomulta)',
};

/** ¿Es día hábil? (lunes a viernes y no festivo). */
export function isBusinessDay(date: Date): boolean {
  const d = date.getDay();
  return d !== 0 && d !== 6 && !isHoliday(toISODate(date));
}

/** El día hábil número `n` contado DESPUÉS de `from` (el día de la multa no cuenta). */
export function addBusinessDays(from: Date, n: number): Date {
  let date = from;
  let count = 0;
  while (count < n) {
    date = addDays(date, 1);
    if (isBusinessDay(date)) count += 1;
  }
  return date;
}

/** Días hábiles que faltan desde hoy hasta `deadline` (incluido). 0 = es hoy; negativo = pasó. */
export function businessDaysLeft(today: Date, deadline: Date): number {
  const t = toISODate(today);
  const d = toISODate(deadline);
  if (t > d) return -1;
  let count = 0;
  let date = today;
  while (toISODate(date) < d) {
    date = addDays(date, 1);
    if (isBusinessDay(date)) count += 1;
  }
  return count;
}

export type DiscountDeadlines = { full: string; partial: string };

/** Último día para el 50 % y para el 25 % (curso de normas de tránsito incluido). */
export function discountDeadlines(fine: Pick<FineRecord, 'kind' | 'date'>): DiscountDeadlines {
  const rule = DISCOUNT_RULES[fine.kind];
  const start = parseISODate(fine.date);
  return { full: toISODate(addBusinessDays(start, rule.full)), partial: toISODate(addBusinessDays(start, rule.partial)) };
}

export type DiscountState =
  | { stage: 'paid' }
  | { stage: 'full' | 'partial'; percent: 50 | 25; deadline: string; daysLeft: number }
  | { stage: 'none' };

/** En qué descuento va hoy y cuántos días hábiles le quedan. */
export function discountState(fine: FineRecord, today: Date): DiscountState {
  if (fine.paidAt) return { stage: 'paid' };
  const d = discountDeadlines(fine);
  const iso = toISODate(today);
  if (iso <= d.full) return { stage: 'full', percent: 50, deadline: d.full, daysLeft: businessDaysLeft(today, parseISODate(d.full)) };
  if (iso <= d.partial) return { stage: 'partial', percent: 25, deadline: d.partial, daysLeft: businessDaysLeft(today, parseISODate(d.partial)) };
  return { stage: 'none' };
}

/** "Te quedan 3 días hábiles para el 50 %" / "Hoy es el último día para el 25 %". */
export function discountText(state: DiscountState): string {
  if (state.stage === 'paid') return 'Pagada';
  if (state.stage === 'none') return 'Ya no tiene descuento por pronto pago';
  if (state.daysLeft === 0) return `Hoy es el último día hábil para el ${state.percent} %`;
  return `Te ${state.daysLeft === 1 ? 'queda 1 día hábil' : `quedan ${state.daysLeft} días hábiles`} para el ${state.percent} %`;
}

/** Aviso del celular: el día hábil ANTES de que se acabe cada descuento (si no está pagada). */
export function fineReminderDates(fine: FineRecord): { date: string; percent: 50 | 25 }[] {
  if (fine.paidAt) return [];
  const d = discountDeadlines(fine);
  const before = (iso: string) => {
    let date = addDays(parseISODate(iso), -1);
    while (!isBusinessDay(date)) date = addDays(date, -1);
    return toISODate(date);
  };
  return [
    { date: before(d.full), percent: 50 },
    { date: before(d.partial), percent: 25 },
  ];
}

const isIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

/** Lectura tolerante: lo que no tiene la forma esperada se descarta. */
export function sanitizeFines(raw: unknown): FineRecord[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .flatMap((v): FineRecord[] => {
      if (typeof v !== 'object' || v === null) return [];
      const r = v as Record<string, unknown>;
      if (typeof r.id !== 'string' || (r.kind !== 'street' && r.kind !== 'camera') || !isIso(r.date)) return [];
      return [
        {
          id: r.id,
          kind: r.kind,
          date: r.date,
          ...(text(r.number, 40) ? { number: text(r.number, 40) } : {}),
          ...(typeof r.amountCop === 'number' && r.amountCop > 0 && r.amountCop < 100_000_000 ? { amountCop: r.amountCop } : {}),
          ...(text(r.note, 120) ? { note: text(r.note, 120) } : {}),
          ...(isIso(r.paidAt) ? { paidAt: r.paidAt } : {}),
        },
      ];
    })
    .slice(0, 100);
}
