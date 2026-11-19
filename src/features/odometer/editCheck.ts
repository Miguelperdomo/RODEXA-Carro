import type { HistoryEntry } from '@/features/history/types';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatKm } from '@/shared/utils/format';

import { odometerReadingOf } from './recordKm';

/**
 * Al CORREGIR un km viejo: ¿cuadra con las demás lecturas? El tablero no retrocede, así que no
 * puede ser menor que una lectura de antes ni mayor que una de después. Si no cuadra, devuelve
 * el aviso para preguntar "¿Está bien?" (no bloquea: puede que la otra esté mal).
 */
export function editedKmWarning(history: HistoryEntry[], selfId: string, dateIso: string, km: number): string | undefined {
  let before: { km: number; date: string } | undefined;
  let after: { km: number; date: string } | undefined;
  for (const e of history) {
    if (e.id === selfId) continue;
    const r = odometerReadingOf(e);
    if (!r) continue;
    if (r.date < dateIso && (!before || r.km > before.km)) before = r;
    if (r.date > dateIso && (!after || r.km < after.km)) after = r;
  }
  const when = (iso: string) => formatDate(parseISODate(iso));
  if (before && km < before.km) {
    return `Es menor que lo que anotaste el ${when(before.date)} (${formatKm(before.km)}) y el tablero no retrocede.`;
  }
  if (after && km > after.km) {
    return `Es mayor que lo que anotaste después, el ${when(after.date)} (${formatKm(after.km)}). Revisa si le sobra una cifra.`;
  }
  return undefined;
}
