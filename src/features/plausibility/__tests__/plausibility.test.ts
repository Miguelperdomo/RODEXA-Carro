/**
 * "¿Está bien este dato?": avisos para atrapar errores de digitación, comparando con los
 * propios registros del usuario. Todos los valores son DATOS DE PRUEBA.
 */
import { validateEnergyRecord } from '@/features/energy/validation';
import type { FuelRecord, HistoryEntry } from '@/features/history/types';
import { validateOdometerReading } from '@/features/odometer/validation';

import { energyPlausibility, expenseAmountWarning, kmTypoWarning, median } from '../rules';

const fuel = (id: string, date: string, km: number | null, gallons: number, price: number, fullTank = true): FuelRecord => ({
  id,
  kind: 'fuel',
  date,
  km,
  quantity: gallons,
  unit: 'gal',
  fullTank,
  unitPriceCop: price,
  costCop: Math.round(gallons * price),
});

/** Tres tramos normales: 400 km con 10 galones (40 km/gal), a $16.000. */
const normal: HistoryEntry[] = [
  fuel('f1', '2026-06-01', 10_000, 10, 16_000),
  fuel('f2', '2026-07-01', 10_400, 10, 16_000),
  fuel('f3', '2026-08-01', 10_800, 10, 16_200),
  fuel('f4', '2026-09-01', 11_200, 10, 16_100),
];

describe('km con un cero de más', () => {
  it('"Tu último km fue 50.000 y escribiste 500.000"', () => {
    expect(kmTypoWarning(500_000, 50_000)).toBe('Tu último km fue 50.000 km y escribiste 500.000 km. ¿Tiene un cero de más?');
    expect(kmTypoWarning(52_000, 50_000)).toBeUndefined();
    expect(kmTypoWarning(5_000, 500)).toBeUndefined(); // carro nuevo: muy poco para comparar
  });

  it('se pregunta aunque haya pasado mucho tiempo desde el último km', () => {
    // 450.000 km en 1.000 días son 450 km/día: antes no se advertía.
    expect(validateOdometerReading({ newKm: 500_000, lastKm: 50_000, daysSinceLast: 1000 }).warning).toMatch(/cero de más/);
  });

  it('también al tanquear', () => {
    const { warnings } = validateEnergyRecord(
      { kind: 'fuel', date: new Date(2026, 9, 1), km: 500_000, quantity: 10, unit: 'gal', unitPriceCop: 16_000, costCop: 160_000 },
      { lastKm: 50_000, daysSinceLast: 1000 },
    );
    expect(warnings.km).toMatch(/cero de más/);
  });
});

describe('tanqueos: comparando con los propios', () => {
  it('un tanqueo normal no genera avisos', () => {
    expect(energyPlausibility(normal, fuel('new', '2026-10-01', 11_600, 10, 16_000))).toEqual([]);
  });

  it('"Entre este tanque lleno y el anterior hay solo 30 km"', () => {
    const [warning] = energyPlausibility(normal, fuel('new', '2026-10-01', 11_230, 10, 16_000));
    expect(warning).toMatch(/habría rendido 3 km\/gal, y normalmente rinde unos 40 km\/gal/);
    expect(warning).toMatch(/30 km/);
  });

  it('"Este tanqueo es 10 veces más grande que los anteriores"', () => {
    const warnings = energyPlausibility(normal, fuel('new', '2026-10-01', null, 100, 16_000, false));
    expect(warnings[0]).toMatch(/Es mucho más de lo que sueles cargar: lo máximo que has registrado son 10 galones/);
  });

  it('un precio con un cero de más (o escrito por litro en vez de por galón)', () => {
    const extraZero = energyPlausibility(normal, fuel('new', '2026-10-01', 11_600, 10, 160_000));
    expect(extraZero.some((w) => /El precio por galón \(\$160\.000\) es muy distinto a lo que sueles pagar \(unos \$16\.050\)/.test(w))).toBe(true);
    const perLiter = energyPlausibility(normal, fuel('new', '2026-10-01', 11_600, 10, 4_200));
    expect(perLiter.some((w) => /precio por galón/.test(w))).toBe(true);
  });

  it('sin suficientes registros propios no se compara (nunca contra valores "típicos")', () => {
    expect(energyPlausibility(normal.slice(0, 2), fuel('new', '2026-10-01', 10_430, 100, 160_000))).toEqual([]);
  });

  it('al corregir un tanqueo no se compara consigo mismo', () => {
    const fixed = { ...fuel('f4', '2026-09-01', 11_200, 10, 16_100) };
    expect(energyPlausibility(normal, fixed, 'f4')).toEqual([]);
  });
});

describe('gastos con un cero de más', () => {
  const washes: HistoryEntry[] = [20_000, 25_000, 22_000].map((amountCop, i) => ({
    id: `w${i}`,
    kind: 'expense',
    date: `2026-0${i + 6}-01`,
    category: 'wash',
    amountCop,
  }));

  it('avisa frente a lo que suele registrar en esa categoría', () => {
    expect(expenseAmountWarning(washes, { category: 'wash', amountCop: 220_000 })).toBe(
      'Normalmente registras unos $22.000 en lavado y escribiste $220.000. ¿Tiene un cero de más?',
    );
    expect(expenseAmountWarning(washes, { category: 'wash', amountCop: 30_000 })).toBeUndefined();
    expect(expenseAmountWarning(washes, { category: 'parking', amountCop: 220_000 })).toBeUndefined();
  });

  it('las siglas se respetan', () => {
    const soat = washes.map((e) => ({ ...e, category: 'soat' as const }));
    expect(expenseAmountWarning(soat, { category: 'soat', amountCop: 500_000 })).toMatch(/ en SOAT /);
  });
});

it('mediana', () => {
  expect(median([3, 1, 2])).toBe(2);
  expect(median([1, 2, 3, 4])).toBe(2.5);
  expect(median([])).toBeUndefined();
});
