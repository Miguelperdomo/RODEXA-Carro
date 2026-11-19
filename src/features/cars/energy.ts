import type { EnergyKind } from '@/features/history/types';

import { capabilitiesOf, type CapabilityId, type CapabilityInput } from './capabilities';
import type { EnergySource } from './types';

/**
 * Registros de energía, uno por tipo y cada uno con SU unidad. Nunca se mezclan:
 * el consumo de un tipo solo se calcula con registros de ese mismo tipo.
 * - fuel: combustible líquido (gasolina / diésel), en litros o galones.
 * - cng: gas natural vehicular, en m³.
 * - charge: electricidad cargada desde la red, en kWh.
 */
export type EnergyRecordKind = EnergyKind;

export type EnergyUnit = { quantity: 'L' | 'm³' | 'kWh'; consumption: 'km/L' | 'km/m³' | 'km/kWh' };

/** Unidad BASE de cálculo (el combustible en galones se normaliza a litros antes de calcular). */
export const ENERGY_UNITS: Record<EnergyRecordKind, EnergyUnit> = {
  fuel: { quantity: 'L', consumption: 'km/L' },
  cng: { quantity: 'm³', consumption: 'km/m³' },
  charge: { quantity: 'kWh', consumption: 'km/kWh' },
};

/** Qué capacidad CONFIRMADA necesita cada registro. Un híbrido NO enchufable no registra cargas. */
const RECORD_REQUIRES: Record<EnergyRecordKind, CapabilityId> = {
  fuel: 'liquid-fuel',
  cng: 'cng',
  charge: 'external-charging',
};

const ORDER: EnergyRecordKind[] = ['fuel', 'cng', 'charge'];

/**
 * Registros que puede hacer este vehículo. A diferencia del mantenimiento, aquí
 * no se asume nada: solo se ofrece un registro si su capacidad está confirmada.
 * - Gasolina / diésel / HEV → fuel · GNC → cng · GNC + gasolina (dual) → cng + fuel
 *   · Eléctrico → charge · PHEV → fuel + charge.
 * - "No sé" u "Otro" sin capacidades confirmadas → ninguno (se pide confirmar la energía).
 */
export function energyRecordKinds(profile: CapabilityInput): EnergyRecordKind[] {
  const caps = capabilitiesOf(profile);
  return ORDER.filter((kind) => caps[RECORD_REQUIRES[kind]] === 'yes');
}

export function canRecord(profile: CapabilityInput, kind: EnergyRecordKind): boolean {
  return energyRecordKinds(profile).includes(kind);
}

const LIQUID_FUEL_LABEL: Partial<Record<EnergySource, string>> = {
  gasoline: 'Gasolina',
  cng_gasoline: 'Gasolina',
  hybrid_gasoline: 'Gasolina',
  phev_gasoline: 'Gasolina',
  diesel: 'Diésel',
  hybrid_diesel: 'Diésel',
  phev_diesel: 'Diésel',
};

/** Nombre del combustible líquido según la energía del vehículo (para títulos del historial). */
export function liquidFuelLabel(energySource: EnergySource | undefined): string {
  return (energySource && LIQUID_FUEL_LABEL[energySource]) ?? 'Combustible';
}
