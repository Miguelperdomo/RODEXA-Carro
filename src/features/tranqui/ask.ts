import { nextMaintenance } from '@/features/dashboard/nextMaintenance';
import type { AppData } from '@/features/session/types';
import { addDays, toISODate } from '@/shared/utils/date';

/**
 * Tranqui: en vez de pedir el km a cada rato, RODEXA pregunta SOLO en el momento justo.
 *
 * 1. "Tu mantenimiento podría estar cerca": según tu ritmo (km estimado) un mantenimiento ya
 *    estaría cerca, pero con tu último km registrado aún no. Ahí sí importa el km real.
 * 2. "Revisión del mes": hace 30 días o más que no registras el km. Primero pregunta
 *    "¿Usaste el carro?" para no sumar km que no recorrió.
 *
 * El estimado nunca cambia estados ni pone nada en rojo: solo decide CUÁNDO preguntar.
 */
export type TranquiAsk =
  | { kind: 'maintenance'; title: string; estimateKm: number }
  | { kind: 'monthly'; days: number };

/** Revisión del mes: desde cuántos días sin lectura. */
export const TRANQUI_MONTHLY_DAYS = 30;
/** Con una lectura muy reciente no se pregunta (ya está al día). */
export const TRANQUI_ASK_MIN_DAYS = 3;
/** "Ahora no": cuántos días sin volver a preguntar. */
export const TRANQUI_SNOOZE_DAYS = 3;
/** Hasta cuántos días adelante se busca el momento de preguntar (aviso del celular). */
const ASK_LOOKAHEAD_DAYS = 60;

type AskData = Pick<AppData, 'components' | 'history' | 'odometer'>;

/** ¿El estimado dice que algo se acerca, pero lo registrado todavía no? */
function maintenanceNear(data: AskData, estimateKm: number, today: Date) {
  const byEstimate = nextMaintenance(data.components, data.history, estimateKm, today);
  const byRegistered = nextMaintenance(data.components, data.history, data.odometer.registeredKm, today);
  if (!byEstimate || byEstimate.status === 'ok' || byRegistered?.status !== 'ok') return undefined;
  return byEstimate;
}

/** La pregunta de hoy (una sola), o nada. `snoozedUntil` = fecha ISO de "Ahora no" ('' = nunca). */
export function tranquiAsk(data: AskData, today: Date, snoozedUntil: string): TranquiAsk | undefined {
  if (snoozedUntil && snoozedUntil >= toISODate(today)) return undefined;
  const { odometer } = data;
  if (odometer.estimate.kind === 'available' && odometer.daysSinceReading >= TRANQUI_ASK_MIN_DAYS) {
    const near = maintenanceNear(data, odometer.estimate.km, today);
    if (near) return { kind: 'maintenance', title: near.component.title, estimateKm: odometer.estimate.km };
  }
  if (odometer.daysSinceReading >= TRANQUI_MONTHLY_DAYS) return { kind: 'monthly', days: odometer.daysSinceReading };
  return undefined;
}

/**
 * Para el aviso del celular: en cuántos días (desde hoy) el estimado llegaría a "se acerca"
 * un mantenimiento, y cuál. Sin ritmo conocido, o si no pasa en 60 días, nada.
 */
export function daysUntilMaintenanceAsk(data: AskData, today: Date): { days: number; title: string } | undefined {
  const { odometer } = data;
  if (odometer.estimate.kind !== 'available' || odometer.estimate.kmPerDay <= 0) return undefined;
  const perDay = odometer.estimate.kmPerDay;
  for (let days = 1; days <= ASK_LOOKAHEAD_DAYS; days += 1) {
    const sinceReading = odometer.daysSinceReading + days;
    if (sinceReading < TRANQUI_ASK_MIN_DAYS) continue;
    const km = Math.round(odometer.registeredKm + perDay * sinceReading);
    const near = maintenanceNear(data, km, addDays(today, days));
    if (near) return { days, title: near.component.title };
  }
  return undefined;
}
