import type { OdometerSummary } from '@/features/cars/types';
import { addDays, daysBetween, parseISODate, toISODate } from '@/shared/utils/date';
import { cmpText } from '@/shared/utils/compare';

/**
 * Km estimado: "según tu ritmo, tu carro debe ir por ~52.800". Solo con lecturas REALES
 * del tablero; nunca reemplaza al km registrado ni cambia estados (es una referencia).
 * Sin datos suficientes no se estima ("Sin suficiente información").
 */

/** Mínimo de días entre la primera y la última lectura para calcular un ritmo. */
export const ESTIMATE_MIN_SPAN_DAYS = 7;
/** El ritmo se toma de los últimos 3 meses (si en diciembre recorres más, lo aprende). */
export const ESTIMATE_WINDOW_DAYS = 90;
/** Más de 2 meses sin lectura: ya no se calcula, se pregunta. */
export const ESTIMATE_MAX_DAYS_AHEAD = 60;

export type Reading = { date: string; km: number };

export function estimateOdometer(
  readings: Reading[],
  registeredKm: number,
  lastReadingDate: string,
  today: Date,
): OdometerSummary['estimate'] {
  const insufficient = { kind: 'insufficient' } as const;
  const last = parseISODate(lastReadingDate);
  const daysAhead = daysBetween(last, today);
  if (daysAhead > ESTIMATE_MAX_DAYS_AHEAD) return insufficient;

  // Solo lecturas coherentes con la última (anteriores y no mayores).
  const valid = readings
    .filter((r) => r.date < lastReadingDate && r.km <= registeredKm)
    .sort((a, b) => cmpText(a.date, b.date));
  if (valid.length === 0) return insufficient;

  const windowStart = toISODate(addDays(last, -ESTIMATE_WINDOW_DAYS));
  // La más antigua dentro de la ventana; si no hay, la más reciente antes de ella.
  const first = valid.find((r) => r.date >= windowStart) ?? valid[valid.length - 1];
  const span = daysBetween(parseISODate(first.date), last);
  if (span < ESTIMATE_MIN_SPAN_DAYS) return insufficient;

  const perDay = (registeredKm - first.km) / span;
  if (!Number.isFinite(perDay) || perDay < 0) return insufficient;
  return {
    kind: 'available',
    km: registeredKm + Math.round(perDay * Math.max(0, daysAhead)),
    kmPerDay: Math.round(perDay),
  };
}
