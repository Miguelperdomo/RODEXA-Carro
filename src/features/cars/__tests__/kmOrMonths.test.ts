/** Intervalo por km, por meses o ambos ("lo que llegue primero"). Datos de PRUEBA. */
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { OnboardingData } from '@/features/session/types';

import { buildComponentDetail } from '../componentDetail';
import type { ComponentSummary } from '../types';
import { validateComponentConfig } from '../validation';

const TODAY = new Date(2026, 8, 30); // 30/09/2026
const CURRENT_KM = 20000;

const oil = (interval: { km?: number; months?: number } | undefined, lastService?: { km?: number; date?: string }): ComponentSummary => ({
  code: 'oil',
  title: 'Aceite de motor',
  icon: 'oil',
  enabled: true,
  applicability: 'applies',
  status: 'nodata',
  detail: '',
  interval: interval ? { ...interval, origin: 'user' } : undefined,
  lastService,
});
const detail = (c: ComponentSummary) => buildComponentDetail(c, [], CURRENT_KM, TODAY);

describe('solo km o solo meses (como antes)', () => {
  it('solo km', () => {
    const d = detail(oil({ km: 5000 }, { km: 18000 }));
    expect(d).toMatchObject({ tracking: 'km', ready: true, status: 'ok', remaining: 'Faltan 3.000 km', interval: 'Cada 5.000 km' });
  });

  it('solo meses (p. ej. aceite cada 6 meses)', () => {
    const d = detail(oil({ months: 6 }, { date: '2026-08-30' }));
    expect(d).toMatchObject({ tracking: 'time', ready: true, status: 'ok', interval: 'Cada 6 meses' });
  });
});

describe('km y meses: lo que llegue primero', () => {
  it('el texto del intervalo lo dice', () => {
    expect(detail(oil({ km: 5000, months: 6 })).interval).toBe('Cada 5.000 km o 6 meses, lo que llegue primero');
  });

  it('se cumplieron los meses antes que los km → vencido por tiempo', () => {
    // 1.000 km recorridos de 5.000, pero ya pasaron más de 6 meses.
    const d = detail(oil({ km: 5000, months: 6 }, { km: 19000, date: '2026-03-01' }));
    expect(d).toMatchObject({ tracking: 'both', status: 'due' });
    expect(d.remaining).toMatch(/Se cumplió hace/);
    expect(d.next).toBe('24.000 km o 01/09/2026');
  });

  it('se cumplieron los km antes que los meses → vencido por km', () => {
    const d = detail(oil({ km: 5000, months: 6 }, { km: 14000, date: '2026-09-01' }));
    expect(d).toMatchObject({ status: 'due', remaining: 'Pasaron 1.000 km del previsto' });
  });

  it('con un lado próximo y el otro al día, manda el próximo', () => {
    // km: faltan 500 de 5.000 (próximo); meses: recién cambiado (al día).
    const d = detail(oil({ km: 5000, months: 6 }, { km: 15500, date: '2026-09-20' }));
    expect(d).toMatchObject({ status: 'soon', remaining: 'Faltan 500 km' });
  });

  it('configuró ambos pero solo sabe la fecha: calcula por tiempo y dice qué falta', () => {
    const d = detail(oil({ km: 5000, months: 6 }, { date: '2026-08-30' }));
    expect(d).toMatchObject({ ready: true, status: 'ok' });
    expect(d.partialNote).toMatch(/kilometraje del último cambio/);
  });

  it('configuró ambos sin ningún dato del último cambio: no calcula (nunca "al día")', () => {
    const d = detail(oil({ km: 5000, months: 6 }));
    expect(d.ready).toBe(false);
    expect(d.status).toBeUndefined();
    expect(d.requirements.filter((r) => !r.done).map((r) => r.short)).toEqual(['km del último cambio', 'fecha del último cambio']);
  });
});

describe('en Inicio', () => {
  it('aceite "cada 5.000 km o 6 meses" vencido por tiempo aparece como vencido y en recomendaciones', () => {
    const onboarding: OnboardingData = {
      user: { name: 'Ana', city: '' },
      profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
      km: CURRENT_KM,
      maintenance: [{ code: 'oil', date: '2026-03-01', km: 19500, costCop: null }],
      documents: {},
      completedAt: '2026-09-25',
    };
    const data = buildAppDataFromOnboarding(onboarding, TODAY, {
      componentConfigs: { oil: { enabled: true, interval: { km: 5000, months: 6 } } },
    });
    expect(data.components.find((c) => c.code === 'oil')?.status).toBe('due');
    expect(data.dashboard.recommendations.map((r) => r.id)).toContain('maint-oil-due');
  });
});

describe('validación', () => {
  const base = { enabled: true, lastKm: null, lastUnknown: false, intervalKm: null, intervalMonths: null, currentKm: CURRENT_KM };

  it('pide al menos km o meses', () => {
    expect(validateComponentConfig(base).intervalKm).toBeDefined();
  });

  it('solo meses, solo km o ambos son válidos; 0 no', () => {
    expect(validateComponentConfig({ ...base, intervalMonths: 6 })).toEqual({});
    expect(validateComponentConfig({ ...base, intervalKm: 5000 })).toEqual({});
    expect(validateComponentConfig({ ...base, intervalKm: 5000, intervalMonths: 6 })).toEqual({});
    expect(validateComponentConfig({ ...base, intervalMonths: 0 }).intervalMonths).toBeDefined();
  });
});
