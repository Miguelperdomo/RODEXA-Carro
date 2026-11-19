/** Formulario de registro de energía: lo pagado + precio → cantidad. Datos de PRUEBA. */
import { energyRecordKinds } from '@/features/cars/energy';
import type { EnergySource } from '@/features/cars/types';
import type { ChargeRecord, EnergyRecord, FuelRecord, HistoryEntry } from '@/features/history/types';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';

import { consumptionPairs, summarizeConsumption } from '../compute';
import {
  amountsIssues,
  buildEnergyRecord,
  defaultChargeMode,
  defaultFuelUnit,
  energyActionTitle,
  lastRegisteredPrice,
  resolveEnergyAmounts,
  stateFromRecord,
  type AmountsDraft,
  type EnergyFormState,
} from '../form';

const TODAY = new Date(2026, 8, 30);

const profileOf = (energySource: EnergySource) =>
  buildAppDataFromOnboarding(
    {
      user: { name: 'Ana', city: '' },
      profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
      km: 10000,
      maintenance: [],
      documents: {},
      completedAt: '2026-09-01',
    },
    TODAY,
  ).profile;

const draft = (d: Partial<AmountsDraft>): AmountsDraft => ({
  costCop: null,
  unitPriceCop: null,
  exactQuantity: null,
  priceIsSuggestion: false,
  ...d,
});

const baseState = (d: Partial<EnergyFormState> = {}): EnergyFormState => ({
  kind: 'fuel',
  mode: 'station',
  unit: 'gal',
  costCop: null,
  unitPriceCop: null,
  exactQuantity: null,
  full: true,
  startPercent: null,
  endPercent: null,
  place: '',
  km: 10500,
  kmUnknown: false,
  date: '2026-09-30',
  note: '',
  ...d,
});

const fuelRecord = (d: Partial<FuelRecord> = {}): FuelRecord => ({
  id: 'f1',
  kind: 'fuel',
  date: '2026-09-28',
  km: 10000,
  quantity: 5.161,
  unit: 'gal',
  fullTank: true,
  costCop: 80000,
  unitPriceCop: 15500,
  ...d,
});

describe('qué puede registrar cada carro y cómo se llama', () => {
  const menu = (energySource: EnergySource) => {
    const profile = profileOf(energySource);
    return energyRecordKinds(profile).map((k) => energyActionTitle(k, profile.energySource));
  };

  it('gasolina, diésel, GNC, bicombustible, eléctrico, híbrido y enchufable', () => {
    expect(menu('gasoline')).toEqual(['Carga de gasolina']);
    expect(menu('diesel')).toEqual(['Carga de diésel']);
    expect(menu('cng')).toEqual(['Carga de GNC']);
    expect(menu('cng_gasoline')).toEqual(['Carga de gasolina', 'Carga de GNC']);
    expect(menu('electric')).toEqual(['Carga eléctrica']);
    expect(menu('hybrid_gasoline')).toEqual(['Carga de gasolina']);
    expect(menu('hybrid_diesel')).toEqual(['Carga de diésel']);
    expect(menu('phev_gasoline')).toEqual(['Carga de gasolina', 'Carga eléctrica']);
    expect(menu('phev_diesel')).toEqual(['Carga de diésel', 'Carga eléctrica']);
    expect(menu('unknown')).toEqual([]);
  });
});

describe('cantidad calculada (flujo principal)', () => {
  it('lo pagado ÷ precio → ≈ 5,16 galones', () => {
    const amounts = resolveEnergyAmounts(draft({ costCop: 80000, unitPriceCop: 15500, priceIsSuggestion: true }));
    expect(amounts).toMatchObject({ quantity: 5.161, costCop: 80000, unitPriceCop: 15500, quantitySource: 'calculated', priceSource: 'suggested' });
  });

  it('GNC en m³ y eléctrico en estación en kWh, con la misma regla', () => {
    expect(resolveEnergyAmounts(draft({ costCop: 30000, unitPriceCop: 3000 })).quantity).toBe(10);
    expect(resolveEnergyAmounts(draft({ costCop: 40000, unitPriceCop: 1250 })).quantity).toBe(32);
  });

  it('con un solo dato no calcula ni inventa', () => {
    expect(resolveEnergyAmounts(draft({ costCop: 80000 })).quantity).toBeUndefined();
    expect(resolveEnergyAmounts(draft({ unitPriceCop: 15500 })).quantity).toBeUndefined();
    expect(resolveEnergyAmounts(draft({ costCop: 80000, unitPriceCop: 0 })).quantity).toBeUndefined();
  });

  it('mensajes en el nuevo orden', () => {
    const issue = (d: Partial<AmountsDraft>, kind: 'fuel' | 'charge' = 'fuel', mode: 'station' | 'home' = 'station') =>
      amountsIssues(kind, mode, draft(d), resolveEnergyAmounts(draft(d)), 'gal').error;
    expect(issue({})).toMatch(/Escribe cuánto pagaste/);
    expect(issue({ costCop: 80000 })).toMatch(/precio por galón/);
    expect(issue({ costCop: 0, unitPriceCop: 15500 })).toMatch(/gratis/);
    expect(issue({}, 'charge', 'home')).toMatch(/kWh que cargaste/);
    expect(issue({ costCop: 80000, unitPriceCop: 15500 })).toBeUndefined();
    expect(amountsIssues('fuel', 'station', draft({ exactQuantity: 0 }), resolveEnergyAmounts(draft({ exactQuantity: 0 })), 'gal').exactError).toBe('Debe ser mayor a 0.');
  });
});

describe('cantidad exacta (Más datos)', () => {
  it('reemplaza la calculada; si el precio era el sugerido, se recalcula el precio pagado', () => {
    const amounts = resolveEnergyAmounts(draft({ costCop: 80000, unitPriceCop: 15500, priceIsSuggestion: true, exactQuantity: 5.2 }));
    expect(amounts).toMatchObject({ quantity: 5.2, costCop: 80000, unitPriceCop: 15385, quantitySource: 'exact', priceSource: 'calculated' });
  });

  it('los tres escritos por el usuario se respetan; si no cuadran, se avisa', () => {
    const ok = draft({ costCop: 80000, unitPriceCop: 15500, exactQuantity: 5.16 });
    expect(resolveEnergyAmounts(ok)).toMatchObject({ unitPriceCop: 15500, inconsistent: false });
    const bad = draft({ costCop: 80000, unitPriceCop: 15500, exactQuantity: 6 });
    const amounts = resolveEnergyAmounts(bad);
    expect(amounts.inconsistent).toBe(true);
    expect(amountsIssues('fuel', 'station', bad, amounts, 'gal').warning).toMatch(/no coincide/);
  });

  it('cantidad exacta sin lo pagado: costo desconocido; el precio sugerido no inventa un costo', () => {
    expect(resolveEnergyAmounts(draft({ exactQuantity: 5, unitPriceCop: 15500, priceIsSuggestion: true }))).toEqual({
      quantity: 5,
      quantitySource: 'exact',
      inconsistent: false,
    });
    // Si el usuario escribió el precio, el total se calcula.
    expect(resolveEnergyAmounts(draft({ exactQuantity: 5, unitPriceCop: 15000 }))).toMatchObject({ costCop: 75000, costSource: 'calculated' });
  });
});

describe('eléctrico en casa sin costo', () => {
  it('solo kWh: costo desconocido (no $0), y un 0 escrito sí es gratis', () => {
    const unknown = resolveEnergyAmounts(draft({ exactQuantity: 30 }));
    expect(unknown).toEqual({ quantity: 30, quantitySource: 'exact', inconsistent: false });
    const record = buildEnergyRecord(baseState({ kind: 'charge', mode: 'home', exactQuantity: 30, endPercent: 80 }), unknown) as ChargeRecord;
    expect(record).toMatchObject({ kind: 'charge', quantity: 30, endPercent: 80 });
    expect('costCop' in record && record.costCop !== undefined).toBe(false);
    const free = resolveEnergyAmounts(draft({ exactQuantity: 30, costCop: 0 }));
    expect(free).toMatchObject({ costCop: 0, unitPriceCop: 0 });
  });

  it('modo por defecto: "en casa" si la última carga no tenía costo', () => {
    const c = (costCop?: number): ChargeRecord => ({ id: `c${costCop}`, kind: 'charge', date: '2026-09-01', km: 1, quantity: 10, costCop });
    expect(defaultChargeMode([c()])).toBe('home');
    expect(defaultChargeMode([c(10000)])).toBe('station');
    expect(defaultChargeMode([])).toBe('station');
  });
});

describe('último precio registrado y unidad', () => {
  it('es el precio y la fecha de TU último registro de ese tipo', () => {
    const entries: HistoryEntry[] = [fuelRecord({ id: 'a', date: '2026-09-10', unitPriceCop: 15000 }), fuelRecord({ id: 'b', date: '2026-09-28', unitPriceCop: 15500 })];
    expect(lastRegisteredPrice(entries, 'fuel')).toEqual({ unitPriceCop: 15500, unit: 'gal', date: '2026-09-28' });
    expect(lastRegisteredPrice(entries, 'charge')).toBeUndefined();
  });

  it('galón por defecto; si ya registró en litros, litros', () => {
    expect(defaultFuelUnit([])).toBe('gal');
    expect(defaultFuelUnit([fuelRecord({ unit: 'L' })])).toBe('L');
  });
});

describe('guardar y editar', () => {
  it('km desconocido se guarda como null, nunca 0', () => {
    const amounts = resolveEnergyAmounts(draft({ costCop: 80000, unitPriceCop: 15500 }));
    expect(buildEnergyRecord(baseState({ km: null, kmUnknown: true }), amounts)?.km).toBeNull();
  });

  it('sin cantidad no se guarda nada', () => {
    expect(buildEnergyRecord(baseState(), resolveEnergyAmounts(draft({ costCop: 80000 })))).toBeUndefined();
  });

  it('editar un registro existente no cambia nada si no se toca', () => {
    const records: EnergyRecord[] = [
      fuelRecord(),
      fuelRecord({ costCop: undefined, unitPriceCop: undefined, station: 'Terpel', note: 'viaje' }),
      { id: 'g', kind: 'cng', date: '2026-09-20', km: 9000, quantity: 10, fullFill: false, costCop: 30000, unitPriceCop: 3000 },
      { id: 'c', kind: 'charge', date: '2026-09-21', km: null, quantity: 30, startPercent: 20, endPercent: 80, chargeType: 'ac', location: 'Casa' },
    ];
    for (const record of records) {
      const state = stateFromRecord(record);
      const amounts = resolveEnergyAmounts({
        costCop: state.costCop,
        unitPriceCop: state.unitPriceCop,
        exactQuantity: state.exactQuantity,
        priceIsSuggestion: false,
      });
      const { id: _id, ...expected } = record;
      expect(buildEnergyRecord(state, amounts)).toEqual(expected);
    }
    expect(stateFromRecord(records[3]).mode).toBe('home');
  });

  it('la cantidad calculada alimenta el consumo igual que una escrita', () => {
    const save = (id: string, date: string, km: number, cost: number) => {
      const amounts = resolveEnergyAmounts(draft({ costCop: cost, unitPriceCop: 15500, priceIsSuggestion: true }));
      return { id, ...buildEnergyRecord(baseState({ km, date }), amounts) } as FuelRecord;
    };
    const entries = [save('a', '2026-09-01', 10000, 80000), save('b', '2026-09-15', 10200, 77500)];
    const consumption = summarizeConsumption(consumptionPairs(entries, 'fuel'), 'fuel');
    expect(consumption.status).toBe('calculated');
    // 200 km con 5 galones (= 18,93 L) ≈ 10,57 km/L
    expect(consumption.status === 'calculated' && consumption.kmPerUnit).toBeCloseTo(200 / (5 * 3.78541), 2);
  });
});
