import type { CarProfile } from '@/features/cars/types';
import { computeEnergyMonthStats } from '@/features/energy/compute';
import { energyTitle } from '@/features/energy/meta';
import type { EnergyKind, HistoryEntry } from '@/features/history/types';
import { analysisEnergyKinds, monthKeyOf } from '@/features/pro/analytics';

import { computeMonthStats, type CategoryTotal } from './compute';

export type FreeEnergyLine = { kind: EnergyKind; title: string; spentCop: number; records: number };

/**
 * Estadísticas básicas (Free): "¿cómo va mi carro ESTE mes?". Solo el mes en curso,
 * con los mismos cálculos de siempre. Tendencias, comparaciones, costo por km,
 * consumo y precios promedio son de RODEXA Pro (pro/analisis).
 */
export type FreeMonthSummary = {
  monthKey: string;
  totalCop: number;
  byCategory: CategoryTotal[];
  /** undefined = no hay lecturas suficientes para medir el mes. */
  kmTraveled?: number;
  energyCop: number;
  /** Gasto y registros del mes por tipo de energía del carro. */
  energy: FreeEnergyLine[];
  maintenanceCount: number;
  /** ¿Hay algún registro este mes? */
  hasRecords: boolean;
};

export function computeFreeMonthSummary(
  entries: HistoryEntry[],
  profile: CarProfile,
  referenceDate: Date,
): FreeMonthSummary {
  const monthKey = monthKeyOf(referenceDate);
  const month = computeMonthStats(entries, monthKey, referenceDate);
  const energy = analysisEnergyKinds(profile, entries).map((kind) => {
    const stats = computeEnergyMonthStats(entries, monthKey, kind);
    return { kind, title: energyTitle(kind, profile.energySource), spentCop: stats.spentCop, records: stats.records };
  });
  return {
    monthKey,
    totalCop: month.totalCop,
    byCategory: month.byCategory,
    kmTraveled: month.kmTraveled,
    energyCop: month.energyCop,
    energy,
    maintenanceCount: entries.filter((e) => e.kind === 'maintenance' && e.date.startsWith(monthKey)).length,
    hasRecords: entries.some((e) => e.date.startsWith(monthKey)),
  };
}
