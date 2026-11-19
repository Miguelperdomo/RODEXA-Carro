/**
 * Pruebas de energía y consumo. TODOS los valores son DATOS DE PRUEBA para verificar
 * las fórmulas: no son precios, consumos ni capacidades reales de ningún vehículo.
 */
import { describeEntry, entryCost } from '@/features/history/presentation';
import type { ChargeRecord, CngRecord, FuelRecord, HistoryEntry } from '@/features/history/types';
import { computeMonthStats } from '@/features/stats/compute';

import {
  computeEnergyMonthStats,
  consumptionPairs,
  costPerKm,
  estimatedChargeEnergy,
  estimatedEnergy,
  INSUFFICIENT_DATA_MESSAGE,
  lastUnitPrice,
  summarizeConsumption,
} from '../compute';
import { baseQuantity, LITERS_PER_GALLON, resolveAmounts, unitPrice } from '../units';
import { validateEnergyRecord, type EnergyInput } from '../validation';

const fuel = (id: string, date: string, km: number | null, quantity: number, fullTank: boolean, extra: Partial<FuelRecord> = {}): FuelRecord => ({
  id,
  kind: 'fuel',
  date,
  km,
  quantity,
  unit: 'L',
  fullTank,
  ...extra,
});
const cng = (id: string, date: string, km: number | null, quantity: number, fullFill: boolean, extra: Partial<CngRecord> = {}): CngRecord => ({
  id,
  kind: 'cng',
  date,
  km,
  quantity,
  fullFill,
  ...extra,
});
const charge = (id: string, date: string, km: number | null, quantity: number, extra: Partial<ChargeRecord> = {}): ChargeRecord => ({
  id,
  kind: 'charge',
  date,
  km,
  quantity,
  ...extra,
});

describe('10. consumo km/L (tanque lleno a tanque lleno)', () => {
  it('400 km / 40 L = 10 km/L', () => {
    const entries = [fuel('a', '2026-09-01', 50000, 35, true), fuel('b', '2026-09-10', 50400, 40, true)];
    const pairs = consumptionPairs(entries, 'fuel');
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kmPerUnit).toBe(10);
  });

  it('un tanqueo parcial en medio suma sus litros al tramo', () => {
    const entries = [
      fuel('a', '2026-09-01', 50000, 35, true),
      fuel('p', '2026-09-05', 50200, 15, false),
      fuel('b', '2026-09-10', 50400, 25, true),
    ];
    expect(consumptionPairs(entries, 'fuel')[0].kmPerUnit).toBe(10);
  });

  it('normaliza galones a litros antes de calcular (no mezcla unidades)', () => {
    const entries = [
      fuel('a', '2026-09-01', 50000, 10, true, { unit: 'gal' }),
      fuel('b', '2026-09-10', 50400, 10, true, { unit: 'gal' }),
    ];
    const pair = consumptionPairs(entries, 'fuel')[0];
    expect(pair.quantity).toBeCloseTo(10 * LITERS_PER_GALLON);
    expect(pair.kmPerUnit).toBeCloseTo(400 / (10 * LITERS_PER_GALLON));
  });
});

describe('11. consumo km/m³ (GNC)', () => {
  it('300 km / 20 m³ = 15 km/m³', () => {
    const entries = [cng('a', '2026-09-01', 30000, 18, true), cng('b', '2026-09-08', 30300, 20, true)];
    expect(summarizeConsumption(consumptionPairs(entries, 'cng'), 'cng')).toMatchObject({
      status: 'calculated',
      kmPerUnit: 15,
      unit: 'km/m³',
    });
  });
});

describe('12. consumo km/kWh (entre cargas comparables)', () => {
  it('80 % → 80 %: 160 km / 32 kWh = 5 km/kWh', () => {
    const entries = [
      charge('a', '2026-09-01', 20000, 30, { endPercent: 80 }),
      charge('b', '2026-09-05', 20160, 32, { endPercent: 80 }),
    ];
    const result = summarizeConsumption(consumptionPairs(entries, 'charge'), 'charge');
    expect(result).toMatchObject({ status: 'calculated', kmPerUnit: 5, unit: 'km/kWh' });
  });

  it('cargas que terminan en % distintos NO se comparan', () => {
    const entries = [
      charge('a', '2026-09-01', 20000, 30, { endPercent: 80 }),
      charge('b', '2026-09-05', 20160, 32, { endPercent: 100 }),
    ];
    expect(consumptionPairs(entries, 'charge')).toEqual([]);
  });

  it('sin % final no hay referencia: no se fuerza un cálculo', () => {
    const entries = [charge('a', '2026-09-01', 20000, 30), charge('b', '2026-09-05', 20160, 32)];
    expect(summarizeConsumption(consumptionPairs(entries, 'charge'), 'charge').status).toBe('insufficient');
  });
});

describe('13. costo por km', () => {
  it('costo del tramo / km del tramo', () => {
    const entries = [
      charge('a', '2026-09-01', 20000, 30, { endPercent: 80, costCop: 30000 }),
      charge('b', '2026-09-05', 20160, 32, { endPercent: 80, costCop: 32000 }),
    ];
    const result = summarizeConsumption(consumptionPairs(entries, 'charge'), 'charge');
    expect(result.status === 'calculated' && result.costPerKmCop).toBe(200);
  });

  it('si algún registro del tramo no tiene costo, no se calcula', () => {
    const entries = [fuel('a', '2026-09-01', 50000, 35, true), fuel('b', '2026-09-10', 50400, 40, true)];
    const result = summarizeConsumption(consumptionPairs(entries, 'fuel'), 'fuel');
    expect(result.status === 'calculated' && result.costPerKmCop).toBeUndefined();
  });

  it('funciona igual para combustible y GNC', () => {
    expect(costPerKm(40000, 400)).toBe(100);
    const gas = [cng('a', '2026-09-01', 30000, 18, true, { costCop: 0 }), cng('b', '2026-09-08', 30300, 20, true, { costCop: 45000 })];
    const r = summarizeConsumption(consumptionPairs(gas, 'cng'), 'cng');
    expect(r.status === 'calculated' && r.costPerKmCop).toBe(150);
  });
});

describe('14. precio unitario', () => {
  it('costo / cantidad', () => {
    expect(unitPrice(32000, 32)).toBe(1000);
    expect(resolveAmounts({ quantity: 35, unitPriceCop: null, costCop: 140000 })).toMatchObject({
      unitPriceCop: 4000,
      computed: 'unitPriceCop',
    });
  });

  it('con costo y precio se calcula la cantidad; con cantidad y precio, el costo', () => {
    expect(resolveAmounts({ quantity: null, unitPriceCop: 16000, costCop: 32000 })).toMatchObject({ quantity: 2, computed: 'quantity' });
    expect(resolveAmounts({ quantity: 32, unitPriceCop: 1000, costCop: null })).toMatchObject({ costCop: 32000, computed: 'costCop' });
  });

  it('si el usuario escribe los tres, se respeta tal cual', () => {
    expect(resolveAmounts({ quantity: 10, unitPriceCop: 4000, costCop: 41000 })).toEqual({ quantity: 10, unitPriceCop: 4000, costCop: 41000 });
  });

  it('solo cantidad: no se inventa precio ni costo (carga sin costo)', () => {
    expect(resolveAmounts({ quantity: 32, unitPriceCop: null, costCop: null })).toEqual({
      quantity: 32,
      unitPriceCop: undefined,
      costCop: undefined,
    });
  });
});

describe('15. último precio como sugerencia', () => {
  const entries: HistoryEntry[] = [
    fuel('a', '2026-09-01', 50000, 10, true, { unitPriceCop: 15000, unit: 'L' }),
    fuel('b', '2026-09-10', 50400, 5, false, { unitPriceCop: 15200, unit: 'L' }),
    charge('c', '2026-09-11', 50450, 20, { costCop: 20000 }),
  ];

  it('el último precio registrado del MISMO tipo, con su unidad', () => {
    expect(lastUnitPrice(entries, 'fuel')).toEqual({ unitPriceCop: 15200, unit: 'L' });
    // Sin precio escrito, se deduce del costo y la cantidad registrados por el usuario.
    expect(lastUnitPrice(entries, 'charge')).toEqual({ unitPriceCop: 1000, unit: undefined });
  });

  it('sin registros de ese tipo no hay sugerencia (no se inventa un precio)', () => {
    expect(lastUnitPrice(entries, 'cng')).toBeUndefined();
  });

  it('al corregir un registro no se sugiere su propio precio', () => {
    expect(lastUnitPrice(entries, 'fuel', 'b')).toEqual({ unitPriceCop: 15000, unit: 'L' });
  });
});

describe('16–17. datos insuficientes y división entre cero', () => {
  it('un solo tanqueo: datos insuficientes (nunca 0 km/L)', () => {
    const result = summarizeConsumption(consumptionPairs([fuel('a', '2026-09-01', 50000, 35, true)], 'fuel'), 'fuel');
    expect(result).toEqual({ status: 'insufficient', message: INSUFFICIENT_DATA_MESSAGE });
  });

  it('distancia 0 o km desconocido: no hay tramo', () => {
    expect(consumptionPairs([fuel('a', '2026-09-01', 50000, 35, true), fuel('b', '2026-09-02', 50000, 5, true)], 'fuel')).toEqual([]);
    expect(consumptionPairs([fuel('a', '2026-09-01', null, 35, true), fuel('b', '2026-09-02', 50400, 40, true)], 'fuel')).toEqual([]);
  });

  it('kilometraje que retrocede: no genera consumo negativo', () => {
    expect(consumptionPairs([fuel('a', '2026-09-01', 50400, 35, true), fuel('b', '2026-09-02', 50000, 40, true)], 'fuel')).toEqual([]);
  });

  it('funciones de precio y costo por km no dividen por cero', () => {
    expect(unitPrice(1000, 0)).toBeUndefined();
    expect(costPerKm(1000, 0)).toBeUndefined();
    expect(costPerKm(1000, -5)).toBeUndefined();
    expect(resolveAmounts({ quantity: null, unitPriceCop: 0, costCop: 1000 }).quantity).toBeUndefined();
  });
});

const baseInput: EnergyInput = {
  kind: 'fuel',
  date: new Date(2026, 8, 10),
  km: 50400,
  quantity: 40,
  unit: 'L',
  unitPriceCop: null,
  costCop: null,
};
const ctx = { lastKm: 50000, daysSinceLast: 9 };

describe('18–20. validaciones', () => {
  it('18. porcentajes fuera de 0–100 o final ≤ inicial', () => {
    const c = { ...baseInput, kind: 'charge' as const };
    expect(validateEnergyRecord({ ...c, startPercent: -1 }, ctx).errors.startPercent).toBeDefined();
    expect(validateEnergyRecord({ ...c, endPercent: 120 }, ctx).errors.endPercent).toBeDefined();
    expect(validateEnergyRecord({ ...c, startPercent: 80, endPercent: 20 }, ctx).errors.endPercent).toBeDefined();
    expect(validateEnergyRecord({ ...c, startPercent: 20, endPercent: 80 }, ctx).errors).toEqual({});
  });

  it('19. kWh inválidos (0 o sin cantidad calculable)', () => {
    const c = { ...baseInput, kind: 'charge' as const };
    expect(validateEnergyRecord({ ...c, quantity: 0 }, ctx).errors.quantity).toBeDefined();
    expect(validateEnergyRecord({ ...c, quantity: null }, ctx).errors.quantity).toBeDefined();
  });

  it('m³ inválidos y cantidades negativas', () => {
    expect(validateEnergyRecord({ ...baseInput, kind: 'cng', quantity: -3 }, ctx).errors.quantity).toBeDefined();
  });

  it('20. kilometraje negativo, faltante o incoherente', () => {
    expect(validateEnergyRecord({ ...baseInput, km: -10 }, ctx).errors.km).toBeDefined();
    expect(validateEnergyRecord({ ...baseInput, km: null }, ctx).errors.km).toBeDefined();
    // Menor que el último: advertencia (puede estar corrigiendo), no bloqueo.
    expect(validateEnergyRecord({ ...baseInput, km: 49000 }, ctx).warnings.km).toBeDefined();
    // "No sé el kilometraje" es válido.
    expect(validateEnergyRecord({ ...baseInput, km: null, kmUnknown: true }, ctx).errors.km).toBeUndefined();
  });

  it('costo y precio negativos; fecha inválida', () => {
    expect(validateEnergyRecord({ ...baseInput, costCop: -1 }, ctx).errors.costCop).toBeDefined();
    expect(validateEnergyRecord({ ...baseInput, unitPriceCop: -1 }, ctx).errors.unitPriceCop).toBeDefined();
    expect(validateEnergyRecord({ ...baseInput, date: new Date('x') }, ctx).errors.date).toBeDefined();
    // Costo 0 es válido (carga gratis).
    expect(validateEnergyRecord({ ...baseInput, costCop: 0 }, ctx).errors.costCop).toBeUndefined();
  });

  it('sin capacidad del tanque registrada no hay un límite inventado', () => {
    expect(validateEnergyRecord({ ...baseInput, quantity: 90 }, ctx).warnings.quantity).toBeUndefined();
    expect(validateEnergyRecord({ ...baseInput, quantity: 90 }, { ...ctx, tankCapacityLiters: 45 }).warnings.quantity).toBeDefined();
  });
});

describe('21–22. energía estimada por batería', () => {
  it('21. capacidad × (mayor − menor) / 100', () => {
    expect(estimatedEnergy(60, 80, 20)).toEqual({ kind: 'estimated', kwh: 36 });
    expect(estimatedChargeEnergy(charge('c', '2026-09-01', 1, 30, { startPercent: 20, endPercent: 80 }), 60)).toEqual({
      kind: 'estimated',
      kwh: 36,
    });
  });

  it('sin capacidad, % inválidos o resultado negativo: no hay estimado', () => {
    expect(estimatedEnergy(undefined, 80, 20)).toBeUndefined();
    expect(estimatedEnergy(60, 120, 20)).toBeUndefined();
    expect(estimatedEnergy(60, 20, 80)).toBeUndefined();
    expect(estimatedEnergy(0, 80, 20)).toBeUndefined();
  });

  it('22. el estimado NO reemplaza los kWh del cargador en el consumo', () => {
    // 30 kWh registrados; con 60 kWh de capacidad y 20→80 % el estimado sería 36 kWh.
    const entries = [
      charge('a', '2026-09-01', 20000, 25, { endPercent: 80 }),
      charge('b', '2026-09-05', 20150, 30, { startPercent: 20, endPercent: 80 }),
    ];
    const result = summarizeConsumption(consumptionPairs(entries, 'charge'), 'charge');
    expect(result.status === 'calculated' && result.kmPerUnit).toBe(5); // 150 / 30, no 150 / 36
    expect(baseQuantity(entries[1])).toBe(30);
  });
});

describe('25. PHEV mantiene separados combustible y electricidad', () => {
  const entries: HistoryEntry[] = [
    fuel('f1', '2026-09-01', 10000, 30, true, { costCop: 120000 }),
    charge('c1', '2026-09-02', 10050, 8, { endPercent: 90, costCop: 8000 }),
    charge('c2', '2026-09-06', 10130, 10, { endPercent: 90, costCop: 10000 }),
    fuel('f2', '2026-09-20', 10400, 30, true, { costCop: 120000 }),
  ];

  it('cada energía tiene su propio consumo y unidad', () => {
    const fuelStats = computeEnergyMonthStats(entries, '2026-09', 'fuel');
    const chargeStats = computeEnergyMonthStats(entries, '2026-09', 'charge');
    expect(fuelStats.consumption).toMatchObject({ status: 'calculated', unit: 'km/L', kmPerUnit: 400 / 30 });
    expect(chargeStats.consumption).toMatchObject({ status: 'calculated', unit: 'km/kWh', kmPerUnit: 8 });
    // Los kWh no se suman a los litros.
    expect(fuelStats.quantity).toBe(60);
    expect(chargeStats.quantity).toBe(18);
  });

  it('en las estadísticas del mes, cada energía es una categoría distinta', () => {
    const keys = computeMonthStats(entries, '2026-09', new Date(2026, 8, 30)).byCategory.map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(['fuel', 'charge']));
  });
});

describe('historial', () => {
  it('muestra la unidad correcta de cada registro', () => {
    expect(describeEntry(fuel('f', '2026-09-01', 1, 35, true, { costCop: 140000 }), 'gasoline').title).toBe('Gasolina — 35 L');
    expect(describeEntry(charge('c', '2026-09-01', 1, 32, { costCop: 32000 })).title).toBe('Electricidad — 32 kWh');
    expect(describeEntry(cng('g', '2026-09-01', 1, 18, true, { costCop: 45000 })).title).toBe('GNC — 18 m³');
  });

  it('un registro sin costo no suma un costo inventado', () => {
    expect(entryCost(charge('c', '2026-09-01', 1, 32))).toBe(0);
    expect(describeEntry(charge('c', '2026-09-01', 1, 32)).trailing).toBeUndefined();
  });
});
