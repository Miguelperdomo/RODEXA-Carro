import { liquidFuelLabel } from '@/features/cars/energy';
import type { EnergySource } from '@/features/cars/types';
import type { ChargeType, EnergyKind, EnergyRecord, FuelUnit, HistoryEntry } from '@/features/history/types';
import type { NewEnergyRecord } from '@/features/session/userDataActions';
import { formatCop } from '@/shared/utils/format';

import { energyRecords } from './compute';
import { ENERGY_META, FUEL_UNIT_LABELS } from './meta';
import { unitPrice } from './units';

/**
 * Lógica del formulario de registro de energía (sin pantalla, se prueba aparte).
 * Flujo principal: lo que pagaste + el precio → RODEXA calcula la cantidad. Lo que se
 * guarda es exactamente lo de siempre (cantidad, costo, precio): sin cambios de datos.
 */

/** Eléctrico: pagó en una estación (precio por kWh) o cargó en casa / no sabe el costo (kWh). */
export type ChargeMode = 'station' | 'home';

// ── Textos según la energía ─────────────────────────────────────────────────

/** "Carga de gasolina", "Carga de diésel", "Carga de GNC", "Carga eléctrica". */
export function energyActionTitle(kind: EnergyKind, energySource?: EnergySource): string {
  if (kind !== 'fuel') return ENERGY_META[kind].action;
  const fuel = liquidFuelLabel(energySource);
  return fuel === 'Combustible' ? 'Carga de combustible' : `Carga de ${fuel.toLowerCase()}`;
}

/** Descripción en el menú "+". */
export const ENERGY_ACTION_DESCRIPTIONS: Record<EnergyKind, string> = {
  fuel: 'Lo que pagaste, el precio y el kilometraje',
  cng: 'Lo que pagaste, el precio y el kilometraje',
  charge: 'Lo que pagaste o los kWh, y el kilometraje',
};

/** Pregunta de "lleno" (combustible y GNC). */
export const FULL_QUESTION: Partial<Record<EnergyKind, { label: string; hint: string }>> = {
  fuel: {
    label: '¿Llenaste el tanque?',
    hint: 'Con dos cargas de tanque lleno, RODEXA puede calcular tu consumo.',
  },
  cng: {
    label: '¿Llenaste el cilindro?',
    hint: 'Con dos cargas completas RODEXA puede calcular tu consumo.',
  },
};

/** "galón", "litro", "m³", "kWh". */
export function unitName(kind: EnergyKind, unit: FuelUnit): string {
  return kind === 'fuel' ? FUEL_UNIT_LABELS[unit].long : kind === 'cng' ? 'm³' : 'kWh';
}
/** "gal", "L", "m³", "kWh". */
export function unitShort(kind: EnergyKind, unit: FuelUnit): string {
  return kind === 'fuel' ? FUEL_UNIT_LABELS[unit].short : kind === 'cng' ? 'm³' : 'kWh';
}
/** "galones", "litros", "m³", "kWh" (para la cantidad calculada). */
export function unitPlural(kind: EnergyKind, unit: FuelUnit): string {
  return kind === 'fuel' ? FUEL_UNIT_LABELS[unit].plural.toLowerCase() : kind === 'cng' ? 'm³' : 'kWh';
}

// ── Último precio registrado (dato del usuario, no un precio actual) ────────

export type RegisteredPrice = { unitPriceCop: number; unit?: FuelUnit; date: string };

/**
 * El último precio por unidad que REGISTRÓ el usuario para este tipo, con la fecha de
 * ese registro. RODEXA no consulta precios: es solo una sugerencia editable.
 */
export function lastRegisteredPrice(entries: HistoryEntry[], kind: EnergyKind): RegisteredPrice | undefined {
  const records = [...energyRecords(entries, kind)].reverse();
  for (const r of records) {
    const price = r.unitPriceCop ?? unitPrice(r.costCop, r.quantity);
    if (price !== undefined && Number.isFinite(price)) {
      return { unitPriceCop: Math.round(price), unit: r.kind === 'fuel' ? r.unit : undefined, date: r.date };
    }
  }
  return undefined;
}

/** Galón por defecto (como se vende en Colombia); si ya registró antes, su última unidad. */
export function defaultFuelUnit(entries: HistoryEntry[]): FuelUnit {
  return energyRecords(entries, 'fuel').at(-1)?.unit ?? 'gal';
}

/** Eléctrico nuevo: "en casa" si la última carga no tenía costo; si no, "estación". */
export function defaultChargeMode(entries: HistoryEntry[]): ChargeMode {
  const last = energyRecords(entries, 'charge').at(-1);
  return last && last.costCop === undefined ? 'home' : 'station';
}

// ── Cuentas: lo pagado, el precio y la cantidad ─────────────────────────────

export type AmountsDraft = {
  costCop: number | null;
  unitPriceCop: number | null;
  /** "Sé la cantidad exacta" (Más datos), o los kWh en el modo "en casa". */
  exactQuantity: number | null;
  /** El precio es el último registrado y el usuario no lo cambió. */
  priceIsSuggestion: boolean;
};

export type EnergyAmounts = {
  quantity?: number;
  costCop?: number;
  unitPriceCop?: number;
  quantitySource?: 'calculated' | 'exact';
  priceSource?: 'typed' | 'suggested' | 'calculated';
  costSource?: 'typed' | 'calculated';
  /** El usuario escribió los tres valores y no cuadran (más de 2 %). */
  inconsistent: boolean;
};

/** Diferencia tolerada entre lo pagado y cantidad × precio (redondeos del surtidor). */
export const CONSISTENCY_TOLERANCE = 0.02;

const positive = (n: number | null) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined);
const nonNegative = (n: number | null) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined);
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Completa cantidad, costo y precio. Nunca inventa: con un solo dato no calcula, y un
 * precio sugerido sin lo pagado no se usa para "adivinar" el costo.
 * - Lo pagado + precio → cantidad calculada (flujo principal).
 * - Cantidad exacta + lo pagado → si el precio era el sugerido (o no hay), se recalcula
 *   (es el precio real pagado); si el usuario lo escribió, se respeta y se avisa si no cuadra.
 * - Cantidad exacta + precio escrito, sin lo pagado → costo calculado.
 */
export function resolveEnergyAmounts(draft: AmountsDraft): EnergyAmounts {
  const q = positive(draft.exactQuantity);
  const c = nonNegative(draft.costCop);
  const p = nonNegative(draft.unitPriceCop);
  const typedPrice = p !== undefined && !draft.priceIsSuggestion;

  if (q !== undefined) {
    if (c !== undefined) {
      if (typedPrice) {
        const inconsistent = c > 0 && Math.abs(q * p - c) / c > CONSISTENCY_TOLERANCE;
        return { quantity: q, costCop: c, unitPriceCop: p, quantitySource: 'exact', priceSource: 'typed', costSource: 'typed', inconsistent };
      }
      return {
        quantity: q,
        costCop: c,
        unitPriceCop: Math.round(c / q),
        quantitySource: 'exact',
        priceSource: 'calculated',
        costSource: 'typed',
        inconsistent: false,
      };
    }
    if (typedPrice) {
      return {
        quantity: q,
        costCop: Math.round(q * p),
        unitPriceCop: p,
        quantitySource: 'exact',
        priceSource: 'typed',
        costSource: 'calculated',
        inconsistent: false,
      };
    }
    // Sin lo pagado: costo desconocido (el precio sugerido no se guarda como si se hubiera pagado).
    return { quantity: q, quantitySource: 'exact', inconsistent: false };
  }

  if (c !== undefined && p !== undefined && p > 0) {
    const quantity = round3(c / p);
    if (quantity > 0) {
      return {
        quantity,
        costCop: c,
        unitPriceCop: p,
        quantitySource: 'calculated',
        priceSource: draft.priceIsSuggestion ? 'suggested' : 'typed',
        costSource: 'typed',
        inconsistent: false,
      };
    }
  }
  return { costCop: c, unitPriceCop: typedPrice ? p : undefined, inconsistent: false };
}

export type AmountsIssues = {
  /** Falta algo para conocer la cantidad (bloquea). */
  error?: string;
  /** La cantidad exacta escrita no es válida (bloquea). */
  exactError?: string;
  /** Los tres valores no cuadran (pide confirmar). */
  warning?: string;
};

export function amountsIssues(
  kind: EnergyKind,
  mode: ChargeMode,
  draft: AmountsDraft,
  amounts: EnergyAmounts,
  unit: FuelUnit,
): AmountsIssues {
  const issues: AmountsIssues = {};
  if (draft.exactQuantity !== null && !(draft.exactQuantity > 0)) issues.exactError = 'Debe ser mayor a 0.';
  if (draft.costCop !== null && draft.costCop < 0) issues.error = 'Lo pagado no puede ser negativo.';
  else if (draft.unitPriceCop !== null && draft.unitPriceCop < 0) issues.error = 'El precio no puede ser negativo.';
  else if (amounts.quantity === undefined && !issues.exactError) {
    const name = unitName(kind, unit);
    if (kind === 'charge' && mode === 'home') issues.error = 'Escribe los kWh que cargaste (los marca el cargador o su app).';
    else if (draft.costCop === 0) issues.error = 'Si fue gratis, escribe la cantidad exacta en “Más datos”.';
    else if (draft.costCop === null) issues.error = 'Escribe cuánto pagaste (o la cantidad exacta en “Más datos”).';
    else issues.error = `Escribe el precio por ${name} (o la cantidad exacta en “Más datos”).`;
  }
  if (amounts.inconsistent && amounts.quantity !== undefined && amounts.unitPriceCop !== undefined) {
    const expected = Math.round(amounts.quantity * amounts.unitPriceCop);
    issues.warning = `Lo pagado no coincide con la cantidad por el precio (sería ${formatCop(expected)}). Revisa los valores.`;
  }
  return issues;
}

// ── Estado inicial al editar y registro a guardar ───────────────────────────

export type EnergyFormState = {
  kind: EnergyKind;
  mode: ChargeMode;
  unit: FuelUnit;
  costCop: number | null;
  unitPriceCop: number | null;
  exactQuantity: number | null;
  full: boolean;
  startPercent: number | null;
  endPercent: number | null;
  chargeType?: ChargeType;
  place: string;
  km: number | null;
  kmUnknown: boolean;
  date: string;
  note: string;
};

/**
 * Un registro existente se abre con TODO lo que tiene: su cantidad como "exacta" (así
 * nunca se recalcula sin querer) y su costo y precio tal cual.
 */
export function stateFromRecord(record: EnergyRecord): EnergyFormState {
  // Si la cantidad guardada es exactamente lo pagado ÷ el precio (así se guarda cuando
  // RODEXA la calculó), se trata como calculada: al cambiar lo pagado se recalcula.
  const calculated =
    record.costCop !== undefined &&
    record.unitPriceCop !== undefined &&
    record.unitPriceCop > 0 &&
    Math.abs(Math.round((record.costCop / record.unitPriceCop) * 1000) / 1000 - record.quantity) < 0.0005;
  return {
    kind: record.kind,
    mode: record.kind === 'charge' && record.costCop === undefined ? 'home' : 'station',
    unit: record.kind === 'fuel' ? record.unit : 'L',
    costCop: record.costCop ?? null,
    unitPriceCop: record.unitPriceCop ?? null,
    exactQuantity: calculated ? null : record.quantity,
    full: record.kind === 'fuel' ? record.fullTank : record.kind === 'cng' ? record.fullFill : true,
    startPercent: record.kind === 'charge' ? (record.startPercent ?? null) : null,
    endPercent: record.kind === 'charge' ? (record.endPercent ?? null) : null,
    chargeType: record.kind === 'charge' ? record.chargeType : undefined,
    place: (record.kind === 'charge' ? record.location : record.station) ?? '',
    km: record.km,
    kmUnknown: record.km === null,
    date: record.date,
    note: record.note ?? '',
  };
}

/** El registro que se guarda: mismos campos de siempre. Desconocido = ausente (nunca 0). */
export function buildEnergyRecord(state: EnergyFormState, amounts: EnergyAmounts): NewEnergyRecord | undefined {
  if (amounts.quantity === undefined) return undefined;
  const place = state.place.trim() || undefined;
  const common = {
    date: state.date,
    km: state.kmUnknown ? null : state.km,
    quantity: amounts.quantity,
    costCop: amounts.costCop,
    unitPriceCop: amounts.unitPriceCop,
    note: state.note.trim() || undefined,
  };
  if (state.kind === 'fuel') return { ...common, kind: 'fuel', unit: state.unit, fullTank: state.full, station: place };
  if (state.kind === 'cng') return { ...common, kind: 'cng', fullFill: state.full, station: place };
  return {
    ...common,
    kind: 'charge',
    startPercent: state.startPercent ?? undefined,
    endPercent: state.endPercent ?? undefined,
    chargeType: state.chargeType,
    location: place,
  };
}
