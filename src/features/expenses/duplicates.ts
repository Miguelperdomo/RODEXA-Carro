import { costDateOf, entryCost } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import { categoryOf } from '@/features/stats/compute';
import { daysBetween, parseISODate } from '@/shared/utils/date';

/** Días de diferencia para sospechar que un pago ya se registró. */
export const DUPLICATE_WINDOW_DAYS = 7;

export type PaymentCandidate = {
  /** Categoría de gasto (soat, rtm, tax, insurance…). */
  category: string;
  amountCop: number;
  /** Fecha ISO en que cuenta el pago. */
  date: string;
  /** Registro que se está corrigiendo (no se compara consigo mismo). */
  excludeId?: string;
};

/**
 * ¿Hay ya un pago de la misma categoría, el mismo valor y a ≤ 7 días? Solo sirve para
 * ADVERTIR ("Parece que ya registraste este pago"): nunca se borra ni se fusiona nada.
 */
export function findPossibleDuplicatePayment(
  entries: HistoryEntry[],
  { category, amountCop, date, excludeId }: PaymentCandidate,
): HistoryEntry | undefined {
  if (!(amountCop > 0)) return undefined;
  const target = parseISODate(date);
  return entries.find(
    (entry) =>
      entry.id !== excludeId &&
      entryCost(entry) === amountCop &&
      categoryOf(entry) === category &&
      Math.abs(daysBetween(parseISODate(costDateOf(entry)), target)) <= DUPLICATE_WINDOW_DAYS,
  );
}
