import { vehicleInfoRows } from '@/features/cars/vehicleOptions';
import { documentStatusText } from '@/features/documents/presentation';
import { describeEntry, latestEntries, type EntryView } from '@/features/history/presentation';
import type { AppData } from '@/features/session/types';
import { computeRollingYearStats, type RollingYearStats } from '@/features/stats/compute';
import { maintenanceStatusLabels, type StatusLevel } from '@/shared/theme';

import { analysisEnergyKinds, analyzeEnergy, analyzeExpenses, type EnergyAnalysis, type ExpenseAnalysis } from './analytics';
import { analyzeState, type StateItem } from './stateAnalysis';

export const REPORT_HISTORY_ITEMS = 10;

export type ReportRow = { label: string; value: string; status?: StatusLevel };

export type VehicleReport = {
  carName: string;
  vehicle: ReportRow[];
  odometer: { km: number; lastReadingDate: string; daysSinceReading: number };
  maintenance: ReportRow[];
  documents: ReportRow[];
  expenses: ExpenseAnalysis;
  year: RollingYearStats;
  energy: EnergyAnalysis[];
  history: EntryView[];
  /** Solo lo atrasado/vencido y lo próximo. */
  alerts: StateItem[];
};

/**
 * Informe completo del vehículo con los mismos cálculos de la app. Lo que no está
 * registrado se dice ("Sin registrar"), nunca se completa.
 */
export function buildVehicleReport(data: AppData, referenceDate: Date): VehicleReport {
  const { profile } = data;
  return {
    carName: [profile.brandName, profile.model, profile.year].filter(Boolean).join(' ') || 'Tu carro',
    vehicle: vehicleInfoRows(profile).map((r) => ({ label: r.label, value: r.value ?? 'Sin registrar' })),
    odometer: {
      km: data.odometer.registeredKm,
      lastReadingDate: data.odometer.lastReadingDate,
      daysSinceReading: data.odometer.daysSinceReading,
    },
    maintenance: data.components
      .filter((c) => c.enabled)
      .map((c) => ({ label: c.title, value: `${maintenanceStatusLabels[c.status]} · ${c.detail}`, status: c.status })),
    documents: data.documents.map((d) => ({ label: d.title, value: `${documentStatusText(d)} · ${d.detail}`, status: d.status })),
    expenses: analyzeExpenses(data.history, referenceDate),
    year: computeRollingYearStats(data.history, referenceDate),
    energy: analysisEnergyKinds(profile, data.history).map((kind) => analyzeEnergy(data.history, kind, referenceDate)),
    history: latestEntries(data.history, REPORT_HISTORY_ITEMS).map((e) => describeEntry(e, profile.energySource)),
    alerts: analyzeState(data, referenceDate).items.filter((i) => i.level === 'due' || i.level === 'soon'),
  };
}
