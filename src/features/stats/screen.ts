import { canRecord } from '@/features/cars/energy';
import { needsEnergyConfirmation } from '@/features/cars/capabilities';
import type { CarProfile } from '@/features/cars/types';
import { computeEnergyMonthStats, energyRecords, INSUFFICIENT_DATA_MESSAGE } from '@/features/energy/compute';
import { ENERGY_META, energyTitle } from '@/features/energy/meta';
import { LITERS_PER_GALLON } from '@/features/energy/units';
import type { EnergyKind, HistoryEntry } from '@/features/history/types';
import { analysisEnergyKinds } from '@/features/pro/analytics';
import { parseISODate } from '@/shared/utils/date';
import type { IconName } from '@/shared/ui';

import {
  computeMonthStats,
  computeRollingYearStats,
  measuredCostPerKm,
  monthlyAverage,
  monthsWithExpenses,
  type CategoryTotal,
} from './compute';
import { carRecords, type CarRecordItem } from './records';
import { buildYearWrapped } from './yearWrapped';

/**
 * Pantalla de Estadísticas (Free), armada con los cálculos que ya existen. La sección
 * de energía depende del TIPO DE ENERGÍA del carro (cars/energy: lo que puede registrar,
 * más lo que ya tenga registrado): nunca se suman unidades distintas, solo pesos, y lo
 * desconocido queda `undefined` ("Sin suficiente información"), nunca $0.
 */

/** Nombre de cada energía en Estadísticas. */
export const ENERGY_STATS_TITLES: Record<EnergyKind, string> = {
  fuel: 'Combustible',
  cng: 'Gas natural (GNC)',
  charge: 'Electricidad',
};
/** Nombre corto (cuadro "Energía del mes"). */
const ENERGY_SHORT: Record<EnergyKind, string> = { fuel: 'Combustible', cng: 'GNC', charge: 'Electricidad' };

const ENERGY_NOTES: Record<EnergyKind, string> = {
  fuel: 'El consumo se estima solo entre cargas de tanque lleno con kilometraje. No es un valor exacto.',
  cng: 'El consumo se estima solo entre cargas completas de GNC con kilometraje. No es un valor exacto.',
  charge:
    'El consumo se estima solo entre cargas que terminan en el mismo porcentaje de batería, con kilometraje. No es un valor exacto.',
};

export type QuantityUnit = 'gal' | 'L' | 'm³' | 'kWh';

/** "Precio promedio por galón / litro / m³ / kWh". */
export const UNIT_NAMES: Record<QuantityUnit, string> = { gal: 'galón', L: 'litro', 'm³': 'm³', kWh: 'kWh' };

export type EnergyBlock = {
  kind: EnergyKind;
  title: string;
  /** Gasolina / Diésel (solo combustible). */
  subtitle?: string;
  /** ¿El carro puede registrar este tipo? (si no, solo se muestran sus datos). */
  canRecord: boolean;
  records: number;
  /** Lo pagado con costo conocido. undefined = hay registros pero ninguno con costo (desconocido, no $0). */
  spentCop?: number;
  /** Registros del mes sin costo: desconocidos, no $0. */
  withoutCost: number;
  unit: QuantityUnit;
  quantity?: number;
  averagePerRecordCop?: number;
  /** Precio por unidad mostrada (por galón, litro, m³ o kWh). */
  avgUnitPriceCop?: number;
  /** km por unidad mostrada (km/gal, km/L, km/m³, km/kWh). */
  consumption?: { kmPerUnit: number; unit: QuantityUnit; pairs: number };
  consumptionMessage: string;
  costPerKmCop?: number;
  note: string;
  emptyTitle: string;
  actionLabel: string;
};

export type MonthComparison = { previousKey: string; previousTotalCop: number; diffCop: number; percent?: number };

export type MonthView = {
  monthKey: string;
  totalCop: number;
  comparison?: MonthComparison;
  kmTraveled?: number;
  costPerKmCop?: number;
  energyTile: { label: string; icon: IconName; caption?: string; valueCop?: number };
  maintenanceCop: number;
  /** Mantenimientos registrados en el mes (con o sin costo). */
  maintenanceCount: number;
  /** ¿Hay algún registro en el mes? */
  hasRecords: boolean;
  dailyAverageCop: number;
  monthlyAverageCop?: number;
  monthsWithData: number;
  byCategory: CategoryTotal[];
  energy: EnergyBlock[];
  /** Energía sin confirmar: no se asume ninguna ("Depende de tu carro"). */
  energyUnconfirmed: boolean;
};

export type YearView = {
  fromMonth: string;
  toMonth: string;
  totalCop: number;
  /** Promedio SOLO sobre los meses con gastos (no ÷ 12). */
  monthlyAverageCop?: number;
  monthsWithExpenses: number;
  costPerKmCop?: number;
  kmMeasured?: number;
  /** Fecha desde la que se midió el km si el carro tiene menos de 12 meses de lecturas. */
  measuredFrom?: string;
  byCategory: CategoryTotal[];
};

/** Unidad para mostrar el combustible del mes: la que usó el usuario si es una sola; mezcla → litros. */
function fuelDisplayUnit(entries: HistoryEntry[], monthKey: string): 'gal' | 'L' {
  const units = new Set(energyRecords(entries, 'fuel').filter((r) => r.date.startsWith(monthKey)).map((r) => r.unit));
  return units.size === 1 && units.has('gal') ? 'gal' : 'L';
}

const finite = (v: number | undefined) => (v !== undefined && Number.isFinite(v) ? v : undefined);

function energyBlock(entries: HistoryEntry[], profile: CarProfile, monthKey: string, kind: EnergyKind): EnergyBlock {
  const stats = computeEnergyMonthStats(entries, monthKey, kind);
  const meta = ENERGY_META[kind];
  // Galones: la base de cálculo es el litro; se convierte solo para mostrar.
  const unit: QuantityUnit = kind === 'fuel' ? fuelDisplayUnit(entries, monthKey) : kind === 'cng' ? 'm³' : 'kWh';
  const perUnit = unit === 'gal' ? LITERS_PER_GALLON : 1;
  const costed = energyRecords(entries, kind).filter((r) => r.date.startsWith(monthKey) && r.costCop !== undefined);
  const costedTotal = costed.reduce((sum, r) => sum + (r.costCop ?? 0), 0);
  const consumption = stats.consumption;

  return {
    kind,
    title: ENERGY_STATS_TITLES[kind],
    subtitle: kind === 'fuel' ? energyTitle('fuel', profile.energySource) : undefined,
    canRecord: canRecord(profile, kind),
    records: stats.records,
    spentCop: stats.records > 0 && stats.withoutCost === stats.records && stats.spentCop === 0 ? undefined : stats.spentCop,
    withoutCost: stats.withoutCost,
    unit,
    quantity: stats.records > 0 ? stats.quantity / perUnit : undefined,
    averagePerRecordCop: costed.length > 0 ? Math.round(costedTotal / costed.length) : undefined,
    avgUnitPriceCop: finite(stats.avgUnitPriceCop !== undefined ? Math.round(stats.avgUnitPriceCop * perUnit) : undefined),
    consumption:
      consumption.status === 'calculated'
        ? { kmPerUnit: consumption.kmPerUnit * perUnit, unit, pairs: consumption.pairs }
        : undefined,
    consumptionMessage: INSUFFICIENT_DATA_MESSAGE,
    costPerKmCop:
      consumption.status === 'calculated' && consumption.costPerKmCop !== undefined
        ? finite(Math.round(consumption.costPerKmCop))
        : undefined,
    note: ENERGY_NOTES[kind],
    emptyTitle: meta.emptyTitle,
    actionLabel: `Registrar ${meta.action.toLowerCase()}`,
  };
}

/**
 * Meses del selector: los que tienen gastos, del más reciente al más antiguo. Si todavía
 * no hay gastos pero sí registros (km, mantenimientos sin costo…), se muestra el mes en
 * curso para no ocultar esa información. Sin ningún registro → [] (estado vacío).
 */
export function statsMonths(entries: HistoryEntry[], referenceDate: Date): string[] {
  const months = monthsWithExpenses(entries);
  if (months.length > 0 || entries.length === 0) return months;
  return [`${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`];
}

export function buildMonthView(
  entries: HistoryEntry[],
  profile: CarProfile,
  months: string[],
  index: number,
  referenceDate: Date,
): MonthView {
  const monthKey = months[index];
  const stats = computeMonthStats(entries, monthKey, referenceDate);
  const previousKey = months[index + 1];
  const previousTotal = previousKey ? computeMonthStats(entries, previousKey, referenceDate).totalCop : undefined;
  const kinds = analysisEnergyKinds(profile, entries);
  const unconfirmed = needsEnergyConfirmation(profile);
  const energy = kinds.map((kind) => energyBlock(entries, profile, monthKey, kind));
  // Con registros de energía en el mes pero ninguno con costo, el gasto es desconocido (no $0).
  const energyUnknown =
    stats.energyCop === 0 &&
    energy.some((b) => b.records > 0) &&
    energy.every((b) => b.spentCop === undefined || (b.spentCop === 0 && b.records === 0));

  return {
    monthKey,
    totalCop: stats.totalCop,
    comparison:
      previousKey && previousTotal !== undefined
        ? {
            previousKey,
            previousTotalCop: previousTotal,
            diffCop: stats.totalCop - previousTotal,
            percent: previousTotal > 0 ? Math.round(((stats.totalCop - previousTotal) / previousTotal) * 100) : undefined,
          }
        : undefined,
    kmTraveled: stats.kmTraveled,
    costPerKmCop: stats.costPerKmCop,
    energyTile:
      kinds.length === 0
        ? { label: 'Energía', icon: 'electric', caption: 'Depende de tu carro', valueCop: undefined }
        : {
            label: kinds.length === 1 ? ENERGY_SHORT[kinds[0]] : 'Energía',
            icon: kinds.length === 1 ? ENERGY_META[kinds[0]].icon : 'electric',
            caption: kinds.length > 1 ? kinds.map((k) => ENERGY_SHORT[k]).join(' + ') : undefined,
            valueCop: energyUnknown ? undefined : stats.energyCop,
          },
    maintenanceCop: stats.maintenanceCop,
    maintenanceCount: entries.filter((e) => e.kind === 'maintenance' && e.date.startsWith(monthKey)).length,
    hasRecords: entries.some((e) => e.date.startsWith(monthKey)),
    dailyAverageCop: stats.dailyAverageCop,
    // Sin meses con gastos no hay promedio (nunca $0 inventado).
    monthlyAverageCop: monthsWithExpenses(entries).length > 0 ? monthlyAverage(entries, referenceDate) : undefined,
    monthsWithData: monthsWithExpenses(entries).length,
    byCategory: stats.byCategory,
    energy,
    energyUnconfirmed: unconfirmed,
  };
}

export function buildYearView(entries: HistoryEntry[], referenceDate: Date): YearView {
  const year = computeRollingYearStats(entries, referenceDate);
  const withExpenses = monthsWithExpenses(entries).filter((m) => m >= year.fromMonth && m <= year.toMonth).length;
  const [y, m] = year.toMonth.split('-').map(Number);
  const end = `${y + (m === 12 ? 1 : 0)}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`;
  const measured = measuredCostPerKm(entries, `${year.fromMonth}-01`, end);
  return {
    fromMonth: year.fromMonth,
    toMonth: year.toMonth,
    totalCop: year.totalCop,
    monthlyAverageCop: withExpenses > 0 ? Math.round(year.totalCop / withExpenses) : undefined,
    monthsWithExpenses: withExpenses,
    costPerKmCop: measured?.costPerKmCop,
    kmMeasured: measured?.km,
    measuredFrom: measured && measured.fromDate !== `${year.fromMonth}-01` ? measured.fromDate : undefined,
    byCategory: year.byCategory,
  };
}

// ── Memoria de la pantalla de Estadísticas ──────────────────────────────────
// Los cálculos se reutilizan mientras no cambien los datos (mismo historial y perfil) ni
// el día: cambiar de mes con las flechas no vuelve a calcular los 12 meses ni los récords.

type YearlyStats = { year: YearView; records: CarRecordItem[]; wrappedReady: boolean };
let lastYearly: { entries: HistoryEntry[]; profile: CarProfile; dayKey: string; value: YearlyStats } | undefined;

export function yearlyStats(entries: HistoryEntry[], profile: CarProfile, dayKey: string): YearlyStats {
  if (lastYearly && lastYearly.entries === entries && lastYearly.profile === profile && lastYearly.dayKey === dayKey) {
    return lastYearly.value;
  }
  const ref = parseISODate(dayKey);
  const value = {
    year: buildYearView(entries, ref),
    records: carRecords(entries, profile, ref),
    wrappedReady: buildYearWrapped(entries, profile, ref.getFullYear(), ref).hasData,
  };
  lastYearly = { entries, profile, dayKey, value };
  return value;
}

const monthCache = new WeakMap<HistoryEntry[], Map<string, MonthView>>();

export function monthStats(
  entries: HistoryEntry[],
  profile: CarProfile,
  months: string[],
  index: number,
  dayKey: string,
): MonthView {
  let byKey = monthCache.get(entries);
  if (!byKey) {
    byKey = new Map();
    monthCache.set(entries, byKey);
  }
  const key = `${months[index]}|${dayKey}|${profile.energySource ?? ''}|${index}`;
  const cached = byKey.get(key);
  if (cached) return cached;
  const value = buildMonthView(entries, profile, months, index, parseISODate(dayKey));
  byKey.set(key, value);
  return value;
}
