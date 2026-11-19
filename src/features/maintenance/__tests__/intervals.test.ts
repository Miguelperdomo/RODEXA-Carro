import { COMPONENTS } from '@/features/cars/catalog';
import { buildComponentDetail } from '@/features/cars/componentDetail';
import type { CarProfile } from '@/features/cars/types';
import { validateComponentConfig } from '@/features/cars/validation';
import { EMPTY_FORM, recentOptionsFor, toOnboardingData } from '@/features/onboarding/form';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { OnboardingData } from '@/features/session/types';

import { MAINTENANCE_ITEMS } from '../catalog';
import { MANUFACTURER_INTERVALS } from '../data/manufacturerIntervals';
import {
  findManufacturerInterval,
  intervalOriginText,
  NO_INTERVAL_MESSAGE,
  resolveInterval,
  type ManufacturerInterval,
} from '../intervals';

const profile: CarProfile = {
  id: 'car-1',
  brandCode: 'mazda',
  brandName: 'Mazda',
  modelId: 'mazda-3',
  model: 'Mazda 3',
  year: 2022,
  energySource: 'gasoline',
  displacementCc: 2000,
};

/** Entrada de PRUEBA (no es un dato real): solo verifica que la estructura funcione. */
const sourced: ManufacturerInterval = {
  modelId: 'mazda-3',
  years: { from: 2020, to: 2024 },
  energySources: ['gasoline'],
  component: 'oil',
  km: 1234,
  condition: 'Uso normal',
  source: { type: 'official_manual', name: 'Manual de prueba', reference: 'Pág. 1', verifiedAt: '2026-01-01' },
};

describe('12. no se inventan intervalos', () => {
  it('la tabla de intervalos del fabricante está vacía (sin datos verificados)', () => {
    expect(MANUFACTURER_INTERVALS).toEqual([]);
  });

  it('el catálogo de mantenimientos y los componentes no traen cifras de intervalo', () => {
    for (const entry of [...MAINTENANCE_ITEMS, ...COMPONENTS]) {
      expect(entry).not.toHaveProperty('km');
      expect(entry).not.toHaveProperty('months');
      expect(entry).not.toHaveProperty('interval');
    }
  });

  it('sin configuración ni fuente, no hay intervalo', () => {
    expect(resolveInterval(profile, 'oil', undefined)).toBeUndefined();
    expect(resolveInterval(profile, 'oil', { km: 0 })).toBeUndefined();
  });

  it('un carro nuevo sin configuración: ningún componente tiene intervalo y ninguno calcula estado', () => {
    const onboarding: OnboardingData = {
      user: { name: 'Ana', city: '' },
      profile,
      km: 20000,
      maintenance: [{ code: 'oil', date: '2026-08-01', km: 19000, costCop: null }],
      documents: {},
      completedAt: '2026-09-01',
    };
    const data = buildAppDataFromOnboarding(onboarding, new Date(2026, 8, 20));
    for (const component of data.components) {
      expect(component.interval).toBeUndefined();
      expect(['nodata', 'na']).toContain(component.status);
    }
    // Se pide configurarlo (no se propone una cifra).
    expect(data.dashboard.recommendations.map((r) => r.id)).toContain('oil-setup');
  });

  it('el detalle explica que faltan datos y remite al manual', () => {
    const detail = buildComponentDetail(
      { code: 'oil', title: 'Aceite de motor', icon: 'oil', enabled: true, applicability: 'applies', status: 'nodata', detail: '' },
      [],
      20000,
      new Date(2026, 8, 20),
    );
    expect(detail.ready).toBe(false);
    expect(detail.interval).toBeUndefined();
    expect(detail.intervalHint).toBe(NO_INTERVAL_MESSAGE);
    expect(detail.requirements.some((r) => !r.done)).toBe(true);
  });

  it('una entrada del fabricante sin fuente verificable se ignora', () => {
    const noSource = { ...sourced, source: { type: 'manufacturer' as const, name: 'Algo' } };
    const demo = { ...sourced, source: { type: 'demo' as const, name: 'Demo', reference: 'x' } };
    expect(findManufacturerInterval(profile, 'oil', [noSource, demo])).toBeUndefined();
  });

  it('no aplica a otro año, otra energía ni si falta el año', () => {
    expect(findManufacturerInterval({ ...profile, year: 2019 }, 'oil', [sourced])).toBeUndefined();
    expect(findManufacturerInterval({ ...profile, energySource: 'diesel' }, 'oil', [sourced])).toBeUndefined();
    expect(findManufacturerInterval({ ...profile, year: undefined }, 'oil', [sourced])).toBeUndefined();
  });
});

describe('origen del intervalo', () => {
  it('configurado por el usuario queda marcado como tal', () => {
    const interval = resolveInterval(profile, 'oil', { km: 8000 });
    expect(interval).toEqual({ km: 8000, origin: 'user' });
    expect(intervalOriginText(interval!)).toBe('Configurado por ti');
  });

  it('del fabricante: guarda fuente, referencia y fecha', () => {
    const interval = resolveInterval(profile, 'oil', undefined, [sourced]);
    expect(interval?.origin).toBe('manufacturer');
    expect(interval?.source?.reference).toBe('Pág. 1');
    expect(intervalOriginText(interval!)).toBe('Según fabricante/manual: Manual de prueba · Pág. 1 · verificado 2026-01-01');
  });

  it('lo que configura el usuario manda sobre la fuente', () => {
    expect(resolveInterval(profile, 'oil', { km: 8000 }, [sourced])?.origin).toBe('user');
  });

  it('con intervalo de fuente, el del usuario pasa a ser opcional', () => {
    const base = { enabled: true, lastKm: 100, lastUnknown: false, intervalKm: null, intervalMonths: null, currentKm: 200 };
    expect(validateComponentConfig(base).intervalKm).toBeDefined();
    expect(validateComponentConfig({ ...base, hasSourcedInterval: true }).intervalKm).toBeUndefined();
    expect(validateComponentConfig({ ...base, intervalKm: 0, hasSourcedInterval: true }).intervalKm).toBeDefined();
  });
});

describe('primer ingreso: mantenimientos recientes según el vehículo', () => {
  it('un eléctrico no ve "Aceite"; uno de gasolina sí', () => {
    const ev = recentOptionsFor({ ...EMPTY_FORM.car, energySource: 'electric' }).map((o) => o.value);
    const gas = recentOptionsFor({ ...EMPTY_FORM.car, energySource: 'gasoline' }).map((o) => o.value);
    expect(ev).not.toContain('oil');
    expect(gas).toContain('oil');
  });

  it('si marcó aceite y luego cambió a eléctrico, ese mantenimiento no se guarda', () => {
    const form = {
      ...EMPTY_FORM,
      name: 'Ana',
      car: { ...EMPTY_FORM.car, brandId: 'byd', modelId: 'byd-dolphin', year: 2025, energySource: 'electric' as const },
      km: 5000,
      recent: {
        oil: { date: new Date(2026, 7, 1), km: 4000, kmUnknown: false, cost: null, tires: null, description: '' },
        brakes: { date: new Date(2026, 7, 1), km: 4000, kmUnknown: false, cost: null, tires: null, description: '' },
      },
    };
    const codes = toOnboardingData(form, new Date(2026, 8, 1)).maintenance.map((m) => m.code);
    expect(codes).toEqual(['brake_check']);
  });
});
