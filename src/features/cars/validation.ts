import { OTHER_BRAND_ID, OTHER_MODEL_ID } from '@/features/catalogs/types';
import type { CarSelection } from '@/features/catalogs/selection';
import { formatKm } from '@/shared/utils/format';

import { engineCcRequired } from './vehicleOptions';

export type ProfileErrors = {
  brand?: string;
  model?: string;
  year?: string;
  energySource?: string;
  displacementCc?: string;
  plate?: string;
};

/**
 * Selección de catálogo + placa. Marca, modelo, año y combustible son obligatorios
 * ("No sé" es una respuesta válida). El cilindraje solo si hay motor de combustión.
 */
export function validateProfile(
  selection: CarSelection,
  plate: string,
): ProfileErrors {
  const errors: ProfileErrors = {};
  if (selection.brandId === null) {
    errors.brand = 'Elige la marca de tu carro.';
  } else if (selection.brandId === OTHER_BRAND_ID && selection.otherBrandName.trim() === '') {
    errors.brand = 'Escribe la marca de tu carro.';
  }
  if (selection.modelId === null) {
    errors.model = 'Elige el modelo.';
  } else if (selection.modelId === OTHER_MODEL_ID && selection.otherModelName.trim() === '') {
    errors.model = 'Escribe el modelo de tu carro.';
  }
  if (selection.year === null) errors.year = 'Elige el año.';
  if (selection.energySource === null) errors.energySource = 'Elige el combustible o la energía (o “No sé”).';
  if (
    selection.engineCc === null &&
    selection.energySource !== null &&
    engineCcRequired({ energySource: selection.energySource })
  ) {
    errors.displacementCc = 'Elige el cilindraje.';
  }
  const plateError = carPlateError(plate);
  if (plateError) errors.plate = plateError;
  return errors;
}

type VehicleDetails = { tankCapacityLiters?: number | null; batteryCapacityKwh?: number | null };

/** Datos opcionales del vehículo. Sin límites inventados: solo que no sean 0 o negativos. */
export function validateVehicleDetails(details: VehicleDetails): Partial<Record<keyof VehicleDetails, string>> {
  const errors: Partial<Record<keyof VehicleDetails, string>> = {};
  for (const key of Object.keys(details) as (keyof VehicleDetails)[]) {
    const value = details[key];
    if (value !== null && value !== undefined && value <= 0) errors[key] = 'Debe ser mayor a 0, o déjalo vacío.';
  }
  return errors;
}

/** Placa de carro en Colombia: 3 letras y 3 números (ABC123). */
export const CAR_PLATE = /^[A-Z]{3}\d{3}$/;
/** Placa de moto (ABC12D): no es válida para un carro. */
const MOTO_PLATE = /^[A-Z]{3}\d{2}[A-Z]$/;

/** Error de la placa (opcional: vacía es válida). Bloquea guardar si no es ABC123. */
export function carPlateError(plate: string): string | undefined {
  if (plate === '') return undefined;
  if (!/^[A-Z0-9]+$/.test(plate)) return 'Usa solo letras y números, sin espacios ni guiones.';
  if (CAR_PLATE.test(plate)) return undefined;
  if (MOTO_PLATE.test(plate)) {
    return 'Ese formato (ABC12D) es de moto. La placa de un carro tiene 3 letras y 3 números, por ejemplo ABC123.';
  }
  return 'La placa de un carro tiene 3 letras y 3 números, por ejemplo ABC123.';
}

type ComponentConfigInput = {
  enabled: boolean;
  lastKm: number | null;
  lastUnknown: boolean;
  /** Intervalo del usuario: en km, en meses o ambos ("lo que llegue primero"). */
  intervalKm: number | null;
  intervalMonths: number | null;
  currentKm: number;
  /** Hay un intervalo del fabricante con fuente: el del usuario pasa a ser opcional. */
  hasSourcedInterval?: boolean;
};

export type ComponentConfigErrors = {
  lastKm?: string;
  intervalKm?: string;
  intervalMonths?: string;
};

export function validateComponentConfig(input: ComponentConfigInput): ComponentConfigErrors {
  const errors: ComponentConfigErrors = {};
  if (!input.enabled) return errors;

  if (!input.lastUnknown && input.lastKm !== null && input.lastKm > input.currentKm) {
    errors.lastKm = `No puede ser mayor a tu kilometraje registrado (${formatKm(input.currentKm)}).`;
  }
  if (input.intervalKm !== null && input.intervalKm <= 0) errors.intervalKm = 'Debe ser mayor a 0, o déjalo vacío.';
  if (input.intervalMonths !== null && input.intervalMonths <= 0) {
    errors.intervalMonths = 'Debe ser mayor a 0, o déjalo vacío.';
  }
  if (input.intervalKm === null && input.intervalMonths === null && !input.hasSourcedInterval) {
    errors.intervalKm = 'Indica cada cuántos km, cada cuántos meses, o ambos.';
  }
  return errors;
}
