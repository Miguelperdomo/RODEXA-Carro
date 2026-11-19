/** Bloque "Hoy" de Inicio: lo más importante del día, sin inventar nada. */
import type { PicoYPlacaConfig } from '@/features/picoYPlaca/rules';

import { buildToday, TODAY_MAX_ITEMS, type TodayInput } from '../today';
import type { StatusItem } from '../types';

// Martes 6 de octubre de 2026.
const TUESDAY = new Date(2026, 9, 6, 9, 0);

const status = (id: string, s: StatusItem['status'], kind: StatusItem['kind'] = 'maintenance'): StatusItem => ({
  id,
  kind,
  title: id === 'soat' ? 'SOAT' : 'Aceite',
  icon: 'oil',
  status: s,
  detail: 'detalle',
  href: '/carro',
});
const pyp = (weekdays: number[]): PicoYPlacaConfig => ({
  enabled: true,
  mode: 'weekdays',
  weekdays,
  windows: [{ start: 360, end: 1260 }],
  remindNightBefore: false,
  updatedAt: '2026-10-01',
});

const base: TodayInput = {
  picoYPlaca: undefined,
  statusItems: [],
  kmCheckDue: false,
  daysSinceReading: 0,
  weeklySettings: { weeklyCheckEnabled: false } as TodayInput['weeklySettings'],
  today: TUESDAY,
};

describe('bloque "Hoy"', () => {
  it('sin nada pendiente: una sola fila tranquila, que no abre nada', () => {
    const { items, more } = buildToday(base);
    expect(items).toEqual([expect.objectContaining({ key: 'all-good', tone: 'ok', title: 'Nada pendiente para hoy' })]);
    expect(items[0].href).toBeUndefined();
    expect(more).toBe(0);
  });

  it('pico y placa hoy, con el horario y "según lo que configuraste"; nunca "puedes circular"', () => {
    const { items } = buildToday({ ...base, picoYPlaca: pyp([2]) });
    expect(items[0]).toMatchObject({ key: 'pico-y-placa', tone: 'soon', title: 'Hoy tienes pico y placa' });
    expect(items[0].detail).toMatch(/según lo que configuraste$/);
    const notToday = buildToday({ ...base, picoYPlaca: pyp([3]) }).items[0];
    expect(notToday).toMatchObject({ title: 'Hoy no tienes pico y placa', tone: 'info' });
    expect(notToday.detail).toMatch(/Próximo: mañana/);
    expect(JSON.stringify([items, notToday])).not.toMatch(/puedes circular/i);
  });

  it('lo vencido va primero, luego lo próximo y al final lo de hacer hoy', () => {
    const { items } = buildToday({
      ...base,
      picoYPlaca: pyp([3]),
      kmCheckDue: true,
      daysSinceReading: 9,
      statusItems: [status('oil', 'soon'), status('soat', 'due', 'document'), status('ok', 'ok')],
    });
    expect(items.map((i) => i.key)).toEqual(['status-soat', 'status-oil', 'pico-y-placa', 'km-check']);
    expect(items[0].title).toBe('SOAT: vencido');
    expect(items[1].title).toBe('Aceite: próximo');
    expect(items[3].detail).toBe('Tu último registro fue hace 9 días. Míralo en el tablero.');
  });

  it('la revisión semanal aparece solo si está activa y le toca', () => {
    const on = { weeklyCheckEnabled: true, weeklyCheckLastDone: '2026-09-20' } as TodayInput['weeklySettings'];
    expect(buildToday({ ...base, weeklySettings: on }).items[0].key).toBe('weekly-inspection');
    const recent = { weeklyCheckEnabled: true, weeklyCheckLastDone: '2026-10-05' } as TodayInput['weeklySettings'];
    expect(buildToday({ ...base, weeklySettings: recent }).items[0].key).toBe('all-good');
  });

  it(`como máximo ${TODAY_MAX_ITEMS} filas; el resto se cuenta`, () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ ...status(id, 'due'), id }));
    const { items, more } = buildToday({ ...base, statusItems: many, kmCheckDue: true });
    expect(items).toHaveLength(TODAY_MAX_ITEMS);
    expect(more).toBe(3);
  });
});
