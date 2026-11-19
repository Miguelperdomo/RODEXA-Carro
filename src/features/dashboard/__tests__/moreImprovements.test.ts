/** Récords, apodo, aviso antes de viajar, km de llantas y revisión semanal. Datos de PRUEBA. */
import { buildComponentDetail } from '@/features/cars/componentDetail';
import type { EnergySource } from '@/features/cars/types';
import type { HistoryEntry } from '@/features/history/types';
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { ComponentConfig, OnboardingData } from '@/features/session/types';
import { userDataActions } from '@/features/session/userDataActions';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { carRecords } from '@/features/stats/records';
import { buildTripReview, preTripSuggestions } from '@/features/travel/review';
import { isWeeklyDue, weeklyItemsFor, weeklyReminders, weeklyStatusText } from '@/features/weeklyCheck/rules';
import { EMPTY_STORED_USER_DATA, sanitizeUserData } from '@/storage/userDataStore';

const TODAY = new Date(2026, 8, 30, 8, 0);

const onboarding = (energySource: EnergySource, d: Partial<OnboardingData> = {}): OnboardingData => ({
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
  km: 20000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-25',
  ...d,
});
const build = (energySource: EnergySource, d: Partial<OnboardingData> = {}, componentConfigs: Partial<Record<string, ComponentConfig>> = {}) =>
  buildAppDataFromOnboarding(onboarding(energySource, d), TODAY, { componentConfigs } as never);
const profileOf = (energySource: EnergySource) => build(energySource).profile;

describe('récords de tu carro', () => {
  const fuel = (id: string, date: string, km: number, quantity: number, costCop?: number): HistoryEntry => ({
    id, kind: 'fuel', date, km, quantity, unit: 'gal', fullTank: true, costCop,
  });

  it('gasolina en galones: carga de combustible más cara, galón más caro, mejor consumo en km/gal y mes con más km', () => {
    const entries: HistoryEntry[] = [
      { id: 'o0', kind: 'odometer', date: '2026-07-31', km: 9000 },
      fuel('a', '2026-08-01', 10000, 10, 150000),
      fuel('b', '2026-08-20', 10400, 10, 162000),
      fuel('c', '2026-09-05', 10700, 6, 96000),
      { id: 'o1', kind: 'odometer', date: '2026-08-31', km: 10500 },
    ];
    const byKey = Object.fromEntries(carRecords(entries, profileOf('gasoline'), TODAY).map((r) => [r.key, r]));
    expect(byKey['fuel-most-expensive']).toMatchObject({ title: 'Carga de combustible más cara', value: '$162.000' });
    expect(byKey['fuel-highest-price']).toMatchObject({ title: 'Galón más caro', value: '$16.200/gal' });
    expect(byKey['fuel-best-consumption']).toMatchObject({ title: 'Mejor consumo', value: '50 km/gal' });
    expect(byKey['km-month']).toMatchObject({ title: 'Mes con más km', value: '1.500 km', detail: 'Agosto 2026' });
  });

  it('GNC y eléctrico con sus unidades; en un PHEV cada energía por separado', () => {
    const entries: HistoryEntry[] = [
      { id: 'g', kind: 'cng', date: '2026-09-01', km: 1, quantity: 10, fullFill: false, costCop: 30000 },
      { id: 'c', kind: 'charge', date: '2026-09-02', km: 1, quantity: 20, costCop: 24000 },
    ];
    const cng = carRecords([entries[0]], profileOf('cng'), TODAY).map((r) => [r.title, r.value]);
    expect(cng).toEqual([['Carga de GNC más cara', '$30.000'], ['m³ más caro', '$3.000/m³']]);
    const ev = carRecords([entries[1]], profileOf('electric'), TODAY).map((r) => [r.title, r.value]);
    expect(ev).toEqual([['Carga eléctrica más cara', '$24.000'], ['kWh más caro', '$1.200/kWh']]);
    const phev = carRecords([...entries, fuel('f', '2026-09-03', 2, 5, 80000)], profileOf('phev_gasoline'), TODAY).map((r) => r.title);
    expect(phev).toEqual(expect.arrayContaining(['Carga de combustible más cara', 'Galón más caro · Combustible', 'Carga eléctrica más cara', 'kWh más caro · Electricidad']));
  });

  it('sin costos ni tramos: no se inventa ningún récord', () => {
    const entries: HistoryEntry[] = [{ id: 'c', kind: 'charge', date: '2026-09-02', km: 1, quantity: 20 }];
    expect(carRecords(entries, profileOf('electric'), TODAY)).toEqual([]);
    expect(carRecords([], profileOf('gasoline'), TODAY)).toEqual([]);
  });
});

describe('apodo del carro', () => {
  it('se guarda y sobrevive a cerrar la app', () => {
    const withCar = { ...EMPTY_STORED_USER_DATA, onboarding: onboarding('gasoline') };
    const saved = userDataActions.updateCar(withCar, { nickname: 'La Negra' });
    const reloaded = sanitizeUserData(JSON.parse(JSON.stringify(saved))).data;
    expect({ ...reloaded.onboarding?.profile, ...reloaded.profileEdits }.nickname).toBe('La Negra');
  });
});

describe('antes de un viaje largo', () => {
  it('aceite próximo: sugiere cambiarlo antes de salir', () => {
    const data = build(
      'gasoline',
      { maintenance: [{ code: 'oil', date: '2026-08-01', km: 15600, costCop: null }] },
      { oil: { enabled: true, interval: { km: 5000 } } },
    );
    const suggestions = preTripSuggestions(buildTripReview(data, TODAY));
    expect(suggestions[0]).toMatchObject({ code: 'oil', level: 'soon' });
    expect(suggestions[0].text).toMatch(/antes de un viaje largo/);
  });

  it('todo al día: sin sugerencias', () => {
    const data = build(
      'gasoline',
      { maintenance: [{ code: 'oil', date: '2026-09-20', km: 19900, costCop: null }] },
      { oil: { enabled: true, interval: { km: 5000 } } },
    );
    expect(preTripSuggestions(buildTripReview(data, TODAY))).toEqual([]);
  });
});

describe('km de las llantas', () => {
  it('cuenta los km desde el último cambio (sin decir cuánto duran)', () => {
    const data = build('gasoline', { maintenance: [{ code: 'tire_front', date: '2026-03-01', km: 12000, costCop: null }] }, {
      tires: { enabled: true },
    });
    const tires = data.components.find((c) => c.code === 'tires');
    expect(tires).toBeDefined();
    const detail = buildComponentDetail(tires!, data.history, 20000, TODAY);
    expect(detail.lastService?.kmSince).toBe(8000);
  });

  it('sin km del cambio: no se calcula', () => {
    const data = build('gasoline', { maintenance: [{ code: 'tire_front', date: '2026-03-01', km: null, costCop: null }] }, {
      tires: { enabled: true },
    });
    const tires = data.components.find((c) => c.code === 'tires')!;
    expect(buildComponentDetail(tires, data.history, 20000, TODAY).lastService?.kmSince).toBeUndefined();
  });
});

describe('revisión semanal', () => {
  it('5 puntos; un eléctrico no ve aceite', () => {
    expect(weeklyItemsFor(profileOf('gasoline')).map((i) => i.key)).toEqual(['tires', 'lights', 'brakes', 'oil', 'fluids']);
    expect(weeklyItemsFor(profileOf('electric')).map((i) => i.key)).toEqual(['tires', 'lights', 'brakes', 'fluids', 'dashboard']);
  });

  it('opcional: apagada por defecto, sin tarjeta ni recordatorios', () => {
    expect(isWeeklyDue(DEFAULT_SETTINGS, TODAY)).toBe(false);
    expect(weeklyReminders(DEFAULT_SETTINGS, TODAY)).toEqual([]);
  });

  it('activada: toca cada 7 días y recuerda a las 10:00 a. m.', () => {
    const on = { ...DEFAULT_SETTINGS, weeklyCheckEnabled: true, weeklyCheckSince: '2026-09-20', weeklyCheckLastDone: '2026-09-27' };
    expect(isWeeklyDue(on, TODAY)).toBe(false);
    expect(weeklyStatusText(on, TODAY)).toBe('Revisada hace 3 días');
    expect(isWeeklyDue({ ...on, weeklyCheckLastDone: '2026-09-23' }, TODAY)).toBe(true);
    expect(isWeeklyDue({ ...on, weeklyCheckLastDone: '' }, TODAY)).toBe(true);
    const reminders = weeklyReminders(on, TODAY);
    expect(reminders.map((r) => r.id)).toEqual(['weekly-2026-10-04', 'weekly-2026-10-11', 'weekly-2026-10-18']);
    expect(reminders[0].fireAt.getHours()).toBe(10);
  });

  it('se suman al plan sin quitar los demás avisos', () => {
    const data = build('gasoline');
    const on = { ...DEFAULT_SETTINGS, weeklyCheckEnabled: true, weeklyCheckSince: '2026-09-30' };
    const plan = buildReminderPlan(data, on, TODAY);
    expect(plan.filter((r) => r.category === 'weeklyCheck')).toHaveLength(3);
    expect(plan.filter((r) => r.category !== 'weeklyCheck')).toEqual(buildReminderPlan(data, DEFAULT_SETTINGS, TODAY));
  });
});
