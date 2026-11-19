/** Estadísticas Free: solo "¿cómo va mi carro este mes?". Datos de PRUEBA. */
import type { EnergySource } from '@/features/cars/types';
import type { HistoryEntry } from '@/features/history/types';
import { analyzeExpenses, comparePeriods } from '@/features/pro/analytics';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';

import { computeFreeMonthSummary } from '../free';

const TODAY = new Date(2026, 8, 30); // 30/09/2026

const profile = (energySource: EnergySource) =>
  buildAppDataFromOnboarding(
    {
      user: { name: 'Ana', city: '' },
      profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
      km: 10000,
      maintenance: [],
      documents: {},
      completedAt: '2026-08-01',
    },
    TODAY,
  ).profile;

const records: HistoryEntry[] = [
  { id: 'o1', kind: 'odometer', date: '2026-08-31', km: 10000 },
  { id: 'o2', kind: 'odometer', date: '2026-09-29', km: 10800 },
  { id: 'f-aug', kind: 'fuel', date: '2026-08-10', km: 9800, quantity: 30, unit: 'L', fullTank: true, costCop: 300000 },
  { id: 'f-sep', kind: 'fuel', date: '2026-09-10', km: 10400, quantity: 35, unit: 'L', fullTank: true, costCop: 350000 },
  { id: 'm-sep', kind: 'maintenance', date: '2026-09-12', km: 10500, types: ['oil'], costCop: 150000 },
  { id: 'm-aug', kind: 'maintenance', date: '2026-08-12', km: 9900, types: ['air_filter'], costCop: 50000 },
];

describe('Estadísticas Free', () => {
  it('solo el resumen del mes: nada de comparaciones, costo por km, promedios, consumo ni precios', () => {
    const summary = computeFreeMonthSummary(records, profile('gasoline'), TODAY);
    expect(Object.keys(summary).sort()).toEqual(
      ['byCategory', 'energy', 'energyCop', 'hasRecords', 'kmTraveled', 'maintenanceCount', 'monthKey', 'totalCop'].sort(),
    );
    expect(JSON.stringify(summary)).not.toMatch(/costPerKm|dailyAverage|monthlyAverage|kmPerUnit|avgUnitPrice|previous/);
  });

  it('el mes actual: total, distribución, km, energía y cantidad de mantenimientos', () => {
    const summary = computeFreeMonthSummary(records, profile('gasoline'), TODAY);
    expect(summary).toMatchObject({
      monthKey: '2026-09',
      totalCop: 500000, // agosto no cuenta
      kmTraveled: 800,
      energyCop: 350000,
      maintenanceCount: 1,
      hasRecords: true,
    });
    expect(summary.byCategory.map((c) => c.key)).toEqual(['fuel', 'maintenance']);
    expect(summary.energy).toEqual([{ kind: 'fuel', title: 'Gasolina', spentCop: 350000, records: 1 }]);
  });

  it('la energía se nombra según el carro: un eléctrico no ve combustible', () => {
    const summary = computeFreeMonthSummary([], profile('electric'), TODAY);
    expect(summary.energy.map((e) => e.title)).toEqual(['Electricidad']);
  });

  it('mes sin registros: ceros reales, sin NaN', () => {
    const summary = computeFreeMonthSummary(records, profile('gasoline'), new Date(2026, 10, 15));
    expect(summary).toMatchObject({ totalCop: 0, maintenanceCount: 0, hasRecords: false, byCategory: [] });
    expect(JSON.stringify(summary)).not.toMatch(/NaN|Infinity|null/);
  });

  it('lo que salió de Free sigue disponible en Pro con los mismos datos', () => {
    const expenses = analyzeExpenses(records, TODAY);
    expect(expenses.accumulatedCop).toBe(850000);
    expect(expenses.highestMonth?.monthKey).toBe('2026-09');
    expect(comparePeriods(records, TODAY)[0]).toMatchObject({ enough: true });
  });
});
