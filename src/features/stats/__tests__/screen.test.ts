/** Estadísticas de Carro: mes, energía según el tipo de energía del carro y 12 meses. Datos de PRUEBA. */
import type { EnergySource } from '@/features/cars/types';
import type { ChargeRecord, CngRecord, FuelRecord, HistoryEntry } from '@/features/history/types';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';

import { buildMonthView, buildYearView, statsMonths } from '../screen';

const TODAY = new Date(2026, 8, 30); // 30/09/2026

const profileOf = (energySource: EnergySource) =>
  buildAppDataFromOnboarding(
    {
      user: { name: 'Ana', city: '' },
      profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
      km: 10000,
      maintenance: [],
      documents: {},
      completedAt: '2026-01-01',
    },
    TODAY,
  ).profile;

const km = (date: string, value: number): HistoryEntry => ({ id: `o-${date}`, kind: 'odometer', date, km: value });
const expense = (date: string, amountCop: number): HistoryEntry => ({ id: `e-${date}-${amountCop}`, kind: 'expense', date, category: 'parts', amountCop });
const fuel = (date: string, kmValue: number | null, quantity: number, unit: 'gal' | 'L', costCop?: number, fullTank = true): FuelRecord => ({
  id: `f-${date}`,
  kind: 'fuel',
  date,
  km: kmValue,
  quantity,
  unit,
  fullTank,
  costCop,
});
const charge = (date: string, kmValue: number, quantity: number, costCop?: number, endPercent = 80): ChargeRecord => ({
  id: `c-${date}`,
  kind: 'charge',
  date,
  km: kmValue,
  quantity,
  costCop,
  endPercent,
});
const cng = (date: string, kmValue: number, quantity: number, costCop?: number): CngRecord => ({
  id: `g-${date}`,
  kind: 'cng',
  date,
  km: kmValue,
  quantity,
  costCop,
  fullFill: true,
});

/** Vista del mes más reciente con gastos (o el que se pida). */
const view = (entries: HistoryEntry[], energySource: EnergySource = 'gasoline', index = 0) =>
  buildMonthView(entries, profileOf(energySource), statsMonths(entries, TODAY), index, TODAY);

const noBadNumbers = (value: unknown) => {
  const text = JSON.stringify(value, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? `BAD:${v}` : v));
  expect(text).not.toMatch(/BAD:|NaN|Infinity/);
};

describe('sin datos', () => {
  it('sin ningún registro: estado vacío', () => {
    expect(statsMonths([], TODAY)).toEqual([]);
  });

  it('registros sin gastos: se muestra el mes en curso y lo no calculable queda sin dato', () => {
    const entries = [km('2026-09-10', 10000)];
    expect(statsMonths(entries, TODAY)).toEqual(['2026-09']);
    const month = view(entries);
    expect(month).toMatchObject({ totalCop: 0, comparison: undefined, kmTraveled: undefined, costPerKmCop: undefined, monthlyAverageCop: undefined });
    noBadNumbers(month);
    noBadNumbers(buildYearView(entries, TODAY));
  });
});

describe('mes y comparación', () => {
  const entries = [expense('2026-08-10', 100000), expense('2026-09-10', 50000)];

  it('el selector recorre solo los meses con gastos, empezando por el más reciente', () => {
    expect(statsMonths([...entries, km('2026-07-01', 9000)], TODAY)).toEqual(['2026-09', '2026-08']);
  });

  it('un solo mes: sin comparación', () => {
    expect(view([expense('2026-09-10', 50000)]).comparison).toBeUndefined();
  });

  it('comparación con el mes anterior con gastos', () => {
    expect(view(entries).comparison).toEqual({ previousKey: '2026-08', previousTotalCop: 100000, diffCop: -50000, percent: -50 });
    expect(view(entries, 'gasoline', 1).comparison).toBeUndefined(); // agosto es el primero
  });

  it('promedio mensual sobre los meses con gastos, con su número de meses', () => {
    expect(view(entries)).toMatchObject({ monthlyAverageCop: 75000, monthsWithData: 2 });
  });
});

describe('km y costo por km', () => {
  it('km medibles: lectura a ≤ 7 días antes del inicio y otra dentro del mes', () => {
    const month = view([km('2026-08-27', 10000), km('2026-09-29', 11000), expense('2026-09-10', 200000)]);
    expect(month).toMatchObject({ kmTraveled: 1000, costPerKmCop: 200 });
  });

  it('lectura anterior muy lejana: no medible', () => {
    expect(view([km('2026-08-15', 10000), km('2026-09-29', 11000), expense('2026-09-10', 200000)]).kmTraveled).toBeUndefined();
  });

  it('menos de 100 km: no se muestra el costo por km', () => {
    const month = view([km('2026-08-31', 10000), km('2026-09-29', 10080), expense('2026-09-10', 200000)]);
    expect(month.costPerKmCop).toBeUndefined();
  });
});

describe('documentos', () => {
  it('el pago cuenta en el mes de su fecha de pago y no se duplica', () => {
    const soat: HistoryEntry = { id: 'd1', kind: 'document', date: '2026-08-01', docType: 'soat', expiresAt: '2027-08-01', costCop: 500000, paidAt: '2026-09-05' };
    expect(statsMonths([soat], TODAY)).toEqual(['2026-09']);
    const month = view([soat]);
    expect(month.totalCop).toBe(500000);
    expect(month.byCategory).toHaveLength(1);
  });
});

describe('energía según el tipo de energía del carro', () => {
  it('gasolina en galones: cantidad, precio por galón y consumo en km/gal', () => {
    const month = view([fuel('2026-09-01', 10000, 10, 'gal', 150000), fuel('2026-09-20', 10400, 10, 'gal', 160000)]);
    expect(month.energy).toHaveLength(1);
    const [block] = month.energy;
    expect(block).toMatchObject({ kind: 'fuel', title: 'Combustible', subtitle: 'Gasolina', unit: 'gal', quantity: 20, averagePerRecordCop: 155000, avgUnitPriceCop: 15500, spentCop: 310000, costPerKmCop: 400 });
    expect(block.consumption?.unit).toBe('gal');
    expect(block.consumption?.kmPerUnit).toBeCloseTo(40, 6);
    expect(month.energyTile).toMatchObject({ label: 'Combustible', valueCop: 310000 });
  });

  it('gasolina en litros: km/L', () => {
    const [block] = view([fuel('2026-09-01', 10000, 40, 'L', 400000), fuel('2026-09-20', 10400, 40, 'L', 400000)]).energy;
    expect(block).toMatchObject({ unit: 'L', quantity: 80, avgUnitPriceCop: 10000 });
    expect(block.consumption).toMatchObject({ unit: 'L', kmPerUnit: 10 });
  });

  it('eléctrico: kWh y km/kWh, y nunca combustible, gasolina, tanqueo ni galones', () => {
    const month = view([charge('2026-09-01', 10000, 30, 30000), charge('2026-09-15', 10200, 25, 25000)], 'electric');
    expect(month.energy.map((b) => b.kind)).toEqual(['charge']);
    expect(month.energy[0]).toMatchObject({ title: 'Electricidad', unit: 'kWh', avgUnitPriceCop: 1000 });
    expect(month.energy[0].consumption).toMatchObject({ unit: 'kWh', kmPerUnit: 8 });
    expect(month.energyTile.label).toBe('Electricidad');
    expect(JSON.stringify(month)).not.toMatch(/combustible|gasolina|tanqueo|gal[oó]n|"gal"/i);
    // Sin registros: invita a la primera carga eléctrica, no a un tanqueo.
    const empty = view([expense('2026-09-01', 1000)], 'electric');
    expect(empty.energy[0]).toMatchObject({ emptyTitle: 'Registra tu primera carga eléctrica', actionLabel: 'Registrar carga eléctrica' });
    expect(JSON.stringify(empty)).not.toMatch(/combustible|gasolina|tanqueo|gal[oó]n/i);
  });

  it('híbrido enchufable: combustible y electricidad por separado; solo se suman los pesos', () => {
    const month = view([fuel('2026-09-01', 10000, 10, 'gal', 150000), charge('2026-09-05', 10100, 20, 20000)], 'phev_gasoline');
    expect(month.energy.map((b) => [b.kind, b.unit, b.quantity])).toEqual([
      ['fuel', 'gal', 10],
      ['charge', 'kWh', 20],
    ]);
    expect(month.energyTile).toMatchObject({ label: 'Energía', caption: 'Combustible + Electricidad', valueCop: 170000 });
  });

  it('híbrido no enchufable: solo combustible, nada de cargas eléctricas', () => {
    expect(view([expense('2026-09-01', 1000)], 'hybrid_gasoline').energy.map((b) => b.kind)).toEqual(['fuel']);
  });

  it('bicombustible GNC + gasolina: cada energía por separado, GNC en m³ y km/m³', () => {
    const month = view([cng('2026-09-01', 10000, 10, 20000), cng('2026-09-10', 10150, 10, 20000), fuel('2026-09-12', 10200, 5, 'gal', 75000)], 'cng_gasoline');
    expect(month.energy.map((b) => b.kind)).toEqual(['fuel', 'cng']);
    const gas = month.energy.find((b) => b.kind === 'cng');
    expect(gas).toMatchObject({ title: 'Gas natural (GNC)', unit: 'm³', quantity: 20 });
    expect(gas?.consumption).toMatchObject({ unit: 'm³', kmPerUnit: 15 });
  });

  it('energía desconocida: no se asume; solo se muestra lo registrado, con su unidad', () => {
    const none = view([expense('2026-09-01', 1000)], 'unknown');
    expect(none.energy).toEqual([]);
    expect(none.energyUnconfirmed).toBe(true);
    expect(none.energyTile).toMatchObject({ label: 'Energía', caption: 'Depende de tu carro', valueCop: undefined });
    const recorded = view([fuel('2026-09-01', 10000, 30, 'L', 300000)], 'unknown');
    expect(recorded.energy.map((b) => [b.kind, b.unit])).toEqual([['fuel', 'L']]);
  });

  it('carga eléctrica en casa sin costo: desconocida, no $0', () => {
    const month = view([charge('2026-09-03', 10000, 30), expense('2026-09-01', 1000)], 'electric');
    expect(month.energy[0]).toMatchObject({ records: 1, withoutCost: 1, spentCop: undefined, averagePerRecordCop: undefined, avgUnitPriceCop: undefined });
    expect(month.energyTile.valueCop).toBeUndefined();
  });

  it('cargas con costo desconocido no cuentan como $0 en el precio promedio', () => {
    const [block] = view([fuel('2026-09-01', 10000, 10, 'gal', 150000), fuel('2026-09-10', 10200, 10, 'gal')]).energy;
    expect(block).toMatchObject({ withoutCost: 1, avgUnitPriceCop: 15000, averagePerRecordCop: 150000, spentCop: 150000 });
  });

  it('consumo: con un solo registro o sin tanque lleno, datos insuficientes', () => {
    const [single] = view([fuel('2026-09-01', 10000, 10, 'gal', 150000)]).energy;
    expect(single.consumption).toBeUndefined();
    expect(single.consumptionMessage).toBe('Datos insuficientes para calcular consumo');
    const [partial] = view([fuel('2026-09-01', 10000, 10, 'gal', 1, false), fuel('2026-09-10', 10200, 10, 'gal', 1, false)]).energy;
    expect(partial.consumption).toBeUndefined();
  });

  it('km desconocido no sirve para medir el consumo', () => {
    const [block] = view([fuel('2026-09-01', null, 10, 'gal', 150000), fuel('2026-09-20', 10400, 10, 'gal', 160000)]).energy;
    expect(block.consumption).toBeUndefined();
  });
});

describe('últimos 12 meses', () => {
  it('promedio solo sobre los meses con gastos (no ÷ 12)', () => {
    const year = buildYearView([expense('2026-07-10', 100000), expense('2026-09-10', 50000)], TODAY);
    expect(year).toMatchObject({ fromMonth: '2025-10', toMonth: '2026-09', totalCop: 150000, monthsWithExpenses: 2, monthlyAverageCop: 75000 });
  });

  it('carro registrado hace menos de un año: mide desde su primera lectura y solo los gastos desde esa fecha', () => {
    const year = buildYearView([expense('2026-02-10', 100000), km('2026-03-01', 5000), expense('2026-05-10', 200000), km('2026-09-29', 6000)], TODAY);
    expect(year).toMatchObject({ kmMeasured: 1000, costPerKmCop: 200, measuredFrom: '2026-03-01' });
    noBadNumbers(year);
  });

  it('sin km suficientes: sin costo por km', () => {
    expect(buildYearView([expense('2026-09-10', 50000)], TODAY).costPerKmCop).toBeUndefined();
  });
});
