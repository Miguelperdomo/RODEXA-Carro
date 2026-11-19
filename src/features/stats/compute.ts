import { EXPENSE_CATEGORIES } from '@/features/expenses/catalog';
import { documentExpenseCategory } from '@/features/documents/catalog';
import { costDateOf, entryCost } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import { odometerReadingOf } from '@/features/odometer/recordKm';
import type { IconName } from '@/shared/ui';
import { daysBetween, parseISODate } from '@/shared/utils/date';
import { cmpText } from '@/shared/utils/compare';

/** Categoría de gasto de los registros que no son gastos manuales. */
const ENTRY_CATEGORY: Partial<Record<HistoryEntry['kind'], string>> = {
  fuel: 'fuel',
  cng: 'cng',
  charge: 'charge',
};

/** Categoría de gasto de un registro (los documentos cuentan en la suya: SOAT, RTM, impuestos, seguros…). */
export function categoryOf(entry: HistoryEntry): string {
  if (entry.kind === 'expense') return entry.category;
  if (entry.kind === 'document') return documentExpenseCategory(entry.docType) ?? 'other';
  return ENTRY_CATEGORY[entry.kind] ?? 'maintenance';
}

/** GNC y electricidad no son categorías de gasto manual; se muestran con su nombre. */
const ENERGY_CATEGORIES: Record<string, { label: string; icon: IconName }> = {
  cng: { label: 'GNC', icon: 'fuel' },
  charge: { label: 'Electricidad', icon: 'evSystem' },
};

/** Mínimo de km recorridos en el mes para mostrar el costo por km (docs §8.7). */
export const MIN_KM_FOR_COST_PER_KM = 100;
/** La lectura anterior al mes debe estar a ≤ 7 días de su inicio para medir el mes. */
const MAX_DAYS_GAP_FOR_MONTH_START = 7;

export type CategoryTotal = {
  key: string;
  label: string;
  icon: IconName;
  amountCop: number;
  /** Porción del total del mes (0–1). */
  share: number;
};

export type MonthStats = {
  monthKey: string;
  totalCop: number;
  byCategory: CategoryTotal[];
  fuelCop: number;
  /** Combustible + GNC + electricidad (cada uno también aparece por separado en `byCategory`). */
  energyCop: number;
  maintenanceCop: number;
  /** undefined = no hay lecturas suficientes para medir el mes. */
  kmTraveled?: number;
  costPerKmCop?: number;
  dailyAverageCop: number;
};

/** "2026-09" de cada mes con gastos, del más reciente al más antiguo. */
const monthsCache = new WeakMap<HistoryEntry[], string[]>();

export function monthsWithExpenses(entries: HistoryEntry[]): string[] {
  const cached = monthsCache.get(entries);
  if (cached) return cached;
  const keys = new Set(entries.filter((e) => entryCost(e) > 0).map((e) => costDateOf(e).slice(0, 7)));
  const list = [...keys].sort().reverse();
  monthsCache.set(entries, list);
  return list;
}

/**
 * Lecturas de km: registros de kilometraje, km de los mantenimientos y de los tanqueos.
 * Los registros con km desconocido (null) no son lecturas: se ignoran.
 */
type Reading = { date: string; km: number };

/** Mismo historial → mismas lecturas: se ordenan una sola vez (antes, una vez por mes). */
const readingsCache = new WeakMap<HistoryEntry[], Reading[]>();

function readings(entries: HistoryEntry[]): Reading[] {
  const cached = readingsCache.get(entries);
  if (cached) return cached;
  const list = entries
    .flatMap((e) => {
      const reading = odometerReadingOf(e);
      return reading ? [reading] : [];
    })
    .sort((a, b) => cmpText(a.date, b.date) || a.km - b.km);
  readingsCache.set(entries, list);
  return list;
}

/**
 * Km del mes = última lectura del mes − última lectura anterior al mes (si está cerca del
 * inicio). Con `requireMonthEnd` (meses ya cerrados), la última lectura también debe estar
 * cerca del fin de mes: si no, los km de unos pocos días se dividirían entre los gastos de
 * todo el mes y el costo por km saldría inflado.
 */
export function kmInMonth(entries: HistoryEntry[], monthKey: string, requireMonthEnd = false): number | undefined {
  const all = readings(entries);
  const inMonth = all.filter((r) => r.date.startsWith(monthKey));
  const before = all.filter((r) => r.date < `${monthKey}-01`).at(-1);
  const last = inMonth.at(-1);
  if (!before || !last) return undefined;

  const gap = daysBetween(parseISODate(before.date), parseISODate(`${monthKey}-01`));
  if (gap > MAX_DAYS_GAP_FOR_MONTH_START) return undefined;
  if (requireMonthEnd) {
    const [year, month] = monthKey.split('-').map(Number);
    const monthEnd = new Date(year, month, 0);
    if (daysBetween(parseISODate(last.date), monthEnd) > MAX_DAYS_GAP_FOR_MONTH_START) return undefined;
  }
  return last.km - before.km;
}

/**
 * Km de un período [start, end) con la misma regla conservadora del mes: última lectura
 * del período − última lectura anterior (a ≤ 7 días del inicio). Sin eso → undefined.
 */
export function kmInRange(entries: HistoryEntry[], start: string, end: string): number | undefined {
  const all = readings(entries);
  const before = all.filter((r) => r.date < start).at(-1);
  const last = all.filter((r) => r.date >= start && r.date < end).at(-1);
  if (!before || !last) return undefined;
  if (daysBetween(parseISODate(before.date), parseISODate(start)) > MAX_DAYS_GAP_FOR_MONTH_START) return undefined;
  const km = last.km - before.km;
  return km >= 0 ? km : undefined;
}

export type MeasuredCostPerKm = {
  km: number;
  costCop: number;
  costPerKmCop: number;
  /** Desde qué fecha se midió (inicio del período, o la primera lectura si el carro es más nuevo). */
  fromDate: string;
};

/**
 * Costo por km de un período [start, end). Si hay una lectura a ≤ 7 días antes del inicio,
 * se mide todo el período. Si no (carro registrado hace menos tiempo), se mide desde su
 * PRIMERA lectura dentro del período y solo cuentan los gastos desde esa fecha. Con menos
 * de 100 km medibles → undefined.
 */
export function measuredCostPerKm(entries: HistoryEntry[], start: string, end: string): MeasuredCostPerKm | undefined {
  const all = readings(entries);
  const inPeriod = all.filter((r) => r.date >= start && r.date < end);
  const last = inPeriod.at(-1);
  const before = all.filter((r) => r.date < start).at(-1);
  const baseline =
    before && daysBetween(parseISODate(before.date), parseISODate(start)) <= MAX_DAYS_GAP_FOR_MONTH_START
      ? { reading: before, fromDate: start }
      : inPeriod[0]
        ? { reading: inPeriod[0], fromDate: inPeriod[0].date }
        : undefined;
  if (!baseline || !last) return undefined;
  const km = last.km - baseline.reading.km;
  if (!(km >= MIN_KM_FOR_COST_PER_KM)) return undefined;
  const costCop = entries
    .filter((e) => {
      const d = costDateOf(e);
      return d >= baseline.fromDate && d < end;
    })
    .reduce((sum, e) => sum + entryCost(e), 0);
  return { km, costCop, costPerKmCop: Math.round(costCop / km), fromDate: baseline.fromDate };
}

/** Nombre de una categoría de gasto ("Combustible", "GNC", "Mantenimiento"…). */
export function categoryLabel(key: string): string {
  const category = EXPENSE_CATEGORIES.find((c) => c.code === key) ?? ENERGY_CATEGORIES[key];
  return category?.label ?? 'Mantenimiento';
}

/**
 * Totales por categoría (una sola regla para el mes y los 12 meses). Cada energía y
 * cada documento suma en su propia categoría: nada se mezcla ni se cuenta dos veces.
 */
function categoryTotals(entries: HistoryEntry[]): {
  totals: Map<string, number>;
  totalCop: number;
  byCategory: CategoryTotal[];
} {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const cost = entryCost(entry);
    if (cost === 0) continue;
    const key = categoryOf(entry);
    totals.set(key, (totals.get(key) ?? 0) + cost);
  }
  const totalCop = [...totals.values()].reduce((sum, v) => sum + v, 0);
  const byCategory: CategoryTotal[] = [...totals.entries()]
    .map(([key, amountCop]) => {
      const category = EXPENSE_CATEGORIES.find((c) => c.code === key) ?? ENERGY_CATEGORIES[key];
      return {
        key,
        label: category?.label ?? 'Mantenimiento',
        icon: category?.icon ?? ('maintenance' as IconName),
        amountCop,
        share: totalCop > 0 ? amountCop / totalCop : 0,
      };
    })
    .sort((a, b) => b.amountCop - a.amountCop);
  return { totals, totalCop, byCategory };
}

export function computeMonthStats(
  entries: HistoryEntry[],
  monthKey: string,
  referenceDate: Date,
): MonthStats {
  const monthEntries = entries.filter((e) => costDateOf(e).startsWith(monthKey));
  const { totals, totalCop, byCategory } = categoryTotals(monthEntries);

  const [refYear, refMonth] = monthKey.split('-').map(Number);
  const monthIsOpen = referenceDate.getFullYear() === refYear && referenceDate.getMonth() + 1 === refMonth;
  const km = kmInMonth(entries, monthKey, !monthIsOpen);
  const hasKm = km !== undefined && km >= MIN_KM_FOR_COST_PER_KM;

  // Días transcurridos: el mes completo, o hasta hoy si es el mes en curso.
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth =
    referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 === month;
  const daysElapsed = isCurrentMonth ? referenceDate.getDate() : daysInMonth;

  return {
    monthKey,
    totalCop,
    byCategory,
    fuelCop: totals.get('fuel') ?? 0,
    energyCop: (totals.get('fuel') ?? 0) + (totals.get('cng') ?? 0) + (totals.get('charge') ?? 0),
    maintenanceCop: totals.get('maintenance') ?? 0,
    kmTraveled: hasKm ? km : undefined,
    costPerKmCop: hasKm ? Math.round(totalCop / km) : undefined,
    dailyAverageCop: Math.round(totalCop / Math.max(daysElapsed, 1)),
  };
}

/** Promedio mensual de los meses con gastos registrados. */
export function monthlyAverage(entries: HistoryEntry[], referenceDate: Date): number {
  const months = monthsWithExpenses(entries);
  if (months.length === 0) return 0;
  const sum = months.reduce(
    (acc, key) => acc + computeMonthStats(entries, key, referenceDate).totalCop,
    0,
  );
  return Math.round(sum / months.length);
}

/** "AAAA-MM" desplazado `delta` meses. */
function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const ROLLING_MONTHS = 12;

export type RollingYearStats = {
  /** Primer y último mes del período ("AAAA-MM"), incluido el mes en curso. */
  fromMonth: string;
  toMonth: string;
  totalCop: number;
  byCategory: CategoryTotal[];
  /** Meses del período desde el primer registro del usuario (máx. 12). */
  monthsCovered: number;
  /** Promedio mensual = total ÷ meses cubiertos (no ÷ 12 si la app se usa hace menos). */
  monthlyAverageCop?: number;
  kmTraveled?: number;
  costPerKmCop?: number;
};

/**
 * Últimos 12 meses (el mes en curso y los 11 anteriores). Pagos grandes y anuales
 * (SOAT, impuesto, póliza) se reparten mejor así que en un solo mes. Mismas reglas
 * que el mes: cada gasto cuenta una vez, en su fecha de gasto y su categoría.
 */
export function computeRollingYearStats(entries: HistoryEntry[], referenceDate: Date): RollingYearStats {
  const toMonth = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
  const fromMonth = shiftMonth(toMonth, -(ROLLING_MONTHS - 1));
  const start = `${fromMonth}-01`;
  const end = `${shiftMonth(toMonth, 1)}-01`;
  const inRange = (date: string) => date >= start && date < end;

  const { totalCop, byCategory } = categoryTotals(entries.filter((e) => inRange(costDateOf(e))));

  // Meses cubiertos: desde el primer registro del usuario dentro del período.
  const first = entries
    .map(costDateOf)
    .filter(inRange)
    .sort()[0];
  let monthsCovered = 0;
  if (first) {
    const firstKey = first.slice(0, 7);
    for (let key = firstKey; key <= toMonth; key = shiftMonth(key, 1)) monthsCovered++;
  }

  // Km y costo por km: la MISMA medida en Estadísticas, Pro e informes (measuredCostPerKm:
  // si el carro es más nuevo que el período, mide desde su primera lectura).
  const measured = measuredCostPerKm(entries, start, end);

  return {
    fromMonth,
    toMonth,
    totalCop,
    byCategory,
    monthsCovered,
    monthlyAverageCop: monthsCovered > 0 ? Math.round(totalCop / monthsCovered) : undefined,
    kmTraveled: measured?.km,
    costPerKmCop: measured?.costPerKmCop,
  };
}
