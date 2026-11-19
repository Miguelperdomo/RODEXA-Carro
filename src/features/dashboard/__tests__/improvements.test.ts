/** Ficha con repuestos, peajes y despinchada, próximo mantenimiento, buscador y primeros pasos. Datos de PRUEBA. */
import type { EnergySource } from '@/features/cars/types';
import { EXPENSE_CATEGORIES } from '@/features/expenses/catalog';
import { historyTotals, matchesQuery } from '@/features/history/search';
import type { HistoryEntry } from '@/features/history/types';
import { notedParts, partSpecKey } from '@/features/parts/userSpecs';
import { proCategoryOf } from '@/features/pro/analytics';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { ComponentConfig, OnboardingData } from '@/features/session/types';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { computeMonthStats } from '@/features/stats/compute';
import { sanitizeSettings } from '@/storage/settingsStore';

import { gettingStartedSteps } from '../gettingStarted';
import { nextMaintenance } from '../nextMaintenance';

const TODAY = new Date(2026, 8, 30);

const onboarding = (energySource: EnergySource, d: Partial<OnboardingData> = {}): OnboardingData => ({
  user: { name: 'Ana', city: 'Ibagué' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
  km: 20000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-25',
  ...d,
});
const build = (
  energySource: EnergySource,
  d: Partial<OnboardingData> = {},
  extras: { records?: HistoryEntry[]; componentConfigs?: Partial<Record<string, ComponentConfig>> } = {},
) => buildAppDataFromOnboarding(onboarding(energySource, d), TODAY, extras as never);

describe('ficha: repuestos que usa mi carro', () => {
  it('lista solo lo anotado, en el orden del catálogo', () => {
    const sheet = {
      [partSpecKey('tire_front', 'Medida')]: '185/65 R15',
      [partSpecKey('oil', 'Viscosidad')]: '5W-30',
      oil: 'texto de la ficha',
    };
    expect(notedParts(sheet)).toEqual([
      { code: 'oil', summary: '5W-30' },
      { code: 'tire_front', summary: '185/65 R15' },
    ]);
    expect(notedParts({})).toEqual([]);
  });
});

describe('peajes y pinchazo', () => {
  it('son categorías de gasto con su nombre en estadísticas', () => {
    expect(EXPENSE_CATEGORIES.map((c) => c.label)).toEqual(expect.arrayContaining(['Peajes', 'Pinchazo']));
    const entries: HistoryEntry[] = [
      { id: 't', kind: 'expense', date: '2026-09-10', category: 'toll', amountCop: 12000 },
      { id: 'p', kind: 'expense', date: '2026-09-11', category: 'flat_tire', amountCop: 15000 },
    ];
    const labels = computeMonthStats(entries, '2026-09', TODAY).byCategory.map((c) => c.label);
    expect(labels).toEqual(['Pinchazo', 'Peajes']);
    expect(proCategoryOf(entries[0])).toBe('other');
  });
});

describe('próximo mantenimiento en Inicio', () => {
  const oilConfig = { oil: { enabled: true, interval: { km: 5000, months: 6 } } };

  it('aceite por km y meses: "Faltan … km o ~… meses" y barra de progreso', () => {
    const data = build('gasoline', { maintenance: [{ code: 'oil', date: '2026-07-01', km: 16200, costCop: null }] }, { componentConfigs: oilConfig });
    const next = nextMaintenance(data.components, data.history, 20000, TODAY);
    expect(next?.component.code).toBe('oil');
    expect(next?.remaining).toBe('Faltan 1.200 km o ~3 meses');
    expect(next?.progress).toBeCloseTo(0.76, 2);
    expect(next?.status).toBe('ok');
  });

  it('vencido: barra llena', () => {
    const data = build('gasoline', { maintenance: [{ code: 'oil', date: '2026-01-01', km: 14000, costCop: null }] }, { componentConfigs: oilConfig });
    const next = nextMaintenance(data.components, data.history, 20000, TODAY);
    expect(next).toMatchObject({ status: 'due', progress: 1 });
  });

  it('sin intervalo o sin último cambio: no se muestra (nunca se supone)', () => {
    const data = build('gasoline');
    expect(nextMaintenance(data.components, data.history, 20000, TODAY)).toBeUndefined();
  });
});

describe('historial: buscador y totales', () => {
  const entries: HistoryEntry[] = [
    { id: 'f', kind: 'fuel', date: '2026-09-10', km: 1, quantity: 5, unit: 'gal', fullTank: true, costCop: 80000, station: 'Terpel Calle 60' },
    { id: 'm', kind: 'maintenance', date: '2026-09-12', km: 2, types: ['oil'], costCop: 150000, note: 'Mobil' },
    { id: 'e', kind: 'expense', date: '2026-09-13', category: 'toll', amountCop: 12000 },
  ];

  it('busca sin tildes ni mayúsculas, en estación, notas y títulos', () => {
    expect(entries.filter((e) => matchesQuery(e, 'terpel', 'gasoline')).map((e) => e.id)).toEqual(['f']);
    expect(entries.filter((e) => matchesQuery(e, 'ACEITE', 'gasoline')).map((e) => e.id)).toEqual(['m']);
    expect(entries.filter((e) => matchesQuery(e, 'peajes', 'gasoline')).map((e) => e.id)).toEqual(['e']);
    expect(entries.filter((e) => matchesQuery(e, 'gasolina terpel', 'gasoline')).map((e) => e.id)).toEqual(['f']);
    expect(entries.filter((e) => matchesQuery(e, '', 'gasoline'))).toHaveLength(3);
  });

  it('las palabras de antes siguen encontrando lo mismo (sinónimos), igual que las nuevas', () => {
    const flat: HistoryEntry = { id: 'p', kind: 'expense', date: '2026-09-11', category: 'flat_tire', amountCop: 15000 };
    const all = [...entries, flat];
    const find = (q: string) => all.filter((e) => matchesQuery(e, q, 'gasoline')).map((e) => e.id);
    // Antes: "tanqueo", "tanqueada", "despinchada"…
    expect(find('tanqueo')).toEqual(['f']);
    expect(find('tanqueada')).toEqual(['f']);
    expect(find('despinchada')).toEqual(['p']);
    // Ahora: "carga de combustible", "pinchazo".
    expect(find('carga de combustible')).toEqual(['f']);
    expect(find('pinchazo')).toEqual(['p']);
  });

  it('totales de lo filtrado', () => {
    expect(historyTotals(entries)).toEqual({ count: 3, totalCop: 242000, withCost: 3 });
    expect(historyTotals([])).toEqual({ count: 0, totalCop: 0, withCost: 0 });
  });
});

describe('primeros pasos', () => {
  const titles = (energySource: EnergySource, d: Partial<OnboardingData> = {}) =>
    gettingStartedSteps(build(energySource, d)).map((s) => s.title);

  it('según la energía del carro', () => {
    expect(titles('gasoline')).toEqual(['Registra tu primera carga de gasolina', 'Configura el aceite', 'Agrega tu SOAT']);
    expect(titles('diesel')[0]).toBe('Registra tu primera carga de diésel');
    expect(titles('cng')[0]).toBe('Registra tu primera carga de GNC');
    expect(titles('phev_gasoline')[0]).toBe('Registra tu primera carga de energía');
    expect(titles('unknown')[0]).toBe('Confirma la energía de tu carro');
  });

  it('un eléctrico no ve "Configura el aceite"', () => {
    expect(titles('electric')).toEqual(['Registra tu primera carga eléctrica', 'Agrega tu SOAT']);
  });

  it('si ya agregó el SOAT en el primer ingreso, no aparece', () => {
    expect(titles('gasoline', { documents: { soatExpiresAt: '2027-01-01' } })).not.toContain('Agrega tu SOAT');
  });

  it('desaparece al completar: tanqueo registrado y aceite configurado', () => {
    const data = build(
      'gasoline',
      { documents: { soatExpiresAt: '2027-01-01' } },
      {
        records: [{ id: 'f', kind: 'fuel', date: '2026-09-28', km: 20000, quantity: 5, unit: 'gal', fullTank: true }],
        componentConfigs: { oil: { enabled: true, interval: { km: 5000 } } },
      },
    );
    expect(gettingStartedSteps(data)).toEqual([]);
  });

  it('se muestra por defecto y "Omitir" se guarda como preferencia', () => {
    expect(DEFAULT_SETTINGS.showGettingStarted).toBe(true);
    const stored = sanitizeSettings({ settings: { ...DEFAULT_SETTINGS, showGettingStarted: false }, readNotificationIds: [] });
    expect(stored.settings.showGettingStarted).toBe(false);
    // Preferencias guardadas antes de esta versión: se muestra.
    expect(sanitizeSettings({ settings: { theme: 'light' }, readNotificationIds: [] }).settings.showGettingStarted).toBe(true);
  });
});
