/** Fase 16B: ley de tránsito para carro y guía de traspaso. */
import { searchDestinations } from '@/features/search/destinations';
import { APP_ROUTES } from '@/features/session/appRoutes';

import { FINE_TYPE_COP_2026, FINES, fineCodeLabel, fineCop, TRANSFER_STEPS } from '../values';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
const read = (p: string) => readFileSync(`src/${p}`, 'utf8');

describe('ley de tránsito para carro', () => {
  it('valores 2026 por tipo (tabla oficial) y redondeo', () => {
    expect(FINE_TYPE_COP_2026).toEqual({ C: 633_111, D: 1_266_222 });
    expect(fineCop('D01')).toBe(1_266_000);
    expect(fineCop('C29')).toBe(633_000);
    expect(fineCodeLabel('D02')).toBe('D.02');
  });

  it('inmovilización solo donde está confirmada (SOAT y tecnomecánica)', () => {
    expect(Object.entries(FINES).filter(([, f]) => f.immobilization).map(([c]) => c).sort()).toEqual(['C35', 'D02']);
  });

  it('nada de moto: sin chaleco ni casco', () => {
    const all = JSON.stringify(FINES) + read('app/ley-transito.tsx');
    expect(all).not.toMatch(/chaleco|casco|parrillero/i);
  });
});

describe('guía de traspaso', () => {
  it('7 pasos con RUNT, SIMIT, impuesto y compraventa', () => {
    expect(TRANSFER_STEPS).toHaveLength(7);
    const all = JSON.stringify(TRANSFER_STEPS);
    expect(all).toMatch(/RUNT/);
    expect(all).toMatch(/SIMIT/);
    expect(all).toMatch(/Impuesto vehicular/);
    expect(all).toMatch(/compraventa/);
    expect(read('app/traspaso.tsx')).toMatch(/pueden cambiar según la ciudad/);
  });
});

describe('entradas', () => {
  it('rutas, buscador y Mi carro', () => {
    expect(APP_ROUTES).toEqual(expect.arrayContaining(['ley-transito', 'traspaso']));
    expect(searchDestinations('traspaso')[0].key).toBe('transfer');
    expect(searchDestinations('ley de transito')[0].key).toBe('law');
    const car = read('app/(tabs)/carro.tsx');
    expect(car).toContain("router.push('/ley-transito')");
    expect(car).toContain("router.push('/traspaso')");
  });
});
