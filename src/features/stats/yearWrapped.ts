import type { CarProfile } from '@/features/cars/types';
import { energyRecords } from '@/features/energy/compute';
import { LITERS_PER_GALLON, baseQuantity } from '@/features/energy/units';
import { costDateOf, entryCost } from '@/features/history/presentation';
import type { EnergyKind, HistoryEntry } from '@/features/history/types';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import { analysisEnergyKinds, proCategoryTotals } from '@/features/pro/analytics';
import { formatDecimal } from '@/shared/utils/format';

import { measuredCostPerKm } from './compute';
import { carRecords, type CarRecordItem } from './records';

/**
 * "Tu año en carro": un resumen del año con lo que registraste (estilo Wrapped).
 * Cada tarjeta aparece solo si tiene datos; nada se estima ni se completa.
 */
export type WrappedEnergy = { kind: EnergyKind; records: number; quantity: string; spentCop: number };

export type YearWrapped = {
  year: number;
  /** Año en curso: "hasta hoy". */
  partial: boolean;
  hasData: boolean;
  carName: string;
  km?: number;
  totalCop: number;
  monthsWithExpenses: number;
  monthlyAverageCop?: number;
  energy: WrappedEnergy[];
  maintenanceCount: number;
  topMaintenance?: { label: string; times: number };
  topCategory?: { label: string; amountCop: number; share: number };
  records: CarRecordItem[];
};

const ENERGY_VERB: Record<EnergyKind, (n: number) => string> = {
  fuel: (n) => `${n} ${n === 1 ? 'carga de combustible' : 'cargas de combustible'}`,
  cng: (n) => `${n} ${n === 1 ? 'carga de GNC' : 'cargas de GNC'}`,
  charge: (n) => `${n} ${n === 1 ? 'carga eléctrica' : 'cargas eléctricas'}`,
};
export const energyCountText = (kind: EnergyKind, n: number) => ENERGY_VERB[kind](n);

export function buildYearWrapped(entries: HistoryEntry[], profile: CarProfile, year: number, referenceDate: Date): YearWrapped {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const inYear = entries.filter((e) => e.date >= start && e.date < end);
  const costInYear = entries.filter((e) => {
    const d = costDateOf(e);
    return d >= start && d < end && entryCost(e) > 0;
  });
  const totalCop = costInYear.reduce((s, e) => s + entryCost(e), 0);
  const months = new Set(costInYear.map((e) => costDateOf(e).slice(0, 7))).size;

  const energy = analysisEnergyKinds(profile, entries).flatMap((kind) => {
    const recs = energyRecords(inYear, kind);
    if (recs.length === 0) return [];
    const base = recs.reduce((s, r) => s + baseQuantity(r), 0);
    // Combustible: en galones si casi todo se registró en galones; si no, en litros.
    const gal = kind === 'fuel' && recs.filter((r) => r.kind === 'fuel' && r.unit === 'gal').length * 2 > recs.length;
    const quantity =
      kind === 'fuel' ? `${formatDecimal(gal ? base / LITERS_PER_GALLON : base)} ${gal ? 'galones' : 'litros'}` : `${formatDecimal(base)} ${kind === 'cng' ? 'm³' : 'kWh'}`;
    return [{ kind, records: recs.length, quantity, spentCop: recs.reduce((s, r) => s + (r.costCop ?? 0), 0) }];
  });

  const maintenances = inYear.filter((e): e is Extract<HistoryEntry, { kind: 'maintenance' }> => e.kind === 'maintenance');
  const counts = new Map<string, number>();
  for (const m of maintenances) for (const t of m.types) counts.set(t, (counts.get(t) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  const topCat = proCategoryTotals(costInYear)[0];
  const km = measuredCostPerKm(entries, start, end)?.km;
  // Récords del año (los km de enero y el consumo del primer tanqueo usan lo registrado en diciembre).
  const records = carRecords(entries, profile, referenceDate, year);

  return {
    year,
    partial: referenceDate.getFullYear() === year,
    hasData: inYear.length > 0 || costInYear.length > 0,
    carName: profile.nickname || [profile.brandName, profile.model].filter(Boolean).join(' ') || 'tu carro',
    km,
    totalCop,
    monthsWithExpenses: months,
    monthlyAverageCop: months > 0 ? Math.round(totalCop / months) : undefined,
    energy,
    maintenanceCount: maintenances.length,
    topMaintenance: top ? { label: maintenanceLabel(top[0] as never), times: top[1] } : undefined,
    topCategory: topCat ? { label: topCat.label, amountCop: topCat.amountCop, share: topCat.share } : undefined,
    records,
  };
}

/** Texto para compartir (el usuario decide si lo envía). */
export function wrappedShareText(w: YearWrapped, formatCop: (n: number) => string, formatKm: (n: number) => string): string {
  const lines = [`Mi ${w.year} en carro con ${w.carName} 🚗`];
  if (w.km !== undefined) lines.push(`• Recorrí ${formatKm(w.km)}`);
  if (w.totalCop > 0) lines.push(`• Registré ${formatCop(w.totalCop)} en gastos`);
  for (const e of w.energy) lines.push(`• ${energyCountText(e.kind, e.records)} · ${e.quantity}`);
  if (w.maintenanceCount > 0) lines.push(`• ${w.maintenanceCount} ${w.maintenanceCount === 1 ? 'mantenimiento' : 'mantenimientos'}`);
  lines.push('', 'Hecho con RODEXA Carro');
  return lines.join('\n');
}
