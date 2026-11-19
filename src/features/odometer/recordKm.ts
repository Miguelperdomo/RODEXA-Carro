import type { HistoryEntry } from '@/features/history/types';
import { formatKm } from '@/shared/utils/format';

/**
 * Kilometraje de un registro (mantenimiento, tanqueo…):
 * - número → kilometraje conocido, escrito o confirmado por el usuario;
 * - `null` → DESCONOCIDO: el usuario marcó "No sé el kilometraje".
 *
 * `null` nunca significa 0 ni "el km actual": RODEXA no inventa kilometrajes
 * históricos. Los cálculos que dependen del km ignoran estos registros.
 * En SQLite: `odometer_km INTEGER NULL`.
 */
export type RecordKm = number | null;

export function isKnownKm(km: RecordKm): km is number {
  return km !== null;
}

/** Tipos de registro que llevan kilometraje del tablero. */
const KM_KINDS: ReadonlySet<HistoryEntry['kind']> = new Set(['odometer', 'maintenance', 'fuel', 'cng', 'charge']);

/** Lectura del tablero que aporta un registro (null si no tiene km o es desconocido). */
export function odometerReadingOf(entry: HistoryEntry): { date: string; km: number } | null {
  if (!KM_KINDS.has(entry.kind) || !('km' in entry) || !isKnownKm(entry.km)) return null;
  return { date: entry.date, km: entry.km };
}

/** Texto para mostrar el km de un registro, diferenciando el desconocido. */
export function formatRecordKm(km: RecordKm): string {
  return isKnownKm(km) ? formatKm(km) : 'Km desconocido';
}

/**
 * La lectura conocida más reciente (por fecha y, si coinciden, por km).
 * Los registros con km desconocido nunca la reemplazan.
 */
export function lastKnownReading<T extends { date: string; km: RecordKm }>(
  readings: T[],
): (T & { km: number }) | undefined {
  let last: (T & { km: number }) | undefined;
  for (const r of readings) {
    if (!isKnownKm(r.km)) continue;
    if (!last || r.date > last.date || (r.date === last.date && r.km > last.km)) {
      last = r as T & { km: number };
    }
  }
  return last;
}
