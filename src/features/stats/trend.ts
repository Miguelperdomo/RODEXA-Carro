import { entryCost, costDateOf } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';

import { categoryOf, type CategoryTotal } from './compute';

/**
 * Tendencia y "Lo que notamos" de Estadísticas. Solo con lo registrado: un mes sin gastos es
 * "Sin datos" (nunca $0) y una frase solo aparece si hay datos suficientes para decirla.
 */
export type MonthBar = { monthKey: string; totalCop?: number };

const shiftMonth = (monthKey: string, delta: number) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Gasto por mes ("AAAA-MM" → total), con lo registrado. */
export function totalsByMonth(entries: HistoryEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    const cost = entryCost(e);
    if (cost <= 0) continue;
    const key = costDateOf(e).slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + cost);
  }
  return map;
}

/** Los `count` meses que terminan en `lastMonth` (del más antiguo al más reciente). */
export function monthBars(totals: Map<string, number>, lastMonth: string, count: number): MonthBar[] {
  return Array.from({ length: count }, (_, i) => {
    const monthKey = shiftMonth(lastMonth, i - count + 1);
    return { monthKey, totalCop: totals.get(monthKey) };
  });
}

/** Gasto de una categoría por mes. */
function categoryByMonth(entries: HistoryEntry[], category: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    const cost = entryCost(e);
    if (cost <= 0 || categoryOf(e) !== category) continue;
    const key = costDateOf(e).slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + cost);
  }
  return map;
}

/** Mínimo de meses anteriores con datos para comparar con "tu promedio". */
export const MIN_MONTHS_FOR_AVERAGE = 2;
/** Diferencias menores a esto no se mencionan (no son noticia). */
export const MIN_DIFF_PERCENT = 10;

/**
 * "Lo que notamos": hasta 2 frases. (1) el mes frente a tu promedio de meses anteriores y
 * (2) la categoría que más gastaste frente a su promedio. Sin datos suficientes, nada.
 */
export function monthInsights(entries: HistoryEntry[], monthKey: string, byCategory: CategoryTotal[]): string[] {
  const out: string[] = [];
  const totals = totalsByMonth(entries);
  const previous = [...totals.entries()].filter(([k]) => k < monthKey).map(([, v]) => v);
  const current = totals.get(monthKey);
  if (current !== undefined && previous.length >= MIN_MONTHS_FOR_AVERAGE) {
    const avg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const diff = Math.round(((current - avg) / avg) * 100);
    if (Math.abs(diff) >= MIN_DIFF_PERCENT) {
      out.push(`Gastaste ${Math.abs(diff)} % ${diff > 0 ? 'más' : 'menos'} que tu promedio de los meses anteriores.`);
    }
  }
  const top = byCategory[0];
  if (top) {
    const byMonth = categoryByMonth(entries, top.key);
    const prev = [...byMonth.entries()].filter(([k]) => k < monthKey).map(([, v]) => v);
    if (prev.length >= MIN_MONTHS_FOR_AVERAGE) {
      const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
      const diff = Math.round(((top.amountCop - avg) / avg) * 100);
      if (Math.abs(diff) >= MIN_DIFF_PERCENT) {
        out.push(`${top.label} fue ${Math.abs(diff)} % ${diff > 0 ? 'más' : 'menos'} que su promedio.`);
      }
    }
  }
  return out;
}
