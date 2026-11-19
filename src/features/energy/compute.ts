import { ENERGY_UNITS, type EnergyUnit } from '@/features/cars/energy';
import type { ChargeRecord, EnergyKind, EnergyRecord, FuelUnit, HistoryEntry } from '@/features/history/types';

import { baseQuantity, unitPrice } from './units';
import { cmpText } from '@/shared/utils/compare';

/**
 * Consumo y costos por tipo de energía. Principio: si no hay datos comparables,
 * NO se calcula ("Datos insuficientes para calcular consumo"); nunca se muestra 0
 * como si fuera un consumo, y nunca se mezclan km/L, km/m³ y km/kWh.
 */

export const INSUFFICIENT_DATA_MESSAGE = 'Datos insuficientes para calcular consumo';

type RecordOf<K extends EnergyKind> = Extract<EnergyRecord, { kind: K }>;

/**
 * Registros de un tipo, en orden cronológico. Los del mismo día se ordenan por km; uno
 * con km desconocido va justo después de lo que se había registrado antes que él.
 */
export function energyRecords<K extends EnergyKind>(entries: HistoryEntry[], kind: K): RecordOf<K>[] {
  const byDate = new Map<string, RecordOf<K>[]>();
  for (const e of entries) {
    if (e.kind !== kind) continue;
    const day = byDate.get(e.date);
    if (day) day.push(e as RecordOf<K>);
    else byDate.set(e.date, [e as RecordOf<K>]);
  }
  return [...byDate.keys()].sort().flatMap((date) => orderSameDay(byDate.get(date)!));
}

/** Cuándo se registró (va en el id: "fuel-<milisegundos en base 36>-xxxxx"). Otro formato → undefined. */
export function registeredAt(id: string): number | undefined {
  const match = /^[a-z]+-([0-9a-z]+)-[0-9a-z]+$/.exec(id);
  const time = match ? parseInt(match[1], 36) : NaN;
  return Number.isFinite(time) ? time : undefined;
}

/** Orden de registro; sin fecha de registro, al final y por id (siempre el mismo orden). */
function byRegistration(a: EnergyRecord, b: EnergyRecord): number {
  return (registeredAt(a.id) ?? Infinity) - (registeredAt(b.id) ?? Infinity) || cmpText(a.id, b.id);
}

function orderSameDay<R extends EnergyRecord>(records: R[]): R[] {
  if (records.length < 2) return records;
  const ordered = records.filter((r) => r.km !== null).sort((a, b) => (a.km ?? 0) - (b.km ?? 0) || byRegistration(a, b));
  for (const record of records.filter((r) => r.km === null).sort(byRegistration)) {
    const time = registeredAt(record.id);
    let at = time === undefined ? ordered.length : 0;
    if (time !== undefined) {
      ordered.forEach((other, i) => {
        const otherTime = registeredAt(other.id);
        if (otherTime !== undefined && otherTime <= time) at = i + 1;
      });
    }
    ordered.splice(at, 0, record);
  }
  return ordered;
}

/** Un tramo medible entre dos registros comparables. */
export type ConsumptionPair = {
  kind: EnergyKind;
  from: EnergyRecord;
  to: EnergyRecord;
  distanceKm: number;
  /** Cantidad en unidad BASE (L, m³, kWh) cargada después de `from` hasta `to` incluido. */
  quantity: number;
  /** km por unidad base (km/L, km/m³, km/kWh). */
  kmPerUnit: number;
  /** Costo de ese tramo, solo si TODOS sus registros tienen costo. */
  costCop?: number;
};

/**
 * ¿Es este registro un punto de referencia para medir? Combustible y GNC: tanque
 * lleno / carga completa. Carga eléctrica: tener % final (se compara con otra que
 * termine en el MISMO %).
 */
function anchorLevel(record: EnergyRecord): number | 'full' | undefined {
  if (record.kind === 'fuel') return record.fullTank ? 'full' : undefined;
  if (record.kind === 'cng') return record.fullFill ? 'full' : undefined;
  return isValidPercent(record.endPercent) ? record.endPercent : undefined;
}

/**
 * Tramos "entre registros comparables" (misma metodología para los tres tipos):
 * desde un punto de referencia con km conocido hasta el siguiente punto al MISMO
 * nivel (tanque lleno ↔ tanque lleno; carga al 80 % ↔ carga al 80 %). Lo cargado en
 * medio (parciales) se suma al tramo. Un punto de referencia con km desconocido o
 * de otro nivel corta la cadena: no se fuerza ningún cálculo.
 */
export function consumptionPairs(entries: HistoryEntry[], kind: EnergyKind): ConsumptionPair[] {
  const pairs: ConsumptionPair[] = [];
  let anchor: EnergyRecord | null = null;
  let anchorAt: number | 'full' | undefined;
  let quantity = 0;
  let cost: number | undefined = 0;

  for (const record of energyRecords(entries, kind)) {
    const level = anchorLevel(record);
    if (anchor) {
      quantity += baseQuantity(record);
      cost = cost !== undefined && record.costCop !== undefined ? cost + record.costCop : undefined;
    }
    if (level === undefined) continue;

    if (anchor && level === anchorAt && record.km !== null && anchor.km !== null) {
      const distanceKm = record.km - anchor.km;
      // Solo tramos coherentes: sin distancia positiva o sin cantidad, no hay consumo.
      if (distanceKm > 0 && quantity > 0) {
        pairs.push({ kind, from: anchor, to: record, distanceKm, quantity, kmPerUnit: distanceKm / quantity, costCop: cost });
      }
    }
    // Todo punto de referencia reinicia el tramo (si su km es desconocido, no sirve como inicio).
    anchor = record.km !== null ? record : null;
    anchorAt = level;
    quantity = 0;
    cost = 0;
  }
  return pairs;
}

export type ConsumptionResult =
  | {
      status: 'calculated';
      /** km por unidad base, combinando todos los tramos (distancia total ÷ cantidad total). */
      kmPerUnit: number;
      unit: EnergyUnit['consumption'];
      pairs: number;
      distanceKm: number;
      /** Solo si todos los tramos tienen costo. */
      costPerKmCop?: number;
    }
  | { status: 'insufficient'; message: string };

/** Consumo de un conjunto de tramos del mismo tipo. Sin tramos → datos insuficientes. */
export function summarizeConsumption(pairs: ConsumptionPair[], kind: EnergyKind): ConsumptionResult {
  const distance = pairs.reduce((sum, p) => sum + p.distanceKm, 0);
  const quantity = pairs.reduce((sum, p) => sum + p.quantity, 0);
  if (pairs.length === 0 || distance <= 0 || quantity <= 0) {
    return { status: 'insufficient', message: INSUFFICIENT_DATA_MESSAGE };
  }
  const allCosted = pairs.every((p) => p.costCop !== undefined);
  const cost = pairs.reduce((sum, p) => sum + (p.costCop ?? 0), 0);
  return {
    status: 'calculated',
    kmPerUnit: distance / quantity,
    unit: ENERGY_UNITS[kind].consumption,
    pairs: pairs.length,
    distanceKm: distance,
    costPerKmCop: allCosted ? costPerKm(cost, distance) : undefined,
  };
}

/** Costo por km = costo ÷ km recorridos. Sin km válidos → undefined (nunca ÷0 ni negativos). */
export function costPerKm(costCop: number | undefined, distanceKm: number | undefined): number | undefined {
  if (costCop === undefined || costCop < 0 || distanceKm === undefined || !(distanceKm > 0)) return undefined;
  return costCop / distanceKm;
}

/** El tramo que termina en este registro (para su pantalla de detalle). */
export function consumptionEndingAt(entries: HistoryEntry[], id: string): ConsumptionPair | undefined {
  const record = entries.find((e) => e.id === id);
  if (!record || (record.kind !== 'fuel' && record.kind !== 'cng' && record.kind !== 'charge')) return undefined;
  return consumptionPairs(entries, record.kind).find((p) => p.to.id === id);
}

export type EnergyMonthStats = {
  kind: EnergyKind;
  records: number;
  /** Suma de costos conocidos del mes (registros sin costo no suman ni se inventan). */
  spentCop: number;
  /** Registros del mes sin costo registrado. */
  withoutCost: number;
  /** Cantidad total del mes en unidad base. */
  quantity: number;
  /** Precio promedio por unidad base, solo con registros que tienen costo. */
  avgUnitPriceCop?: number;
  /** Tramos que TERMINAN en el mes. */
  consumption: ConsumptionResult;
};

/** Estadísticas de un tipo de energía en un mes ("AAAA-MM"). */
export function computeEnergyMonthStats(entries: HistoryEntry[], monthKey: string, kind: EnergyKind): EnergyMonthStats {
  const inMonth = energyRecords(entries, kind).filter((r) => r.date.startsWith(monthKey));
  const costed = inMonth.filter((r) => r.costCop !== undefined);
  // Los gastos manuales de "Combustible" también suman al combustible (como antes).
  const manualFuel =
    kind === 'fuel'
      ? entries
          .filter((e) => e.kind === 'expense' && e.category === 'fuel' && e.date.startsWith(monthKey))
          .reduce((sum, e) => sum + (e.kind === 'expense' ? e.amountCop : 0), 0)
      : 0;
  const costedCost = costed.reduce((sum, r) => sum + (r.costCop ?? 0), 0);
  const costedQuantity = costed.reduce((sum, r) => sum + baseQuantity(r), 0);
  const pairs = consumptionPairs(entries, kind).filter((p) => p.to.date.startsWith(monthKey));

  return {
    kind,
    records: inMonth.length,
    spentCop: costedCost + manualFuel,
    withoutCost: inMonth.length - costed.length,
    quantity: inMonth.reduce((sum, r) => sum + baseQuantity(r), 0),
    avgUnitPriceCop: unitPrice(costedCost, costedQuantity),
    consumption: summarizeConsumption(pairs, kind),
  };
}

export type LastPrice = { unitPriceCop: number; unit?: FuelUnit };

/**
 * Último precio unitario que REGISTRÓ el usuario para ese tipo (sugerencia editable
 * para el siguiente registro). No es un precio actual del mercado.
 */
export function lastUnitPrice(entries: HistoryEntry[], kind: EnergyKind, excludeId?: string): LastPrice | undefined {
  const records = energyRecords(entries, kind)
    .filter((r) => r.id !== excludeId)
    .reverse();
  for (const r of records) {
    const price = r.unitPriceCop ?? unitPrice(r.costCop, r.quantity);
    if (price !== undefined && Number.isFinite(price)) {
      return { unitPriceCop: Math.round(price), unit: r.kind === 'fuel' ? r.unit : undefined };
    }
  }
  return undefined;
}

// ── Batería ──────────────────────────────────────────────────────────────────

export function isValidPercent(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Energía ESTIMADA a partir de la batería. Nunca reemplaza los kWh del cargador. */
export type EstimatedEnergy = { kind: 'estimated'; kwh: number };

/**
 * kWh estimados = capacidad × (porcentaje mayor − porcentaje menor) / 100.
 * - Para una carga: de `startPercent` a `endPercent` (energía que entró a la batería).
 * - Entre dos cargas: del % con que terminó la anterior al % con que empezó la
 *   siguiente (energía usada al manejar).
 * Porcentajes inválidos, capacidad desconocida o resultado ≤ 0 → undefined.
 */
export function estimatedEnergy(
  capacityKwh: number | undefined,
  highPercent: number | undefined,
  lowPercent: number | undefined,
): EstimatedEnergy | undefined {
  if (!(capacityKwh !== undefined && capacityKwh > 0)) return undefined;
  if (!isValidPercent(highPercent) || !isValidPercent(lowPercent)) return undefined;
  const kwh = (capacityKwh * (highPercent - lowPercent)) / 100;
  return kwh > 0 ? { kind: 'estimated', kwh } : undefined;
}

/** Energía estimada que entró en una carga (según % de batería). Siempre marcada como estimada. */
export function estimatedChargeEnergy(record: ChargeRecord, capacityKwh: number | undefined): EstimatedEnergy | undefined {
  return estimatedEnergy(capacityKwh, record.endPercent, record.startPercent);
}
