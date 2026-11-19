/**
 * Auditoría, prioridad 2: revisión semanal, costo por km del mes y del año, validación de
 * la copia, avisos en fila, km inicial corregible, tanqueo editado y millas. Datos de PRUEBA.
 */
import { stateFromRecord, resolveEnergyAmounts } from '@/features/energy/form';
import type { FuelRecord, HistoryEntry } from '@/features/history/types';
import { syncReminders } from '@/features/notifications/local/scheduler';
import type { PlannedReminder } from '@/features/notifications/local/types';
import { parseBackup, createBackup } from '@/features/pro/backup';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { computeMonthStats, computeRollingYearStats } from '@/features/stats/compute';
import { buildYearView } from '@/features/stats/screen';
import { weeklyReminders } from '@/features/weeklyCheck/rules';
import { costPerDistanceLabel, formatCostPerKm, traveledLabel } from '@/shared/utils/format';
import { getFormatPreferences, setFormatPreferences } from '@/shared/utils/formatPreferences';
import { EMPTY_STORED_USER_DATA, sanitizeUserData } from '@/storage/userDataStore';

import { buildAppDataFromOnboarding } from '../buildFromOnboarding';
import type { OnboardingData } from '../types';
import { isDeletableEntry, isEditableEntry, userDataActions as A } from '../userDataActions';

// Teléfono simulado con escrituras lentas, para mezclar dos sincronizaciones.
const mockPhone = new Map<string, unknown>();
const mockWait = () => new Promise((r) => setTimeout(r, 5));
jest.mock('@/features/notifications/local/expoNotifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async (request: { identifier: string }) => {
    await mockWait();
    mockPhone.set(request.identifier, request);
  }),
  getAllScheduledNotificationsAsync: jest.fn(async () => {
    await mockWait();
    return [...mockPhone.keys()].map((identifier) => ({ identifier }));
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    await mockWait();
    mockPhone.delete(id);
  }),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
}));

const onboarding: OnboardingData = {
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
  km: 150000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-01',
};

describe('revisión semanal: nunca deja de recordar', () => {
  it('activada el 1/8 y nunca hecha: el 3/10 sigue habiendo 3 avisos próximos', () => {
    const on = { ...DEFAULT_SETTINGS, weeklyCheckEnabled: true, weeklyCheckSince: '2026-08-01' };
    const list = weeklyReminders(on, new Date(2026, 9, 3, 12, 0));
    expect(list.map((r) => r.id)).toEqual(['weekly-2026-10-10', 'weekly-2026-10-17', 'weekly-2026-10-24']);
  });
});

describe('costo por km', () => {
  const km = (date: string, value: number): HistoryEntry => ({ id: `o-${date}`, kind: 'odometer', date, km: value });
  const expense = (date: string, amountCop: number): HistoryEntry => ({ id: `e-${date}`, kind: 'expense', date, category: 'parts', amountCop });

  it('mes cerrado con km medido solo los primeros días: no se calcula (antes daba $10.000/km)', () => {
    const entries = [km('2026-08-30', 10000), km('2026-09-03', 10150), expense('2026-09-15', 1500000)];
    const stats = computeMonthStats(entries, '2026-09', new Date(2026, 9, 3));
    expect(stats.costPerKmCop).toBeUndefined();
  });

  it('mes cerrado con lecturas al inicio y al final: sí se calcula', () => {
    const entries = [km('2026-08-30', 10000), km('2026-09-28', 11000), expense('2026-09-15', 200000)];
    expect(computeMonthStats(entries, '2026-09', new Date(2026, 9, 3)).costPerKmCop).toBe(200);
  });

  it('el año da lo mismo en Estadísticas y en Pro (carro con lecturas desde julio)', () => {
    const entries = [km('2026-07-01', 5000), expense('2026-08-10', 100000), km('2026-09-28', 6000)];
    const ref = new Date(2026, 9, 3);
    const pro = computeRollingYearStats(entries, ref);
    const free = buildYearView(entries, ref);
    expect(pro.costPerKmCop).toBe(100);
    expect(free.costPerKmCop).toBe(pro.costPerKmCop);
  });
});

describe('copia de seguridad: se valida por dentro', () => {
  it('un intervalo escrito como texto se descarta y se informa (nunca llega a los cálculos)', () => {
    const data = {
      ...EMPTY_STORED_USER_DATA,
      onboarding,
      componentConfigs: { oil: { enabled: true, interval: { km: '5000' } }, tires: { enabled: true, interval: { km: 10000 } } },
      profileEdits: { year: '2020', plate: 'ABC123', energySource: 'gasolina-rara' },
      userEdits: { name: 'Ana', city: 5 },
    };
    const result = parseBackup(createBackup(data as never, new Date(2026, 9, 3)));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.componentConfigs.oil).toEqual({ enabled: true });
    expect(result.data.componentConfigs.tires?.interval).toEqual({ km: 10000 });
    expect(result.data.profileEdits).toEqual({ plate: 'ABC123' });
    expect(result.data.userEdits).toEqual({ name: 'Ana' });
    expect(result.warnings.join(' ')).toMatch(/configuración inválido/);
  });

  it('datos correctos no generan avisos', () => {
    const data = { ...EMPTY_STORED_USER_DATA, onboarding, componentConfigs: { oil: { enabled: true, interval: { km: 5000, months: 6 } } } };
    expect(sanitizeUserData(JSON.parse(JSON.stringify(data))).problems).toEqual([]);
  });
});

describe('avisos: dos sincronizaciones seguidas no se mezclan', () => {
  const reminder = (id: string): PlannedReminder => ({ id, category: 'mileage', title: 't', body: 'b', fireAt: new Date(2030, 0, 1), href: '/' });

  it('queda programado exactamente el último plan', async () => {
    mockPhone.clear();
    const a = syncReminders([reminder('soat-viejo'), reminder('km-1')]);
    const b = syncReminders([reminder('soat-nuevo')]);
    await Promise.all([a, b]);
    expect([...mockPhone.keys()]).toEqual(['rx-soat-nuevo']);
  });
});

describe('km inicial', () => {
  it('se puede corregir (no borrar) y los cálculos usan el valor corregido', () => {
    expect(isEditableEntry('onb-km')).toBe(true);
    expect(isDeletableEntry('onb-km')).toBe(false);
    const stored = { ...EMPTY_STORED_USER_DATA, onboarding };
    const fixed = A.editEntry(stored, 'onb-km', { id: 'onb-km', kind: 'odometer', date: '2026-09-01', km: 15000 });
    expect(fixed.onboarding?.km).toBe(15000);
    const data = buildAppDataFromOnboarding(fixed.onboarding!, new Date(2026, 9, 3), {
      records: [{ id: 'k', kind: 'odometer', date: '2026-09-20', km: 15500 }],
    });
    expect(data.odometer.registeredKm).toBe(15500);
  });
});

describe('editar un tanqueo con la cantidad calculada', () => {
  it('si cambias lo pagado, la cantidad se vuelve a calcular', () => {
    const record: FuelRecord = { id: 'f', kind: 'fuel', date: '2026-09-28', km: 1, quantity: 6.25, unit: 'gal', fullTank: true, costCop: 100000, unitPriceCop: 16000 };
    const state = stateFromRecord(record);
    expect(state.exactQuantity).toBeNull();
    const amounts = resolveEnergyAmounts({ costCop: 120000, unitPriceCop: state.unitPriceCop, exactQuantity: state.exactQuantity, priceIsSuggestion: false });
    expect(amounts.quantity).toBe(7.5);
  });

  it('una cantidad escrita a mano (no cuadra exacto) se respeta', () => {
    const record: FuelRecord = { id: 'f', kind: 'fuel', date: '2026-09-28', km: 1, quantity: 6.3, unit: 'gal', fullTank: true, costCop: 100000, unitPriceCop: 16000 };
    expect(stateFromRecord(record).exactQuantity).toBe(6.3);
  });
});

describe('millas', () => {
  const original = getFormatPreferences();
  afterEach(() => setFormatPreferences(original));

  it('con millas, el costo y las etiquetas se muestran por milla', () => {
    setFormatPreferences({ ...original, distanceUnit: 'mi' });
    expect(costPerDistanceLabel()).toBe('Costo por mi');
    expect(traveledLabel()).toBe('Millas recorridas');
    expect(formatCostPerKm(100)).toBe('~$161');
  });

  it('con km, igual que antes', () => {
    setFormatPreferences({ ...original, distanceUnit: 'km' });
    expect(costPerDistanceLabel()).toBe('Costo por km');
    expect(formatCostPerKm(100)).toBe('~$100');
  });
});
