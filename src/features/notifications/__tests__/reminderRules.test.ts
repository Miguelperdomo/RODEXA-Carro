/**
 * Validación de las notificaciones: reglas contra el spam del plan del teléfono,
 * avisos de documentos, mantenimiento, kilometraje e inactividad, la campana
 * dentro de la app y la programación en el teléfono. Fechas y valores: DATOS DE PRUEBA.
 */
import type { EnergyRecord, HistoryEntry } from '@/features/history/types';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { OnboardingData } from '@/features/session/types';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import type { Settings } from '@/features/settings/types';
import { toISODate } from '@/shared/utils/date';

import { buildNotifications } from '../build';
import { buildReminderPlan, MAX_REMINDERS, REMINDER_HOUR } from '../local/plan';
import { cancelAllReminders, syncReminders } from '../local/scheduler';
import type { PlannedReminder } from '../local/types';

// Teléfono simulado: lo que quedaría programado en Android.
const mockPhone = new Map<string, { content: { title: string; body: string; data: { url: string } }; trigger: { type: string; date: Date } }>();
jest.mock('../local/expoNotifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async (request) => {
    mockPhone.set(request.identifier, request);
    return request.identifier;
  }),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockPhone.keys()].map((identifier) => ({ identifier }))),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    mockPhone.delete(id);
  }),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
}));

// Solo en las pruebas (Node): para comprobar que las rutas existen, sin tipos de Node en el proyecto.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync } = require('fs') as { existsSync: (path: string) => boolean };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { join, resolve } = require('path') as { join: (...parts: string[]) => string; resolve: (path: string) => string };

const TODAY = new Date(2026, 8, 30, 10, 0); // 30/09/2026, 10:00
const HOUR = 3_600_000;

const fuel = (date: string, km = 20000): EnergyRecord => ({
  id: `f-${date}`,
  kind: 'fuel',
  date,
  km,
  quantity: 30,
  unit: 'L',
  fullTank: false,
});

type Scenario = {
  completedAt?: string;
  soat?: string;
  rtm?: string;
  records?: HistoryEntry[];
  oilDue?: boolean;
};

/** Carro de gasolina con lo que pida cada prueba. */
function appData({ completedAt = '2026-09-28', soat, rtm, records = [], oilDue = false }: Scenario = {}) {
  const onboarding: OnboardingData = {
    user: { name: 'Ana', city: '' },
    profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
    km: 20000,
    // Aceite cada 5.000 km o 6 meses; cambiado hace 7 meses → vencido por tiempo.
    maintenance: oilDue ? [{ code: 'oil', date: '2026-02-20', km: 19500, costCop: null }] : [],
    documents: { soatExpiresAt: soat, rtmExpiresAt: rtm },
    completedAt,
  };
  return buildAppDataFromOnboarding(onboarding, TODAY, {
    records,
    componentConfigs: oilDue ? { oil: { enabled: true, interval: { km: 5000, months: 6 } } } : undefined,
  });
}

/** Un carro "con todo": documentos por vencer, aceite vencido, tanqueos y km. */
const busy = () =>
  appData({ soat: '2026-10-20', rtm: '2026-10-25', oilDue: true, records: [fuel('2026-09-27')] });

const plan = (scenario?: Scenario, settings: Settings = DEFAULT_SETTINGS) =>
  buildReminderPlan(appData(scenario), settings, TODAY);

const isDocument = (r: PlannedReminder) => ['soat', 'technicalReview', 'license', 'document'].includes(r.category);
const SOFT = new Set(['mileage', 'fuel', 'inactivity']);

describe('teléfono: reglas contra el spam', () => {
  const list = buildReminderPlan(busy(), DEFAULT_SETTINGS, TODAY);

  it('el carro con todo genera avisos (no queda vacío)', () => {
    expect(list.length).toBeGreaterThan(3);
  });

  it('máximo 1 por día; solo los documentos pueden compartir día entre ellos', () => {
    const byDay = new Map<string, PlannedReminder[]>();
    for (const r of list) byDay.set(toISODate(r.fireAt), [...(byDay.get(toISODate(r.fireAt)) ?? []), r]);
    for (const sameDay of byDay.values()) {
      if (sameDay.length > 1) expect(sameDay.every(isDocument)).toBe(true);
    }
  });

  it('siempre a las 9:00, nunca en el pasado ni de inmediato', () => {
    for (const r of list) {
      expect(r.fireAt.getHours()).toBe(REMINDER_HOUR);
      expect(r.fireAt.getMinutes()).toBe(0);
      const lead = (r.fireAt.getTime() - TODAY.getTime()) / HOUR;
      expect(lead).toBeGreaterThanOrEqual(isDocument(r) ? 1 : 12);
    }
  });

  it('los avisos suaves (km, tanqueo, inactividad) quedan separados al menos 3 días', () => {
    const soft = list.filter((r) => SOFT.has(r.category)).map((r) => r.fireAt.getTime());
    for (let i = 1; i < soft.length; i++) expect(soft[i] - soft[i - 1]).toBeGreaterThanOrEqual(3 * 24 * HOUR);
  });

  it(`nunca más de ${MAX_REMINDERS} programados`, () => {
    expect(list.length).toBeLessThanOrEqual(MAX_REMINDERS);
  });

  it('ids únicos y estables: mismos datos → mismo plan (reprogramar no duplica)', () => {
    expect(new Set(list.map((r) => r.id)).size).toBe(list.length);
    expect(buildReminderPlan(busy(), DEFAULT_SETTINGS, TODAY)).toEqual(list);
  });

  it('al tocarla abre una pantalla que existe', () => {
    const appDir = resolve('src/app');
    const exists = (href: string) => {
      const path = href.split('?')[0].replace(/^\//, '');
      if (path === '') return true; // Inicio
      const parts = path.split('/');
      const candidates = [
        join(appDir, `${path}.tsx`),
        join(appDir, path, 'index.tsx'),
        join(appDir, '(tabs)', `${path}.tsx`),
        join(appDir, ...parts.slice(0, -1), `[${parts[0] === 'documentos' ? 'key' : 'code'}].tsx`),
      ];
      return candidates.some(existsSync);
    };
    for (const r of list) expect([r.href, exists(r.href)]).toEqual([r.href, true]);
  });
});

describe('teléfono: documentos', () => {
  it('SOAT: 30, 7 y 1 día antes y 1 vez el día después, en su fecha exacta', () => {
    const soat = plan({ soat: '2026-11-15' }).filter((r) => r.category === 'soat');
    expect(soat.map((r) => toISODate(r.fireAt))).toEqual(['2026-10-16', '2026-11-08', '2026-11-14', '2026-11-16']);
    expect(soat.every((r) => r.href === soat[0].href && r.href.startsWith('/documentos/'))).toBe(true);
  });

  it('SOAT que vence en 5 días: solo los avisos que aún no pasaron', () => {
    const soat = plan({ soat: '2026-10-05' }).filter((r) => r.category === 'soat');
    expect(soat.map((r) => toISODate(r.fireAt))).toEqual(['2026-10-04', '2026-10-06']);
  });

  it('SOAT y tecnomecánica el mismo día: salen los dos (los documentos no se corren)', () => {
    const docs = plan({ soat: '2026-11-15', rtm: '2026-11-15' }).filter(isDocument);
    expect(docs.filter((r) => toISODate(r.fireAt) === '2026-11-14')).toHaveLength(2);
  });

  it('sin fecha registrada no hay aviso (no se inventa)', () => {
    expect(plan().filter(isDocument)).toEqual([]);
  });
});

describe('teléfono: mantenimiento, kilometraje e inactividad', () => {
  it('aceite vencido con km actualizado hace poco: avisa', () => {
    const list = plan({ oilDue: true });
    expect(list.some((r) => r.category === 'maintenance' && r.href === '/mi-carro/componente/oil')).toBe(true);
  });

  it('aceite vencido con el km sin actualizar hace un mes: igual avisa, una vez por semana', () => {
    const oil = plan({ oilDue: true, completedAt: '2026-08-30' }).filter(
      (r) => r.category === 'maintenance' && r.href === '/mi-carro/componente/oil',
    );
    expect(oil.map((r) => toISODate(r.fireAt))).toEqual(['2026-10-05', '2026-10-12', '2026-10-19']);
  });

  it('el aviso semanal de mantenimiento conserva su id día a día (no se duplica)', () => {
    const data = appData({ oilDue: true, completedAt: '2026-08-30' });
    const ids = (day: Date) => buildReminderPlan(data, DEFAULT_SETTINGS, day).filter((r) => r.category === 'maintenance').map((r) => r.id);
    const today = ids(TODAY);
    const tomorrow = ids(new Date(2026, 9, 1, 10, 0));
    expect(tomorrow.slice(0, 2)).toEqual(today.slice(0, 2));
  });

  it('cuando se registra el cambio de aceite, deja de avisar', () => {
    const done: HistoryEntry = {
      id: 'm-1',
      kind: 'maintenance',
      date: '2026-09-29',
      km: 20000,
      types: ['oil'],
    };
    const list = plan({ oilDue: true, records: [done] });
    expect(list.some((r) => r.category === 'maintenance' && r.href === '/mi-carro/componente/oil')).toBe(false);
  });

  it('kilometraje: a los 7, 14 y 21 días de la última lectura', () => {
    // Solo el kilometraje (sin el aviso del puente de octubre, que comparte la regla de espacio).
    const km = plan(undefined, { ...DEFAULT_SETTINGS, longWeekendReminders: false }).filter((r) => r.category === 'mileage');
    expect(km.map((r) => toISODate(r.fireAt))).toEqual(['2026-10-05', '2026-10-12', '2026-10-19']);
  });

  it('inactividad: a los 12 y 25 días sin registrar nada, no más', () => {
    const idle = plan(undefined, { ...DEFAULT_SETTINGS, odometerReminders: false }).filter(
      (r) => r.category === 'inactivity',
    );
    expect(idle.map((r) => toISODate(r.fireAt))).toEqual(['2026-10-10', '2026-10-23']);
  });

  it('con los interruptores apagados no programa nada', () => {
    const off: Settings = {
      ...DEFAULT_SETTINGS,
      maintenanceReminders: false,
      documentReminders: false,
      odometerReminders: false,
      fuelReminders: false,
      activityReminders: false,
      longWeekendReminders: false,
    };
    expect(buildReminderPlan(busy(), off, TODAY)).toEqual([]);
  });
});

describe('dentro de la app (campana)', () => {
  const ids = (settings: Settings = DEFAULT_SETTINGS) =>
    buildNotifications(busy(), settings, TODAY).map((n) => n.id);

  it('muestra todo lo que requiere atención a la vez (sin límite diario)', () => {
    const list = ids();
    expect(list.some((id) => id.startsWith('maint-oil-due'))).toBe(true);
    expect(list.some((id) => id.startsWith('doc-soat'))).toBe(true);
    expect(list.some((id) => id.startsWith('doc-rtm'))).toBe(true);
  });

  it('kilometraje desactualizado solo desde los 7 días', () => {
    const at = (completedAt: string) =>
      buildNotifications(appData({ completedAt }), DEFAULT_SETTINGS, TODAY).some((n) => n.category === 'odometer');
    expect(at('2026-09-28')).toBe(false);
    expect(at('2026-09-20')).toBe(true);
  });

  it('respeta los mismos interruptores que el teléfono', () => {
    const list = ids({ ...DEFAULT_SETTINGS, maintenanceReminders: false, documentReminders: false });
    expect(list.some((id) => id.startsWith('maint-') || id.startsWith('doc-'))).toBe(false);
  });

  it('carro nuevo sin pendientes: solo el aviso de información incompleta', () => {
    const list = buildNotifications(appData(), DEFAULT_SETTINGS, TODAY);
    expect(list.map((n) => n.category)).toEqual(['system']);
    expect(list[0].title).toMatch(/^Información incompleta/);
  });
});

describe('programación en el teléfono', () => {
  beforeEach(async () => {
    mockPhone.clear();
    await cancelAllReminders();
  });

  it('programa cada aviso con fecha exacta, su pantalla y prefijo propio', async () => {
    const list = buildReminderPlan(busy(), DEFAULT_SETTINGS, TODAY);
    await syncReminders(list);
    expect(mockPhone.size).toBe(list.length);
    for (const r of list) {
      const scheduled = mockPhone.get(`rx-${r.id}`);
      expect(scheduled?.trigger).toMatchObject({ type: 'date', date: r.fireAt });
      expect(scheduled?.content).toMatchObject({ title: r.title, body: r.body, data: { url: r.href } });
    }
  });

  it('al reprogramar reemplaza: no duplica y quita los que ya no aplican', async () => {
    await syncReminders(buildReminderPlan(busy(), DEFAULT_SETTINGS, TODAY));
    const fewer = buildReminderPlan(appData({ soat: '2026-11-15' }), DEFAULT_SETTINGS, TODAY);
    await syncReminders(fewer);
    expect([...mockPhone.keys()].sort()).toEqual(fewer.map((r) => `rx-${r.id}`).sort());
  });

  it('no toca notificaciones que no son de RODEXA', async () => {
    mockPhone.set('otra-app', { content: { title: '', body: '', data: { url: '' } }, trigger: { type: 'date', date: TODAY } });
    await syncReminders(buildReminderPlan(busy(), DEFAULT_SETTINGS, TODAY));
    await cancelAllReminders();
    expect([...mockPhone.keys()]).toEqual(['otra-app']);
  });
});
