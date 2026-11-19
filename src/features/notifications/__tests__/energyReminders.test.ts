/** Recordatorios de abastecimiento por tipo de energía. Fechas y valores: DATOS DE PRUEBA. */
import type { EnergySource } from '@/features/cars/types';
import type { EnergyRecord, HistoryEntry } from '@/features/history/types';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { OnboardingData } from '@/features/session/types';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { sanitizeSettings } from '@/storage/settingsStore';

import { buildReminderPlan } from '../local/plan';

const TODAY = new Date(2026, 8, 30); // 30/09/2026

const fuel = (date: string, fullTank = false, km = 1000): EnergyRecord => ({
  id: `f-${date}-${km}`,
  kind: 'fuel',
  date,
  km,
  quantity: 30,
  unit: 'L',
  fullTank,
});
const cng = (date: string): EnergyRecord => ({ id: `g-${date}`, kind: 'cng', date, km: 1000, quantity: 15, fullFill: false });
const charge = (date: string): EnergyRecord => ({ id: `c-${date}`, kind: 'charge', date, km: 1000, quantity: 20 });

/** Solo recordatorios de abastecimiento (los demás apagados para aislar la prueba). */
const settings = {
  ...DEFAULT_SETTINGS,
  odometerReminders: false,
  activityReminders: false,
  maintenanceReminders: false,
  documentReminders: false,
  longWeekendReminders: false,
};

function reminders(energySource: EnergySource, records: HistoryEntry[], overrides = {}) {
  const onboarding: OnboardingData = {
    user: { name: 'Ana', city: '' },
    profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
    km: 900,
    maintenance: [],
    documents: {},
    completedAt: '2026-09-01',
  };
  const data = buildAppDataFromOnboarding(onboarding, TODAY, { records });
  return buildReminderPlan(data, { ...settings, ...overrides }, TODAY);
}
const kinds = (list: ReturnType<typeof reminders>) =>
  [...new Set(list.map((r) => new URLSearchParams(r.href.split('?')[1]).get('tipo')))].sort();

describe('recordatorios de abastecimiento según la energía del carro', () => {
  it('GNC puro: solo GNC (un tanqueo de gasolina registrado antes no genera aviso)', () => {
    const list = reminders('cng', [cng('2026-09-28'), fuel('2026-09-28')]);
    expect(kinds(list)).toEqual(['cng']);
    expect(list.every((r) => r.title === 'GNC')).toBe(true);
  });

  it('GNC + gasolina (dual): GNC y combustible', () => {
    expect(kinds(reminders('cng_gasoline', [cng('2026-09-15'), fuel('2026-09-28')]))).toEqual(['cng', 'fuel']);
  });

  it('eléctrico: solo carga eléctrica', () => {
    const list = reminders('electric', [charge('2026-09-28'), fuel('2026-09-28')]);
    expect(kinds(list)).toEqual(['charge']);
    expect(list.every((r) => r.title === 'Carga eléctrica')).toBe(true);
  });

  it('PHEV: combustible y carga eléctrica, cada uno por su propio último registro', () => {
    const list = reminders('phev_gasoline', [fuel('2026-09-28'), charge('2026-09-15')]);
    expect(kinds(list)).toEqual(['charge', 'fuel']);
  });

  it('gasolina y diésel: solo combustible; nunca GNC ni carga', () => {
    expect(kinds(reminders('gasoline', [fuel('2026-09-28'), charge('2026-09-15'), cng('2026-09-15')]))).toEqual(['fuel']);
    expect(kinds(reminders('diesel', [fuel('2026-09-28')]))).toEqual(['fuel']);
  });

  it('HEV no enchufable: nunca aviso de carga eléctrica', () => {
    expect(kinds(reminders('hybrid_gasoline', [fuel('2026-09-28'), charge('2026-09-15')]))).toEqual(['fuel']);
  });

  it('"No sé" / otro: ningún aviso, aunque haya registros viejos', () => {
    const records = [fuel('2026-09-28'), cng('2026-09-28'), charge('2026-09-28')];
    expect(reminders('unknown', records)).toEqual([]);
    expect(reminders('other', records)).toEqual([]);
  });

  it('sin registros de ese tipo no hay aviso (no se inventa una fecha)', () => {
    expect(reminders('electric', [])).toEqual([]);
    expect(reminders('cng', [fuel('2026-09-28')])).toEqual([]);
  });

  it('se basa en el último registro: a los 10 y 20 días, y abre el registro de ese tipo', () => {
    const list = reminders('electric', [charge('2026-09-28')]).filter((r) => !r.id.includes('tip'));
    expect(list.map((r) => r.fireAt.getDate())).toEqual([8, 18]);
    expect(list.every((r) => r.href === '/registrar/energia?tipo=charge')).toBe(true);
  });

  it('consejo de consumo solo mientras no haya tramos comparables', () => {
    expect(reminders('gasoline', [fuel('2026-09-28')]).some((r) => r.id.includes('tip'))).toBe(true);
    const withPair = [fuel('2026-09-20', true, 1000), fuel('2026-09-28', true, 1400)];
    expect(reminders('gasoline', withPair).some((r) => r.id.includes('tip'))).toBe(false);
  });

  it('con el interruptor apagado no hay avisos de ningún tipo', () => {
    expect(reminders('phev_gasoline', [fuel('2026-09-28'), charge('2026-09-28')], { fuelReminders: false })).toEqual([]);
  });

  it('los avisos de tanqueo conservan su id de antes (no se duplican al reprogramar)', () => {
    const ids = reminders('gasoline', [fuel('2026-09-28')]).map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['fuel-2026-09-28-10', 'fuel-2026-09-28-20', 'fuel-tip-2026-09-28']));
  });
});

describe('preferencia eliminada', () => {
  it('"Mostrar documentos próximos a vencer" ya no existe; una guardada antes se ignora sin errores', () => {
    expect('showUpcomingDocuments' in DEFAULT_SETTINGS).toBe(false);
    const { settings: loaded } = sanitizeSettings({ settings: { showUpcomingDocuments: false, remindSoat: false } });
    expect('showUpcomingDocuments' in loaded).toBe(false);
    expect(loaded.remindSoat).toBe(false);
  });
});
