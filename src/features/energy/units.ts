import type { EnergyRecord, FuelUnit } from '@/features/history/types';

/** 1 galón estadounidense = 3,78541 litros (el galón que se usa en los surtidores de Colombia). */
export const LITERS_PER_GALLON = 3.78541;

/** Litros equivalentes a una cantidad de combustible en su unidad. */
export function toLiters(quantity: number, unit: FuelUnit): number {
  return unit === 'gal' ? quantity * LITERS_PER_GALLON : quantity;
}

/**
 * Cantidad en la unidad BASE de cálculo: litros (combustible), m³ (GNC), kWh (carga).
 * Así se puede calcular consumo aunque un tanqueo se haya registrado en galones y otro en litros.
 */
export function baseQuantity(record: EnergyRecord): number {
  return record.kind === 'fuel' ? toLiters(record.quantity, record.unit) : record.quantity;
}

const isPositive = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
const isNonNegative = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Precio unitario = costo total ÷ cantidad. Sin cantidad válida o sin costo → undefined (nunca ÷0). */
export function unitPrice(costCop: number | null | undefined, quantity: number | null | undefined): number | undefined {
  if (!isNonNegative(costCop) || !isPositive(quantity)) return undefined;
  return costCop / quantity;
}

export type AmountsInput = {
  quantity: number | null;
  unitPriceCop: number | null;
  costCop: number | null;
};

export type ResolvedAmounts = {
  quantity?: number;
  unitPriceCop?: number;
  costCop?: number;
  /** Qué valor se calculó (para mostrarlo como "calculado"). */
  computed?: 'quantity' | 'unitPriceCop' | 'costCop';
};

const round = (n: number, decimals: number) => Math.round(n * 10 ** decimals) / 10 ** decimals;

/**
 * Completa cantidad, precio unitario y costo con lo que escribió el usuario:
 * con dos de los tres se calcula el tercero; con uno solo, no se inventa nada.
 * Valores negativos o no numéricos se ignoran (la validación los reporta aparte).
 */
export function resolveAmounts({ quantity, unitPriceCop, costCop }: AmountsInput): ResolvedAmounts {
  const q = isPositive(quantity) ? quantity : undefined;
  const p = isNonNegative(unitPriceCop) ? unitPriceCop : undefined;
  const c = isNonNegative(costCop) ? costCop : undefined;

  // Los tres escritos: se respeta lo que puso el usuario (no se recalcula nada).
  if (q !== undefined && c !== undefined && p !== undefined) return { quantity: q, unitPriceCop: p, costCop: c };
  if (q !== undefined && c !== undefined) {
    return { quantity: q, costCop: c, unitPriceCop: Math.round(c / q), computed: 'unitPriceCop' };
  }
  if (q !== undefined && p !== undefined) {
    return { quantity: q, unitPriceCop: p, costCop: Math.round(q * p), computed: 'costCop' };
  }
  if (c !== undefined && p !== undefined && p > 0) {
    return { quantity: round(c / p, 3), unitPriceCop: p, costCop: c, computed: 'quantity' };
  }
  return { quantity: q, unitPriceCop: p, costCop: c };
}
