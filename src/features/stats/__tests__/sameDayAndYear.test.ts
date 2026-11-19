/**
 * Tanqueos del mismo día con km desconocido y récords de "Tu año" que cruzan el año.
 * TODOS los valores son DATOS DE PRUEBA: no son consumos ni precios reales.
 */
import type { CarProfile } from '@/features/cars/types';
import { consumptionPairs, energyRecords, registeredAt } from '@/features/energy/compute';
import type { FuelRecord, HistoryEntry } from '@/features/history/types';

import { carRecords } from '../records';
import { buildYearWrapped } from '../yearWrapped';

/** Id como los de la app: "fuel-<milisegundos en base 36>-xxxxx". */
const idAt = (ms: number) => `fuel-${ms.toString(36)}-abcde`;
const fuel = (id: string, date: string, km: number | null, quantity: number, fullTank: boolean): FuelRecord => ({
  id,
  kind: 'fuel',
  date,
  km,
  quantity,
  unit: 'L',
  fullTank,
});
const profile: CarProfile = { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', year: 2022, energySource: 'gasoline' };

describe('tanqueos del mismo día', () => {
  it('lee el momento de registro del id', () => {
    expect(registeredAt(idAt(1_700_000_000_000))).toBe(1_700_000_000_000);
    expect(registeredAt('onb-km')).toBeUndefined();
    expect(registeredAt('f1')).toBeUndefined();
  });

  // Mañana: tanque lleno a 1.000 km. Tarde: parcial con km desconocido. Luego, tanque lleno a 1.400 km.
  const morningFull = fuel(idAt(1000), '2026-03-10', 1000, 40, true);
  const afternoonPartial = fuel(idAt(2000), '2026-03-10', null, 10, false);
  const nextFull = fuel(idAt(3000), '2026-03-20', 1400, 30, true);

  it('un parcial con km desconocido va después de lo registrado antes que él, sin importar el orden de la lista', () => {
    for (const list of [
      [morningFull, afternoonPartial, nextFull],
      [nextFull, afternoonPartial, morningFull],
      [afternoonPartial, nextFull, morningFull],
    ]) {
      expect(energyRecords(list, 'fuel').map((r) => r.id)).toEqual([morningFull.id, afternoonPartial.id, nextFull.id]);
      // El parcial de la tarde cuenta en el tramo siguiente: 400 km con 10 + 30 L.
      const [pair] = consumptionPairs(list, 'fuel');
      expect(pair).toMatchObject({ distanceKm: 400, quantity: 40, kmPerUnit: 10 });
    }
  });

  it('si el parcial se registró ANTES del tanque lleno, cuenta en el tramo anterior', () => {
    const previousFull = fuel(idAt(500), '2026-03-01', 600, 30, true);
    const morningPartial = fuel(idAt(900), '2026-03-10', null, 10, false);
    const list = [nextFull, morningFull, morningPartial, previousFull];
    expect(energyRecords(list, 'fuel').map((r) => r.id)).toEqual([previousFull.id, morningPartial.id, morningFull.id, nextFull.id]);
    expect(consumptionPairs(list, 'fuel').map((p) => p.quantity)).toEqual([50, 30]);
  });

  it('con km conocidos manda el km; con ids sin fecha de registro el orden igual es siempre el mismo', () => {
    const a = fuel('x-a', '2026-03-10', null, 5, false);
    const b = fuel('x-b', '2026-03-10', null, 5, false);
    const high = fuel(idAt(1), '2026-03-10', 2000, 5, true);
    const low = fuel(idAt(2), '2026-03-10', 1500, 5, true);
    const order = (list: HistoryEntry[]) => energyRecords(list, 'fuel').map((r) => r.id);
    expect(order([b, high, a, low])).toEqual([low.id, high.id, 'x-a', 'x-b']);
    expect(order([a, low, b, high])).toEqual(order([b, high, a, low]));
  });
});

describe('"Tu año": récords que empiezan en diciembre', () => {
  const ref = new Date(2027, 5, 30, 8, 0);
  const entries: HistoryEntry[] = [
    { id: 'k1', kind: 'odometer', date: '2026-12-28', km: 10000 },
    { id: 'k2', kind: 'odometer', date: '2027-01-31', km: 13000 }, // enero: 3.000 km
    { id: 'k3', kind: 'odometer', date: '2027-03-31', km: 14000 },
    { id: 'k4', kind: 'odometer', date: '2027-02-27', km: 13500 }, // febrero y marzo: 500 km cada uno
    fuel('f1', '2026-12-28', 10000, 40, true),
    fuel('f2', '2027-01-15', 10500, 50, true), // 500 km con 50 L, tramo que empieza en diciembre
  ];

  it('enero se mide con la lectura de finales de diciembre', () => {
    const w = buildYearWrapped(entries, profile, 2027, ref);
    expect(w.records.find((r) => r.key === 'km-month')).toMatchObject({ value: expect.stringMatching(/3\.000/), detail: expect.stringMatching(/enero/i) });
  });

  it('el consumo del primer tanqueo del año usa el tanque lleno de diciembre', () => {
    expect(carRecords(entries, profile, ref, 2027).some((r) => r.key === 'fuel-best-consumption')).toBe(true);
  });

  it('lo de diciembre no cuenta como récord del año siguiente', () => {
    const december: HistoryEntry[] = [
      fuel('f1', '2026-12-01', 9000, 40, true),
      { ...fuel('f2', '2026-12-20', 9600, 30, true), costCop: 500000 },
      { id: 'k', kind: 'odometer', date: '2026-11-28', km: 8000 },
    ];
    expect(carRecords(december, profile, ref, 2027)).toEqual([]);
    expect(carRecords(december, profile, ref).length).toBeGreaterThan(0);
  });
});
