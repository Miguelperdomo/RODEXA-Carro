/** Estilo Tranqui / Al detalle: km aproximado, la pregunta del momento, combustible y avisos. */
import type { HistoryEntry } from '@/features/history/types';
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { buildNotifications } from '@/features/notifications/build';
import { estimateOdometer } from '@/features/odometer/estimate';
import { recurringDue, sanitizeRecurring, validateRecurring, type RecurringExpense } from '@/features/recurring/rules';
import { buildAppDataFromOnboarding, type BuildExtras } from '@/features/session/buildFromOnboarding';
import type { OnboardingData } from '@/features/session/types';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import type { Settings } from '@/features/settings/types';
import { effectiveSettings, USAGE_STYLES } from '@/features/settings/usageStyle';
import { sanitizeSettings } from '@/storage/settingsStore';

import { daysUntilMaintenanceAsk, tranquiAsk } from '../ask';
import {
  fuelWords,
  hidesFuel,
  monthlyFuelActive,
  monthlyFuelExpense,
  needsMonthlyFuelAmount,
  suggestStyle,
  SUGGEST_DETAIL_RECORDS,
} from '../style';

const TODAY = new Date(2026, 9, 2); // 2 de octubre de 2026
const base: OnboardingData = {
  user: { name: 'Ana', city: 'Ibagué' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
  km: 20000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-01',
};
const reading = (date: string, km: number): HistoryEntry => ({ id: `km-${date}`, kind: 'odometer', date, km });
// Aceite cada 5.000 km, último a los 16.500: con 20.600 registrados faltan 900 (al día);
// con el estimado de 20.930 faltan 570 (próximo).
const OIL = { oil: { enabled: true, interval: { km: 5000 }, lastService: { km: 16500, setAt: '2026-09-01' } } };
const build = (extras: BuildExtras = {}, today = TODAY) => buildAppDataFromOnboarding(base, today, extras);
const TRANQUI: Settings = { ...DEFAULT_SETTINGS, usageStyle: 'tranqui', fuelTracking: 'monthly' };

describe('km aproximado (según tu ritmo)', () => {
  it('con lecturas separadas al menos una semana: ritmo y km aproximado', () => {
    // 20.000 (1 sep) → 20.600 (21 sep): 30 km/día; 11 días después ≈ 20.930.
    expect(estimateOdometer([{ date: '2026-09-01', km: 20000 }], 20600, '2026-09-21', TODAY)).toEqual({
      kind: 'available',
      km: 20930,
      kmPerDay: 30,
    });
  });

  it('sin datos suficientes no se calcula', () => {
    expect(estimateOdometer([], 20600, '2026-09-21', TODAY).kind).toBe('insufficient');
    expect(estimateOdometer([{ date: '2026-09-18', km: 20500 }], 20600, '2026-09-21', TODAY).kind).toBe('insufficient');
    // Más de 2 meses sin lectura: se pregunta, no se adivina.
    expect(estimateOdometer([{ date: '2026-06-01', km: 19000 }], 20000, '2026-07-01', TODAY).kind).toBe('insufficient');
  });

  it('la app lo calcula con las lecturas reales; el km registrado no cambia', () => {
    const data = build({ records: [reading('2026-09-21', 20600)] });
    expect(data.odometer.estimate).toEqual({ kind: 'available', km: 20930, kmPerDay: 30 });
    expect(data.odometer.registeredKm).toBe(20600);
  });
});

describe('Tranqui pregunta en el momento justo', () => {
  it('"podría estar cerca": según el ritmo sí, según lo registrado todavía no', () => {
    const data = build({ records: [reading('2026-09-21', 20600)], componentConfigs: OIL });
    expect(tranquiAsk(data, TODAY, '')).toMatchObject({ kind: 'maintenance', estimateKm: 20930 });
    // El estimado no cambia el estado: con lo registrado el aceite sigue al día.
    expect(data.components.find((c) => c.code === 'oil')?.status).toBe('ok');
  });

  it('"Ahora no" la esconde hasta la fecha elegida', () => {
    const data = build({ records: [reading('2026-09-21', 20600)], componentConfigs: OIL });
    expect(tranquiAsk(data, TODAY, '2026-10-04')).toBeUndefined();
    expect(tranquiAsk(data, new Date(2026, 9, 5), '2026-10-04')).toBeDefined();
  });

  it('revisión del mes: 30 días o más sin km', () => {
    expect(tranquiAsk(build({}, new Date(2026, 9, 1)), new Date(2026, 9, 1), '')).toEqual({ kind: 'monthly', days: 30 });
    expect(tranquiAsk(build({}, new Date(2026, 8, 20)), new Date(2026, 8, 20), '')).toBeUndefined();
  });

  it('aviso del celular: cuándo el ritmo llegaría a "próximo"', () => {
    const data = build({ records: [reading('2026-09-21', 20600)], componentConfigs: OIL }, new Date(2026, 8, 22));
    const ask = daysUntilMaintenanceAsk(data, new Date(2026, 8, 22));
    expect(ask?.days).toBeGreaterThan(0);
    expect(ask?.title).toBeTruthy();
    // Sin ritmo conocido, nada.
    expect(daysUntilMaintenanceAsk(build(), TODAY)).toBeUndefined();
  });
});

describe('combustible en Tranqui', () => {
  it('"un valor al mes" pide el valor una sola vez', () => {
    expect(needsMonthlyFuelAmount(TRANQUI, [])).toBe(true);
    const item = monthlyFuelExpense(300000, TODAY, 'Combustible del mes');
    expect(item).toMatchObject({ category: 'fuel', amountCop: 300000, dayOfMonth: 31, note: 'Combustible del mes' });
    expect(needsMonthlyFuelAmount(TRANQUI, [item])).toBe(false);
    expect(needsMonthlyFuelAmount({ ...TRANQUI, usageStyle: 'detail' }, [])).toBe(false);
  });

  it('se confirma a fin de mes y en pausa no se pregunta', () => {
    const item = monthlyFuelExpense(300000, new Date(2026, 8, 1), 'Combustible del mes');
    expect(recurringDue([item], [], new Date(2026, 8, 30))).toHaveLength(1);
    expect(recurringDue([{ ...item, paused: true }], [], new Date(2026, 8, 30))).toHaveLength(0);
  });

  it('solo está activo en Tranqui con "un valor al mes"', () => {
    expect(monthlyFuelActive('tranqui', 'monthly')).toBe(true);
    expect(monthlyFuelActive('tranqui', 'none')).toBe(false);
    expect(monthlyFuelActive('detail', 'monthly')).toBe(false);
  });

  it('se guarda y se lee sin migraciones; el combustible no se ofrece como gasto fijo normal', () => {
    const item: RecurringExpense = { ...monthlyFuelExpense(300000, TODAY, 'Combustible del mes'), paused: true };
    expect(sanitizeRecurring([item])).toEqual([item]);
    expect(validateRecurring({ category: 'fuel', amountCop: 1000, dayOfMonth: 5 }).category).toBeDefined();
    expect(validateRecurring({ category: 'fuel', amountCop: 1000, dayOfMonth: 5 }, { allowFuel: true }).category).toBeUndefined();
  });

  it('un carro eléctrico habla de carga eléctrica', () => {
    expect(fuelWords({ energySource: 'electric' } as never).monthName).toBe('Carga eléctrica del mes');
    expect(fuelWords({ energySource: 'gasoline' } as never).monthName).toBe('Combustible del mes');
    expect(fuelWords(undefined).question).toBe('¿Y el combustible?');
  });

  it('"No lo llevo" oculta el paso de la primera carga', () => {
    expect(hidesFuel({ usageStyle: 'tranqui', fuelTracking: 'none' })).toBe(true);
    expect(hidesFuel({ usageStyle: 'detail', fuelTracking: 'none' })).toBe(false);
  });
});

describe('avisos según el estilo', () => {
  it('Tranqui apaga combustible, días sin registrar y revisión semanal, sin tocar lo guardado', () => {
    const saved = { ...TRANQUI, weeklyCheckEnabled: true };
    expect(effectiveSettings(saved)).toMatchObject({ fuelReminders: false, activityReminders: false, weeklyCheckEnabled: false });
    expect(effectiveSettings(saved).maintenanceReminders).toBe(true);
    expect(saved.fuelReminders).toBe(true);
    expect(effectiveSettings(DEFAULT_SETTINGS)).toBe(DEFAULT_SETTINGS);
  });

  it('el km se pide una vez al mes y la notificación "desactualizado" espera 30 días', () => {
    const data = build({}, new Date(2026, 8, 10));
    const tranquiPlan = buildReminderPlan(data, TRANQUI, new Date(2026, 8, 2)).filter((r) => r.category === 'mileage');
    expect(tranquiPlan.map((r) => r.id)).toEqual(['mileage-2026-09-01-30']);
    expect(tranquiPlan[0].href).toBe('/');
    const detailPlan = buildReminderPlan(data, DEFAULT_SETTINGS, new Date(2026, 8, 2)).filter((r) => r.category === 'mileage');
    expect(detailPlan.length).toBeGreaterThan(1);
    // 9 días sin km: en Al detalle ya avisa, en Tranqui todavía no.
    expect(buildNotifications(data, DEFAULT_SETTINGS, new Date(2026, 8, 10)).some((n) => n.category === 'odometer')).toBe(true);
    expect(buildNotifications(data, TRANQUI, new Date(2026, 8, 10)).some((n) => n.category === 'odometer')).toBe(false);
  });
});

describe('preferencias', () => {
  it('quien ya usa la app sigue en "Al detalle"; valores dañados se ignoran', () => {
    expect(DEFAULT_SETTINGS.usageStyle).toBe('detail');
    expect(sanitizeSettings({ settings: { usageStyle: 'tranqui', fuelTracking: 'none' } }).settings).toMatchObject({
      usageStyle: 'tranqui',
      fuelTracking: 'none',
    });
    expect(sanitizeSettings({ settings: { usageStyle: 'turbo', fuelTracking: 'diario' } }).settings).toMatchObject({
      usageStyle: 'detail',
      fuelTracking: 'each',
    });
  });

  it('solo los emojis permitidos (📊 Al detalle y 😎 Tranqui), "Al detalle" primero y con explicación', () => {
    expect(USAGE_STYLES.map((s) => `${s.emoji} ${s.title}`)).toEqual(['📊 Al detalle', '😎 Tranqui']);
    // Fuera del campo `emoji`, ningún texto lleva emojis.
    const texts = JSON.stringify(USAGE_STYLES.map((s) => [s.title, s.promise, s.points, s.details]));
    expect(texts).not.toMatch(/[☀-➿\u{1F300}-\u{1FAFF}]/u);
    expect(USAGE_STYLES.every((s) => s.details.length >= 4)).toBe(true);
  });
});

describe('pantallas', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
  const read = (p: string) => readFileSync(`src/app/${p}`, 'utf8');

  it('primer ingreso: Revisa tus datos → ¿Cómo quieres usar RODEXA? (Al detalle por defecto) → preparando', () => {
    expect(read('(onboarding)/resumen.tsx')).toContain("router.push('/estilo')");
    const style = read('(onboarding)/estilo.tsx');
    expect(style).toContain("useState<UsageStyle>('detail')");
    expect(style).toContain("router.replace('/preparando')");
    expect(style).toContain('Configuración → Mi estilo');
  });

  it('Configuración: "Mi estilo" con "¿Qué hace?" y el combustible solo en Tranqui', () => {
    const settings = read('configuracion.tsx');
    expect(settings).toContain('MI ESTILO');
    expect(settings).toContain("'¿Qué hace?'");
    expect(settings).toMatch(/settings\.usageStyle === 'tranqui' && \(\s*<SettingsSelectRow<FuelTracking>/);
  });
});

describe('sugerir el estilo que le va mejor', () => {
  const own = (n: number): HistoryEntry[] =>
    Array.from({ length: n }, (_, i) => ({ id: `e${i}`, kind: 'odometer', date: '2026-09-25', km: 20000 + i }));

  it('Tranqui con muchos registros → Al detalle', () => {
    expect(suggestStyle(own(SUGGEST_DETAIL_RECORDS), { usageStyle: 'tranqui', styleSuggestionSnoozedUntil: '' }, TODAY)).toBe('detail');
    expect(suggestStyle(own(2), { usageStyle: 'tranqui', styleSuggestionSnoozedUntil: '' }, TODAY)).toBeUndefined();
  });

  it('Al detalle sin registrar en 2 semanas → Tranqui; "No, gracias" lo pausa', () => {
    const start: HistoryEntry[] = [{ id: 'onb-km', kind: 'odometer', date: '2026-09-01', km: 20000 }];
    expect(suggestStyle(start, { usageStyle: 'detail', styleSuggestionSnoozedUntil: '' }, TODAY)).toBe('tranqui');
    expect(suggestStyle(start, { usageStyle: 'detail', styleSuggestionSnoozedUntil: '2026-12-01' }, TODAY)).toBeUndefined();
  });
});
