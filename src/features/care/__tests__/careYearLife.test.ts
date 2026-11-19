/** Puntaje de cuidado, "Tu año en carro" y hoja de vida. Datos de PRUEBA. */
import { buildLifeRecord, LIFE_RECORD_DISCLAIMER, lifeRecordText } from '@/features/cars/lifeRecord';
import type { EnergySource } from '@/features/cars/types';
import type { HistoryEntry } from '@/features/history/types';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import { partSpecKey } from '@/features/parts/userSpecs';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { ComponentConfig, OnboardingData } from '@/features/session/types';
import { buildYearWrapped, wrappedShareText } from '@/features/stats/yearWrapped';
import { formatCop, formatKm } from '@/shared/utils/format';

import { careScore, scoreLabel } from '../score';

const TODAY = new Date(2026, 8, 30, 8, 0);

const onboarding = (energySource: EnergySource, d: Partial<OnboardingData> = {}): OnboardingData => ({
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', year: 2022, energySource },
  km: 20000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-28',
  ...d,
});
const build = (
  energySource: EnergySource,
  d: Partial<OnboardingData> = {},
  extras: { records?: HistoryEntry[]; componentConfigs?: Partial<Record<string, ComponentConfig>> } = {},
) => buildAppDataFromOnboarding(onboarding(energySource, d), TODAY, extras as never);

const oilOk = { oil: { enabled: true, interval: { km: 5000 } } };

describe('puntaje de cuidado', () => {
  it('sin mantenimientos ni documentos: no hay puntaje (no se inventa)', () => {
    const care = careScore(build('gasoline'));
    expect(care.score).toBeUndefined();
    expect(care.parts.find((p) => p.key === 'maintenance')?.value).toBeUndefined();
  });

  it('todo al día: 100 y "Excelente"', () => {
    const data = build(
      'gasoline',
      { maintenance: [{ code: 'oil', date: '2026-09-20', km: 19900, costCop: null }], documents: { soatExpiresAt: '2027-06-01' } },
      { componentConfigs: oilOk },
    );
    const care = careScore(data);
    expect(care.score).toBe(100);
    expect(care.label).toBe('Excelente');
  });

  it('aceite vencido y SOAT vencido bajan el puntaje y aparecen como cosas por hacer', () => {
    const data = build(
      'gasoline',
      { maintenance: [{ code: 'oil', date: '2026-01-01', km: 14000, costCop: null }], documents: { soatExpiresAt: '2026-09-01' } },
      { componentConfigs: oilOk },
    );
    const care = careScore(data);
    // Mantenimiento 0/50, documentos 0/30, km 20/20 → 20.
    expect(care.score).toBe(20);
    expect(care.tips.slice(0, 2).map((t) => t.level)).toEqual(['due', 'due']);
  });

  it('lo que no tiene datos no cuenta: el puntaje se calcula con lo demás', () => {
    const data = build('gasoline', { documents: { soatExpiresAt: '2027-06-01' } });
    const care = careScore(data);
    expect(care.parts.find((p) => p.key === 'maintenance')?.value).toBeUndefined();
    expect(care.score).toBe(100); // documentos y km al día
  });

  it('niveles', () => {
    expect([95, 80, 60, 30].map(scoreLabel)).toEqual(['Excelente', 'Muy bien', 'Puede mejorar', 'Necesita atención']);
  });
});

describe('tu año en carro', () => {
  const records: HistoryEntry[] = [
    { id: 'o0', kind: 'odometer', date: '2025-12-30', km: 8000 },
    { id: 'f1', kind: 'fuel', date: '2026-03-01', km: 9000, quantity: 10, unit: 'gal', fullTank: true, costCop: 150000 },
    { id: 'f2', kind: 'fuel', date: '2026-06-01', km: 12000, quantity: 12, unit: 'gal', fullTank: true, costCop: 180000 },
    { id: 'm1', kind: 'maintenance', date: '2026-05-01', km: 11000, types: ['oil'], costCop: 160000 },
    { id: 'm2', kind: 'maintenance', date: '2026-08-01', km: 14000, types: ['oil', 'air_filter'], costCop: 210000 },
    { id: 'old', kind: 'expense', date: '2025-06-01', category: 'wash', amountCop: 999999 },
  ];

  it('resume el año: km, gasto, tanqueos en galones, mantenimientos y lo que más se hizo', () => {
    const w = buildYearWrapped(build('gasoline', {}, { records }).history, build('gasoline').profile, 2026, TODAY);
    expect(w).toMatchObject({ year: 2026, partial: true, hasData: true, totalCop: 700000, maintenanceCount: 2 });
    expect(w.km).toBe(12000); // de 8.000 (fin de 2025) a 20.000 (registro actual)
    expect(w.energy).toEqual([{ kind: 'fuel', records: 2, quantity: '22 galones', spentCop: 330000 }]);
    expect(w.topMaintenance).toEqual({ label: maintenanceLabel('oil'), times: 2 });
    expect(w.topCategory?.label).toBe('Mantenimiento');
    expect(wrappedShareText(w, formatCop, formatKm)).toMatch(/Mi 2026 en carro con Kia Picanto/);
  });

  it('el apodo se usa en el título', () => {
    const profile = { ...build('gasoline').profile, nickname: 'La Negra' };
    expect(buildYearWrapped(records, profile, 2026, TODAY).carName).toBe('La Negra');
  });

  it('un año sin registros no tiene tarjetas', () => {
    expect(buildYearWrapped(records, build('gasoline').profile, 2024, TODAY).hasData).toBe(false);
  });

  it('eléctrico: cargas en kWh, sin combustible', () => {
    const ev: HistoryEntry[] = [{ id: 'c', kind: 'charge', date: '2026-04-01', km: 1, quantity: 30, costCop: 30000 }];
    const w = buildYearWrapped(ev, build('electric').profile, 2026, TODAY);
    expect(w.energy).toEqual([{ kind: 'charge', records: 1, quantity: '30 kWh', spentCop: 30000 }]);
  });
});

describe('hoja de vida', () => {
  it('datos, mantenimientos en orden (el más reciente primero), documentos, repuestos y aviso', () => {
    const data = build(
      'gasoline',
      { maintenance: [{ code: 'oil', date: '2026-01-10', km: 15000, costCop: 150000 }], documents: { soatExpiresAt: '2027-03-01' } },
      { records: [{ id: 'm', kind: 'maintenance', date: '2026-08-01', km: 19000, types: ['brake_pads_front'], costCop: 200000, note: 'Taller Don Luis' }] },
    );
    const sheet = { chassisNumber: '9BW123', [partSpecKey('oil', 'Viscosidad')]: '5W-30' };
    const record = buildLifeRecord(data, sheet, (code) => maintenanceLabel(code as never));
    expect(record.carName).toBe('Kia Picanto 2022');
    expect(record.services.map((s) => s.title)).toEqual([maintenanceLabel('brake_pads_front'), maintenanceLabel('oil')]);
    expect(record.serviceTotalCop).toBe(350000);
    expect(record.vehicle).toEqual(expect.arrayContaining([{ label: 'Número de chasis (VIN)', value: '9BW123' }]));
    expect(record.parts).toEqual([{ label: maintenanceLabel('oil'), value: '5W-30' }]);
    expect(record.documents[0].title).toBe('SOAT');
    const text = lifeRecordText(record, TODAY);
    expect(text).toMatch(/HOJA DE VIDA · Kia Picanto 2022/);
    expect(text).toMatch(/Taller Don Luis/);
    expect(text).toContain(LIFE_RECORD_DISCLAIMER);
  });

  it('sin mantenimientos lo dice, sin inventar', () => {
    const record = buildLifeRecord(build('gasoline'), {}, (code) => code);
    expect(record.services).toEqual([]);
    expect(lifeRecordText(record, TODAY)).toMatch(/Sin mantenimientos registrados/);
  });
});
