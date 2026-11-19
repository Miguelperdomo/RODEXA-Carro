import { energyRecordKinds } from '@/features/cars/energy';
import type { CarProfile } from '@/features/cars/types';
import {
  computeEnergyMonthStats,
  consumptionPairs,
  energyRecords,
  summarizeConsumption,
  type ConsumptionResult,
} from '@/features/energy/compute';
import { baseQuantity, unitPrice } from '@/features/energy/units';
import { costDateOf, entryCost } from '@/features/history/presentation';
import type { EnergyKind, HistoryEntry } from '@/features/history/types';
import { kmInRange, MIN_KM_FOR_COST_PER_KM } from '@/features/stats/compute';
import type { IconName } from '@/shared/ui';
import { cmpText } from '@/shared/utils/compare';

/**
 * Análisis de RODEXA Pro. Todo sale de lo que registró el usuario, con las mismas
 * reglas de Estadísticas: cada gasto cuenta una vez, en su fecha de gasto. Lo que no
 * se puede medir queda `undefined` (nunca 0, NaN ni Infinity) y la pantalla dice
 * "Datos insuficientes".
 */

// ── Categorías ───────────────────────────────────────────────────────────────

export type ProCategoryKey =
  | 'fuel'
  | 'cng'
  | 'charge'
  | 'maintenance'
  | 'parts'
  | 'soat'
  | 'rtm'
  | 'policy'
  | 'tax'
  | 'other_documents'
  | 'other';

export const PRO_CATEGORIES: Record<ProCategoryKey, { label: string; icon: IconName }> = {
  fuel: { label: 'Combustible', icon: 'fuel' },
  cng: { label: 'GNC', icon: 'fuel' },
  charge: { label: 'Carga eléctrica', icon: 'evSystem' },
  maintenance: { label: 'Mantenimiento', icon: 'maintenance' },
  parts: { label: 'Repuestos', icon: 'parts' },
  soat: { label: 'SOAT', icon: 'insurance' },
  rtm: { label: 'Tecnomecánica', icon: 'inspection' },
  policy: { label: 'Póliza', icon: 'insurance' },
  tax: { label: 'Impuesto', icon: 'tax' },
  other_documents: { label: 'Otros documentos', icon: 'document' },
  other: { label: 'Otros gastos', icon: 'more' },
};

const EXPENSE_TO_PRO: Partial<Record<string, ProCategoryKey>> = {
  fuel: 'fuel',
  parts: 'parts',
  soat: 'soat',
  rtm: 'rtm',
  insurance: 'policy',
  tax: 'tax',
};

const DOCUMENT_TO_PRO: Partial<Record<string, ProCategoryKey>> = {
  soat: 'soat',
  rtm: 'rtm',
  policy: 'policy',
  tax: 'tax',
};

/** Categoría Pro de un registro (lavado, parqueadero, multas, accesorios → "Otros gastos"). */
export function proCategoryOf(entry: HistoryEntry): ProCategoryKey {
  switch (entry.kind) {
    case 'fuel':
    case 'cng':
    case 'charge':
      return entry.kind;
    case 'maintenance':
      return 'maintenance';
    case 'expense':
      return EXPENSE_TO_PRO[entry.category] ?? 'other';
    case 'document':
      return DOCUMENT_TO_PRO[entry.docType] ?? 'other_documents';
    default:
      return 'other';
  }
}

export type ProCategoryTotal = {
  key: ProCategoryKey;
  label: string;
  icon: IconName;
  amountCop: number;
  /** Porción del total (0–1). */
  share: number;
};

/** Totales por categoría Pro; solo las que tienen gasto, de mayor a menor. */
export function proCategoryTotals(entries: HistoryEntry[]): ProCategoryTotal[] {
  const totals = new Map<ProCategoryKey, number>();
  for (const entry of entries) {
    const cost = entryCost(entry);
    if (!(cost > 0)) continue;
    const key = proCategoryOf(entry);
    totals.set(key, (totals.get(key) ?? 0) + cost);
  }
  const total = [...totals.values()].reduce((sum, v) => sum + v, 0);
  return [...totals.entries()]
    .map(([key, amountCop]) => ({ key, ...PRO_CATEGORIES[key], amountCop, share: total > 0 ? amountCop / total : 0 }))
    .sort((a, b) => b.amountCop - a.amountCop);
}

// ── Meses ────────────────────────────────────────────────────────────────────

/** "AAAA-MM" de una fecha. */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** "AAAA-MM" desplazado `delta` meses. */
export function addMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return monthKeyOf(d);
}

const monthStart = (monthKey: string) => `${monthKey}-01`;

/** Meses desde `from` hasta `to` (incluidos). */
function monthRange(from: string, to: string): string[] {
  const keys: string[] = [];
  for (let key = from; key <= to; key = addMonthKey(key, 1)) keys.push(key);
  return keys;
}

const roundOrUndefined = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) ? Math.round(value) : undefined;

/** Costo por km solo con km suficientes (misma regla de Estadísticas). */
function costPerKmOf(totalCop: number, km: number | undefined): number | undefined {
  if (km === undefined || km < MIN_KM_FOR_COST_PER_KM) return undefined;
  return roundOrUndefined(totalCop / km);
}

export type MonthPoint = {
  monthKey: string;
  totalCop: number;
  /** Registros del mes (de cualquier tipo). */
  records: number;
  km?: number;
  costPerKmCop?: number;
};

/** Los últimos `count` meses (incluido el actual), del más antiguo al más reciente. */
export function monthlySeries(entries: HistoryEntry[], referenceDate: Date, count = 12): MonthPoint[] {
  const to = monthKeyOf(referenceDate);
  return monthRange(addMonthKey(to, -(count - 1)), to).map((monthKey) => {
    const totalCop = entries
      .filter((e) => costDateOf(e).startsWith(monthKey))
      .reduce((sum, e) => sum + entryCost(e), 0);
    const km = kmInRange(entries, monthStart(monthKey), monthStart(addMonthKey(monthKey, 1)));
    return {
      monthKey,
      totalCop,
      records: entries.filter((e) => e.date.startsWith(monthKey)).length,
      km,
      costPerKmCop: costPerKmOf(totalCop, km),
    };
  });
}

/** Primera fecha con algún registro (o undefined si no hay ninguno). */
function firstActivity(entries: HistoryEntry[]): string | undefined {
  return entries.flatMap((e) => [e.date, costDateOf(e)]).sort()[0];
}

/**
 * Mes ("AAAA-MM") del primer registro. Los meses anteriores no tienen datos: se muestran
 * vacíos en los gráficos, nunca como $0.
 */
export function firstActivityMonth(entries: HistoryEntry[]): string | undefined {
  return firstActivity(entries)?.slice(0, 7);
}

// ── Gastos ───────────────────────────────────────────────────────────────────

export type ExpenseAnalysis = {
  hasData: boolean;
  /** Todo lo registrado desde el principio. */
  accumulatedCop: number;
  /** Meses desde el primer gasto hasta hoy. */
  monthsCovered: number;
  monthlyAverageCop?: number;
  byCategory: ProCategoryTotal[];
  topCategory?: ProCategoryTotal;
  series: MonthPoint[];
  last12Cop: number;
  highestMonth?: MonthPoint;
};

export function analyzeExpenses(entries: HistoryEntry[], referenceDate: Date): ExpenseAnalysis {
  const costed = entries.filter((e) => entryCost(e) > 0);
  const accumulatedCop = costed.reduce((sum, e) => sum + entryCost(e), 0);
  const series = monthlySeries(entries, referenceDate);
  const firstCost = costed.map(costDateOf).sort()[0];
  const monthsCovered = firstCost ? monthRange(firstCost.slice(0, 7), monthKeyOf(referenceDate)).length : 0;
  const byCategory = proCategoryTotals(costed);
  const highest = series.reduce<MonthPoint | undefined>(
    (max, point) => (point.totalCop > 0 && (!max || point.totalCop > max.totalCop) ? point : max),
    undefined,
  );
  return {
    hasData: costed.length > 0,
    accumulatedCop,
    monthsCovered,
    monthlyAverageCop: monthsCovered > 0 ? Math.round(accumulatedCop / monthsCovered) : undefined,
    byCategory,
    topCategory: byCategory[0],
    series,
    last12Cop: series.reduce((sum, p) => sum + p.totalCop, 0),
    highestMonth: highest,
  };
}

// ── Mantenimiento ────────────────────────────────────────────────────────────

export type MaintenanceHistory = {
  entries: Extract<HistoryEntry, { kind: 'maintenance' }>[];
  count: number;
  /** Suma de los mantenimientos con costo (los que no tienen costo no suman). */
  totalCop: number;
  withoutCost: number;
};

export function maintenanceHistory(entries: HistoryEntry[]): MaintenanceHistory {
  const list = entries
    .filter((e): e is Extract<HistoryEntry, { kind: 'maintenance' }> => e.kind === 'maintenance')
    .sort((a, b) => cmpText(b.date, a.date));
  return {
    entries: list,
    count: list.length,
    totalCop: list.reduce((sum, e) => sum + (e.costCop ?? 0), 0),
    withoutCost: list.filter((e) => e.costCop === undefined).length,
  };
}

// ── Energía ──────────────────────────────────────────────────────────────────

/**
 * Tipos de energía a analizar: lo que el carro puede registrar según su energía, más lo
 * que ya tiene registrado (igual que Estadísticas). Un eléctrico no ve combustible y un
 * carro de gasolina no ve carga eléctrica, salvo que el usuario ya tenga esos registros.
 */
export function analysisEnergyKinds(profile: CarProfile, entries: HistoryEntry[]): EnergyKind[] {
  const allowed = energyRecordKinds(profile);
  return (['fuel', 'cng', 'charge'] as EnergyKind[]).filter(
    (k) => allowed.includes(k) || entries.some((e) => e.kind === k),
  );
}

export type EnergyMonthPoint = {
  monthKey: string;
  spentCop: number;
  quantity: number;
  records: number;
  /** Consumo de los tramos que terminan en el mes; sin tramos → undefined. */
  kmPerUnit?: number;
};

export type EnergyAnalysis = {
  kind: EnergyKind;
  records: number;
  /** Cantidad total en unidad base (L, m³, kWh). */
  quantity: number;
  /** Costos conocidos (los registros sin costo no suman ni se inventan). */
  spentCop: number;
  withoutCost: number;
  avgUnitPriceCop?: number;
  monthlyAverageCop?: number;
  /** Consumo con TODOS los tramos comparables. */
  consumption: ConsumptionResult;
  costPerKmCop?: number;
  series: EnergyMonthPoint[];
};

export function analyzeEnergy(entries: HistoryEntry[], kind: EnergyKind, referenceDate: Date): EnergyAnalysis {
  const records = energyRecords(entries, kind);
  const costed = records.filter((r) => r.costCop !== undefined);
  const manualFuel =
    kind === 'fuel'
      ? entries.filter((e) => e.kind === 'expense' && e.category === 'fuel').reduce((s, e) => s + entryCost(e), 0)
      : 0;
  const costedCost = costed.reduce((sum, r) => sum + (r.costCop ?? 0), 0);
  const spentCop = costedCost + manualFuel;
  const consumption = summarizeConsumption(consumptionPairs(entries, kind), kind);

  const to = monthKeyOf(referenceDate);
  const series = monthRange(addMonthKey(to, -11), to).map((monthKey) => {
    const month = computeEnergyMonthStats(entries, monthKey, kind);
    return {
      monthKey,
      spentCop: month.spentCop,
      quantity: month.quantity,
      records: month.records,
      kmPerUnit: month.consumption.status === 'calculated' ? month.consumption.kmPerUnit : undefined,
    };
  });

  const firstDate = records[0]?.date;
  const monthsCovered = firstDate ? monthRange(firstDate.slice(0, 7), to).length : 0;

  return {
    kind,
    records: records.length,
    quantity: records.reduce((sum, r) => sum + baseQuantity(r), 0),
    spentCop,
    withoutCost: records.length - costed.length,
    avgUnitPriceCop: roundOrUndefined(unitPrice(costedCost, costed.reduce((s, r) => s + baseQuantity(r), 0))),
    monthlyAverageCop: monthsCovered > 0 && spentCop > 0 ? Math.round(spentCop / monthsCovered) : undefined,
    consumption,
    costPerKmCop: consumption.status === 'calculated' ? roundOrUndefined(consumption.costPerKmCop) : undefined,
    series,
  };
}

// ── Comparación de períodos ──────────────────────────────────────────────────

export type PeriodMetrics = {
  totalCop: number;
  energyCop: number;
  maintenanceCop: number;
  records: number;
  km?: number;
  costPerKmCop?: number;
};

export type PeriodWindow = { fromMonth: string; toMonth: string; metrics: PeriodMetrics };

export type PeriodComparison = {
  months: number;
  label: string;
  current: PeriodWindow;
  previous: PeriodWindow;
  /** Solo se compara si los registros cubren también el período anterior. */
  enough: boolean;
};

export const COMPARISON_PERIODS = [
  { months: 1, label: 'Mes actual vs. anterior' },
  { months: 3, label: 'Últimos 3 meses' },
  { months: 6, label: 'Últimos 6 meses' },
  { months: 12, label: 'Últimos 12 meses' },
] as const;

function metricsBetween(entries: HistoryEntry[], fromMonth: string, toMonth: string): PeriodMetrics {
  const start = monthStart(fromMonth);
  const end = monthStart(addMonthKey(toMonth, 1));
  const inCost = entries.filter((e) => {
    const d = costDateOf(e);
    return d >= start && d < end;
  });
  const sumOf = (keys: ProCategoryKey[]) =>
    inCost.filter((e) => keys.includes(proCategoryOf(e))).reduce((sum, e) => sum + entryCost(e), 0);
  const totalCop = inCost.reduce((sum, e) => sum + entryCost(e), 0);
  const km = kmInRange(entries, start, end);
  return {
    totalCop,
    energyCop: sumOf(['fuel', 'cng', 'charge']),
    maintenanceCop: sumOf(['maintenance']),
    records: entries.filter((e) => e.date >= start && e.date < end).length,
    km,
    costPerKmCop: costPerKmOf(totalCop, km),
  };
}

/** Los períodos actuales (incluyen el mes en curso) frente al mismo número de meses anteriores. */
export function comparePeriods(entries: HistoryEntry[], referenceDate: Date): PeriodComparison[] {
  const toMonth = monthKeyOf(referenceDate);
  const first = firstActivity(entries);
  return COMPARISON_PERIODS.map(({ months, label }) => {
    const currentFrom = addMonthKey(toMonth, -(months - 1));
    const previousTo = addMonthKey(currentFrom, -1);
    const previousFrom = addMonthKey(previousTo, -(months - 1));
    const previous = metricsBetween(entries, previousFrom, previousTo);
    return {
      months,
      label,
      current: { fromMonth: currentFrom, toMonth, metrics: metricsBetween(entries, currentFrom, toMonth) },
      previous: { fromMonth: previousFrom, toMonth: previousTo, metrics: previous },
      enough: first !== undefined && first.slice(0, 7) <= previousFrom && previous.records > 0,
    };
  });
}

export type Change = { diff: number; percent?: number };

/** Diferencia actual − anterior; el porcentaje solo si el anterior es > 0. */
export function changeBetween(current: number | undefined, previous: number | undefined): Change | undefined {
  if (current === undefined || previous === undefined) return undefined;
  const diff = current - previous;
  return { diff, percent: previous > 0 ? Math.round((diff / previous) * 100) : undefined };
}
