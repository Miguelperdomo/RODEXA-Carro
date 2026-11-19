import type { EnergyKind, FuelUnit } from '@/features/history/types';
import { kmTypoWarning, MAX_PLAUSIBLE_KM_PER_DAY } from '@/features/odometer/validation';
import { formatKm } from '@/shared/utils/format';

import { isValidPercent } from './compute';
import { resolveAmounts, toLiters } from './units';

export type EnergyInput = {
  kind: EnergyKind;
  date: Date | null;
  km: number | null;
  /** "No sé el kilometraje": válido, sin errores ni advertencias de km. */
  kmUnknown?: boolean;
  quantity: number | null;
  unit?: FuelUnit;
  unitPriceCop: number | null;
  costCop: number | null;
  startPercent?: number | null;
  endPercent?: number | null;
};

export type EnergyContext = {
  /** Último km registrado (0 al corregir un registro, para no compararlo consigo mismo). */
  lastKm: number;
  /** Días entre el último km registrado y la fecha del registro. */
  daysSinceLast: number;
  /** Capacidad del tanque del perfil, si el usuario la registró. */
  tankCapacityLiters?: number;
};

export type EnergyErrors = Partial<
  Record<'date' | 'km' | 'quantity' | 'unitPriceCop' | 'costCop' | 'startPercent' | 'endPercent', string>
>;
export type EnergyWarnings = Partial<Record<'km' | 'quantity', string>>;

const QUANTITY_LABEL: Record<EnergyKind, string> = {
  fuel: 'la cantidad de combustible',
  cng: 'los m³ cargados',
  charge: 'los kWh cargados',
};

const isNegative = (n: number | null | undefined) => typeof n === 'number' && n < 0;

/**
 * Validación de un registro de energía. Errores bloquean; advertencias piden
 * confirmar (segundo toque). No hay límites inventados: el único tope de cantidad
 * es la capacidad del tanque que registró el propio usuario.
 */
export function validateEnergyRecord(
  input: EnergyInput,
  context: EnergyContext,
): { errors: EnergyErrors; warnings: EnergyWarnings } {
  const errors: EnergyErrors = {};
  const warnings: EnergyWarnings = {};

  if (!input.date || Number.isNaN(input.date.getTime())) errors.date = 'Elige una fecha válida.';

  if (!input.kmUnknown) {
    if (input.km === null) errors.km = 'Escribe el kilometraje o marca “No sé el kilometraje”.';
    else if (input.km < 0) errors.km = 'El kilometraje no puede ser negativo.';
    else if (input.km < context.lastKm) {
      warnings.km = `Es menor a tu último kilometraje registrado (${formatKm(context.lastKm)}). ¿Estás corrigiendo un registro anterior?`;
    } else if (kmTypoWarning(input.km, context.lastKm)) {
      warnings.km = kmTypoWarning(input.km, context.lastKm);
    } else if ((input.km - context.lastKm) / Math.max(context.daysSinceLast, 1) > MAX_PLAUSIBLE_KM_PER_DAY) {
      warnings.km = `Son ${formatKm(input.km - context.lastKm)} más que tu último registro. ¿El km está bien?`;
    }
  }

  if (isNegative(input.costCop)) errors.costCop = 'El costo no puede ser negativo.';
  if (isNegative(input.unitPriceCop)) errors.unitPriceCop = 'El precio no puede ser negativo.';
  if (input.quantity !== null && input.quantity <= 0) {
    errors.quantity = 'Debe ser mayor a 0.';
  } else {
    // Se necesita la cantidad, o costo + precio para calcularla.
    const { quantity } = resolveAmounts(input);
    if (quantity === undefined) {
      errors.quantity = `Escribe ${QUANTITY_LABEL[input.kind]} (o el costo total y el precio por unidad).`;
    } else if (
      input.kind === 'fuel' &&
      context.tankCapacityLiters !== undefined &&
      toLiters(quantity, input.unit ?? 'L') > context.tankCapacityLiters
    ) {
      warnings.quantity = `Es más que la capacidad del tanque que registraste (${context.tankCapacityLiters} L). Revisa la cantidad.`;
    }
  }

  if (input.kind === 'charge') {
    const { startPercent, endPercent } = input;
    if (startPercent != null && !isValidPercent(startPercent)) errors.startPercent = 'Debe estar entre 0 y 100 %.';
    if (endPercent != null && !isValidPercent(endPercent)) errors.endPercent = 'Debe estar entre 0 y 100 %.';
    if (isValidPercent(startPercent ?? undefined) && isValidPercent(endPercent ?? undefined) && endPercent! <= startPercent!) {
      errors.endPercent = 'El % final de una carga debe ser mayor que el inicial.';
    }
  }

  return { errors, warnings };
}
