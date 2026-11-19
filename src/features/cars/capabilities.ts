import type { CarProfile, DrivetrainType, EnergySource, TimingSystem, TransmissionType } from './types';

/**
 * Capacidades del vehículo: qué sistemas tiene según lo que el usuario indicó.
 * Las pantallas y los catálogos (mantenimiento, viaje, repuestos) preguntan por
 * capacidades, nunca por "si es eléctrico / diésel / automático".
 *
 * Tres estados: "yes" / "no" / "unknown". Solo se afirma algo cuando se deduce
 * directamente de lo que eligió el usuario; lo que depende del modelo concreto
 * (AdBlue, refrigeración de un eléctrico…) queda "unknown" hasta tener una fuente.
 */
export type Tri = 'yes' | 'no' | 'unknown';

export const CAPABILITIES = [
  'combustion-engine',
  'spark-ignition-engine',
  'compression-ignition-engine',
  'electric-drive',
  'traction-battery',
  'external-charging',
  'battery-12v',
  'liquid-fuel',
  'cng',
  'engine-oil',
  'spark-plugs',
  'exhaust-system',
  'engine-coolant',
  'adblue',
  'timing-belt',
  'timing-chain',
  'manual-transmission',
  'automatic-transmission',
  'cvt',
  'dct',
  'transmission-fluid',
  'four-wheel-drive',
] as const;

export type CapabilityId = (typeof CAPABILITIES)[number];
export type Capabilities = Record<CapabilityId, Tri>;

type Partial3 = Partial<Record<CapabilityId, Tri>>;

/**
 * Lo que implica cada fuente de energía por definición (no por modelo), armado con
 * piezas para no repetir. AdBlue en diésel queda "unknown": depende del modelo.
 */
const SPARK_ENGINE: Partial3 = {
  'combustion-engine': 'yes',
  'spark-ignition-engine': 'yes',
  'compression-ignition-engine': 'no',
  adblue: 'no',
};
const DIESEL_ENGINE: Partial3 = {
  'combustion-engine': 'yes',
  'spark-ignition-engine': 'no',
  'compression-ignition-engine': 'yes',
};
const NO_ENGINE: Partial3 = {
  'combustion-engine': 'no',
  'spark-ignition-engine': 'no',
  'compression-ignition-engine': 'no',
  adblue: 'no',
};
const LIQUID_FUEL: Partial3 = { 'liquid-fuel': 'yes', cng: 'no' };
const NO_ELECTRIC: Partial3 = { 'electric-drive': 'no', 'traction-battery': 'no', 'external-charging': 'no' };
/** Híbrido convencional: batería de tracción que se recarga sola (no se enchufa). */
const SELF_CHARGING_HYBRID: Partial3 = { 'electric-drive': 'yes', 'traction-battery': 'yes', 'external-charging': 'no' };
/** Eléctrico o híbrido enchufable: se carga desde la red. */
const PLUG_IN: Partial3 = { 'electric-drive': 'yes', 'traction-battery': 'yes', 'external-charging': 'yes' };

const BY_ENERGY: Record<EnergySource, Partial3> = {
  gasoline: { ...SPARK_ENGINE, ...LIQUID_FUEL, ...NO_ELECTRIC },
  diesel: { ...DIESEL_ENGINE, ...LIQUID_FUEL, ...NO_ELECTRIC },
  // GNC: puede ser una conversión que también usa gasolina, pero no se asume → líquido "unknown".
  cng: { ...SPARK_ENGINE, cng: 'yes', ...NO_ELECTRIC },
  // GNC + gasolina (dual), confirmado por el usuario: usa ambos.
  cng_gasoline: { ...SPARK_ENGINE, cng: 'yes', 'liquid-fuel': 'yes', ...NO_ELECTRIC },
  electric: { ...NO_ENGINE, 'liquid-fuel': 'no', cng: 'no', ...PLUG_IN },
  hybrid_gasoline: { ...SPARK_ENGINE, ...LIQUID_FUEL, ...SELF_CHARGING_HYBRID },
  hybrid_diesel: { ...DIESEL_ENGINE, ...LIQUID_FUEL, ...SELF_CHARGING_HYBRID },
  phev_gasoline: { ...SPARK_ENGINE, ...LIQUID_FUEL, ...PLUG_IN },
  phev_diesel: { ...DIESEL_ENGINE, ...LIQUID_FUEL, ...PLUG_IN },
  other: {},
  unknown: {},
};

const BY_TRANSMISSION: Record<TransmissionType, Partial3> = {
  manual: { 'manual-transmission': 'yes', 'automatic-transmission': 'no', cvt: 'no', dct: 'no', 'transmission-fluid': 'yes' },
  automatic: { 'manual-transmission': 'no', 'automatic-transmission': 'yes', cvt: 'no', dct: 'no', 'transmission-fluid': 'yes' },
  cvt: { 'manual-transmission': 'no', 'automatic-transmission': 'no', cvt: 'yes', dct: 'no', 'transmission-fluid': 'yes' },
  dct: { 'manual-transmission': 'no', 'automatic-transmission': 'no', cvt: 'no', dct: 'yes', 'transmission-fluid': 'yes' },
  other: { 'manual-transmission': 'no', 'automatic-transmission': 'no', cvt: 'no', dct: 'no' },
  unknown: {},
};

const BY_DRIVETRAIN: Record<DrivetrainType, Partial3> = {
  '4x2': { 'four-wheel-drive': 'no' },
  '4x4': { 'four-wheel-drive': 'yes' },
  awd: { 'four-wheel-drive': 'yes' },
  other: {},
  unknown: {},
};

const BY_TIMING: Record<TimingSystem, Partial3> = {
  belt: { 'timing-belt': 'yes', 'timing-chain': 'no' },
  chain: { 'timing-belt': 'no', 'timing-chain': 'yes' },
  other: { 'timing-belt': 'no', 'timing-chain': 'no' },
  unknown: {},
};

/** Todo lo que depende del motor de combustión. Sin motor de combustión, no existe. */
const COMBUSTION_ONLY: CapabilityId[] = ['engine-oil', 'exhaust-system', 'timing-belt', 'timing-chain'];
/** Sin motor de combustión no hay caja manual/automática/CVT/DCT (los eléctricos usan reductor). */
const GEARBOX: CapabilityId[] = ['manual-transmission', 'automatic-transmission', 'cvt', 'dct'];

export type CapabilityInput = Pick<
  CarProfile,
  'energySource' | 'transmission' | 'drivetrain' | 'timingSystem' | 'coolingApplies' | 'coolingSource'
>;

/** Capacidades a partir del perfil. Función pura: mismo perfil → mismas capacidades. */
export function capabilitiesOf(profile: CapabilityInput): Capabilities {
  const caps = Object.fromEntries(CAPABILITIES.map((id) => [id, 'unknown'])) as Capabilities;
  const set = (values: Partial3) => Object.assign(caps, values);

  set(BY_ENERGY[profile.energySource ?? 'unknown']);
  set(BY_TRANSMISSION[profile.transmission ?? 'unknown']);
  set(BY_DRIVETRAIN[profile.drivetrain ?? 'unknown']);
  set(BY_TIMING[profile.timingSystem ?? 'unknown']);

  const combustion = caps['combustion-engine'];
  // Derivadas del motor de combustión (no dependen del modelo).
  caps['engine-oil'] = combustion;
  caps['exhaust-system'] = combustion;
  caps['spark-plugs'] = caps['spark-ignition-engine'];
  // Todo motor de combustión tiene batería de arranque de 12 V; en los eléctricos depende del modelo.
  caps['battery-12v'] = combustion === 'yes' ? 'yes' : 'unknown';
  // Refrigerante: en motores de combustión modernos, sí. En eléctricos depende del modelo.
  caps['engine-coolant'] = combustion === 'yes' ? 'yes' : 'unknown';

  if (combustion === 'no') {
    for (const id of COMBUSTION_ONLY) caps[id] = 'no';
    // Un eléctrico no tiene caja salvo que el usuario haya indicado una.
    if (!profile.transmission || profile.transmission === 'unknown') {
      for (const id of GEARBOX) caps[id] = 'no';
    }
  }

  // Si el usuario dijo antes que su carro NO tiene radiador, se respeta.
  if (profile.coolingSource === 'user' && profile.coolingApplies === false) {
    caps['engine-coolant'] = 'no';
  }

  return caps;
}

/**
 * ¿Aplica algo que requiere estas capacidades?
 * "no" si alguna es "no"; "yes" si todas son "yes"; si no, "unknown".
 */
export function requirementStatus(caps: Capabilities, requires: readonly CapabilityId[]): Tri {
  if (requires.some((id) => caps[id] === 'no')) return 'no';
  if (requires.every((id) => caps[id] === 'yes')) return 'yes';
  return 'unknown';
}

/**
 * Regla única de visibilidad: se oculta SOLO lo que está confirmado que no aplica.
 * Lo desconocido se muestra (mejor sobrar que esconder algo que sí tiene el carro).
 */
export function isApplicable(caps: Capabilities, requires: readonly CapabilityId[]): boolean {
  return requirementStatus(caps, requires) !== 'no';
}

/** ¿Falta confirmar el combustible? (dato base de casi todas las reglas). "Otro" es una respuesta. */
export function needsEnergyConfirmation(profile: Pick<CarProfile, 'energySource'>): boolean {
  return !profile.energySource || profile.energySource === 'unknown';
}
