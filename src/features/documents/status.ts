import type { StatusLevel } from '@/shared/theme';
import { daysBetween, formatDate, parseISODate } from '@/shared/utils/date';

/** "Por vencer" a partir de 30 días antes (docs/diseno-funcional.md §8.3). */
export const DOCUMENT_WARNING_DAYS = 30;

/** Estado y texto de un documento según su fecha de vencimiento. */
export function documentStatus(
  expiresAt: string | undefined,
  today: Date,
): { status: StatusLevel; detail: string } {
  if (!expiresAt) return { status: 'nodata', detail: 'Agrega la fecha de vencimiento' };

  const date = parseISODate(expiresAt);
  const days = daysBetween(today, date);
  if (days < 0) return { status: 'due', detail: `Venció el ${formatDate(date)}` };
  if (days === 0) return { status: 'soon', detail: `Vence hoy · ${formatDate(date)}` };
  if (days <= DOCUMENT_WARNING_DAYS) {
    return { status: 'soon', detail: `Vence en ${days} días · ${formatDate(date)}` };
  }
  return { status: 'ok', detail: `Vigente hasta ${formatDate(date)}` };
}
