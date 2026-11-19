import type { HistoryEntry } from '@/features/history/types';

import { odometerReadingOf } from './recordKm';

/**
 * "+342 km desde la última vez": la diferencia entre la lectura más reciente y la anterior
 * (solo lecturas reales del tablero). Sin dos lecturas, o si no subió, no se dice nada.
 */
export function kmSinceLast(history: HistoryEntry[]): number | undefined {
  const readings = history
    .flatMap((e) => {
      const r = odometerReadingOf(e);
      return r ? [r] : [];
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.km - a.km));
  if (readings.length < 2) return undefined;
  const [last, ...rest] = readings;
  const previous = rest.find((r) => r.km < last.km || r.date < last.date);
  if (!previous) return undefined;
  const diff = last.km - previous.km;
  return diff > 0 ? diff : undefined;
}
