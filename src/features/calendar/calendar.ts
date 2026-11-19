import { colombianHolidays } from '@/features/colombia/holidays';
import { currentRainSeason } from '@/features/colombia/rainSeasons';
import type { DocumentSummary } from '@/features/cars/types';
import { costDateOf } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import { dueDayIn, recurringLabel, type RecurringExpense } from '@/features/recurring/rules';
import { toISODate } from '@/shared/utils/date';

/**
 * Calendario de Historial: por cada día, lo que hiciste (registros), lo que vence (documentos),
 * lo que pagas (gastos que se repiten y la cuota del crédito) y los festivos. Solo datos reales:
 * nada se inventa. Función pura (la pantalla la memoriza por mes).
 */
export type CalendarEventKind = 'done' | 'due' | 'payment' | 'holiday';

export type CalendarEvent = { kind: CalendarEventKind; title: string };

export type CalendarDay = { date: string; day: number; inMonth: boolean; events: CalendarEvent[] };

export const EVENT_LABEL: Record<CalendarEventKind, string> = {
  done: 'Lo que hiciste',
  due: 'Vencimientos',
  payment: 'Pagos',
  holiday: 'Festivos',
};

export type CalendarInput = {
  history: HistoryEntry[];
  documents: DocumentSummary[];
  recurring: RecurringExpense[];
  /** Título de cada registro ("Cambio de aceite"). */
  describe: (entry: HistoryEntry) => string;
};

/** Eventos de cada día del mes (clave "AAAA-MM-DD"). */
export function monthEvents(year: number, month0: number, input: CalendarInput): Map<string, CalendarEvent[]> {
  const prefix = toISODate(new Date(year, month0, 1)).slice(0, 7);
  const map = new Map<string, CalendarEvent[]>();
  const add = (date: string, event: CalendarEvent) => {
    if (!date.startsWith(prefix)) return;
    const list = map.get(date);
    if (list) list.push(event);
    else map.set(date, [event]);
  };
  for (const e of input.history) add(costDateOf(e), { kind: 'done', title: input.describe(e) });
  for (const d of input.documents) if (d.alertDate) add(d.alertDate, { kind: 'due', title: `${d.title}: vence` });
  for (const r of input.recurring) {
    if (r.paused) continue;
    const date = toISODate(new Date(year, month0, dueDayIn(r, year, month0)));
    if (date >= r.createdAt.slice(0, 7)) add(date, { kind: 'payment', title: recurringLabel(r) });
  }
  for (const h of colombianHolidays(year)) add(h.date, { kind: 'holiday', title: `Festivo: ${h.name}` });
  return map;
}

/** La cuadrícula del mes (semanas de lunes a domingo, con días del mes anterior y siguiente). */
export function monthGrid(year: number, month0: number, events: Map<string, CalendarEvent[]>): CalendarDay[] {
  const first = new Date(year, month0, 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const date = new Date(year, month0, i - offset + 1);
    const iso = toISODate(date);
    return { date: iso, day: date.getDate(), inMonth: date.getMonth() === month0, events: events.get(iso) ?? [] };
  });
}

/** "Temporada de lluvias (aproximada)" si el mes la toca (IDEAM, donde hay fechas confirmadas). */
export function monthRainNote(year: number, month0: number, departmentCode: string | undefined): string | undefined {
  const middle = new Date(year, month0, 15);
  const season = currentRainSeason(middle, departmentCode);
  return season ? `Este mes hay ${season.label} (aproximada, según el IDEAM).` : undefined;
}
