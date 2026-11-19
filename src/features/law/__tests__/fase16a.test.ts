/** Fase 16A: comparendos con días hábiles, multas y tarifa del SOAT (aproximadas), "¿Estoy en regla?". */
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { searchDestinations } from '@/features/search/destinations';
import { APP_ROUTES } from '@/features/session/appRoutes';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

import {
  addBusinessDays,
  businessDaysLeft,
  discountDeadlines,
  discountState,
  discountText,
  fineReminderDates,
  isBusinessDay,
  sanitizeFines,
  type FineRecord,
} from '../fines';
import { fineCop, ROAD_KIT, soatFamilyCarPrice, UVB_COP } from '../values';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
const read = (p: string) => readFileSync(`src/${p}`, 'utf8');
const d = (iso: string) => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
};

describe('días hábiles (sin fines de semana ni festivos)', () => {
  it('el lunes festivo no cuenta', () => {
    // 16 de noviembre de 2026: Independencia de Cartagena (lunes festivo).
    expect(isBusinessDay(d('2026-11-16'))).toBe(false);
    expect(isBusinessDay(d('2026-11-14'))).toBe(false);
    expect(isBusinessDay(d('2026-11-17'))).toBe(true);
    // Comparendo el viernes 13: el 5.º día hábil es el lunes 23.
    expect(addBusinessDays(d('2026-11-13'), 5)).toEqual(d('2026-11-23'));
  });

  it('cuenta regresiva', () => {
    expect(businessDaysLeft(d('2026-11-13'), d('2026-11-23'))).toBe(5);
    expect(businessDaysLeft(d('2026-11-23'), d('2026-11-23'))).toBe(0);
    expect(businessDaysLeft(d('2026-11-24'), d('2026-11-23'))).toBe(-1);
  });
});

describe('¿Me multaron?', () => {
  const fine: FineRecord = { id: 'f1', kind: 'street', date: '2026-11-13' };

  it('vía pública: 50 % hasta el día hábil 5 y 25 % hasta el 20; cámara: 11 y 26 desde la notificación', () => {
    expect(discountDeadlines(fine)).toEqual({ full: '2026-11-23', partial: '2026-12-15' });
    const camera = discountDeadlines({ kind: 'camera', date: '2026-11-13' });
    expect(camera.full).toBe('2026-12-01');
  });

  it('en qué descuento va y qué dice', () => {
    expect(discountText(discountState(fine, d('2026-11-13')))).toBe('Te quedan 5 días hábiles para el 50 %');
    expect(discountText(discountState(fine, d('2026-11-23')))).toBe('Hoy es el último día hábil para el 50 %');
    expect(discountState(fine, d('2026-11-24'))).toMatchObject({ stage: 'partial', percent: 25 });
    expect(discountText(discountState(fine, d('2026-12-16')))).toBe('Ya no tiene descuento por pronto pago');
    expect(discountText(discountState({ ...fine, paidAt: '2026-11-14' }, d('2026-11-20')))).toBe('Pagada');
  });

  it('aviso del celular el día hábil antes de que se acabe cada descuento (si no está pagada)', () => {
    expect(fineReminderDates(fine)).toEqual([
      { date: '2026-11-20', percent: 50 },
      { date: '2026-12-14', percent: 25 },
    ]);
    expect(fineReminderDates({ ...fine, paidAt: '2026-11-14' })).toEqual([]);
    const data = buildAppDataFromOnboarding(
      { user: { name: 'Ana', city: '' }, profile: { id: 'c', brandCode: 'kia', brandName: 'Kia', model: 'Picanto' }, km: 1000, maintenance: [], documents: {}, completedAt: '2026-11-01' },
      d('2026-11-13'),
    );
    const plan = buildReminderPlan(data, DEFAULT_SETTINGS, d('2026-11-13'), undefined, [], [], [fine]).filter((r) => r.category === 'fine');
    expect(plan.map((r) => r.id)).toEqual(['fine-f1-50', 'fine-f1-25']);
    expect(plan[0].href).toBe('/multas');
    expect(buildReminderPlan(data, { ...DEFAULT_SETTINGS, fineReminders: false }, d('2026-11-13'), undefined, [], [], [fine]).some((r) => r.category === 'fine')).toBe(false);
  });

  it('se guarda sin migraciones; lo dañado se descarta', () => {
    expect(sanitizeFines([fine, { id: 'x', kind: 'robot', date: '2026-11-13' }, { id: 'y', kind: 'camera', date: 'mal' }])).toEqual([fine]);
  });
});

describe('valores legales (aproximados, ACTUALIZAR CADA AÑO)', () => {
  it('UVB 2026 y multas sin SOAT (D.02) y sin tecnomecánica (C.35)', () => {
    expect(UVB_COP).toBe(12110);
    expect(fineCop('D02')).toBe(1_266_000);
    expect(fineCop('C35')).toBe(633_000);
  });

  it('SOAT 2026 de automóvil familiar por cilindraje y antigüedad; sin datos no se adivina', () => {
    expect(soatFamilyCarPrice(1400, 2022, 2026)).toBe(447_300);
    expect(soatFamilyCarPrice(1598, 2015, 2026)).toBe(677_400);
    expect(soatFamilyCarPrice(2700, 2020, 2026)).toBe(636_000);
    expect(soatFamilyCarPrice(undefined, 2020, 2026)).toBeUndefined();
    expect(soatFamilyCarPrice(1600, undefined, 2026)).toBeUndefined();
  });

  it('el kit de carretera es de carro: sin chaleco ni casco', () => {
    const all = JSON.stringify(ROAD_KIT);
    expect(all).toMatch(/Extintor/);
    expect(all).not.toMatch(/chaleco|casco/i);
    expect(read('app/en-regla.tsx')).toContain('artículo 30 de la Ley 769 de 2002');
  });
});

describe('pantallas y entradas', () => {
  it('rutas protegidas, buscador y Mi carro', () => {
    expect(APP_ROUTES).toEqual(expect.arrayContaining(['multas', 'multas/editar', 'en-regla']));
    expect(searchDestinations('comparendo')[0].key).toBe('fines');
    expect(searchDestinations('extintor')[0].key).toBe('compliance');
    const car = read('app/(tabs)/carro.tsx');
    expect(car).toContain("router.push('/en-regla')");
    expect(car).toContain("router.push('/multas')");
    expect(read('app/documentos/[key].tsx')).toContain('<DocumentFacts type={doc.type} />');
  });
});
