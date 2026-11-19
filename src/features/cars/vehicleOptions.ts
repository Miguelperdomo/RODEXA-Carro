import { es, type TranslationKey } from '@/i18n/es';

import { capabilitiesOf, requirementStatus, type CapabilityId } from './capabilities';
import type { BodyType, CarProfile, DrivetrainType, EnergySource, TimingSystem, TransmissionType } from './types';

export type VehicleOption<T extends string> = { value: T; label: string };

/** Opciones que ve el usuario. "unknown" siempre se muestra como "No sé". */
export const ENERGY_OPTIONS: VehicleOption<EnergySource>[] = [
  { value: 'gasoline', label: 'Gasolina' },
  { value: 'diesel', label: 'Diésel' },
  { value: 'cng', label: 'GNC (gas natural)' },
  { value: 'cng_gasoline', label: 'GNC + gasolina (dual)' },
  { value: 'electric', label: 'Eléctrico' },
  { value: 'hybrid_gasoline', label: 'Híbrido gasolina (no se enchufa)' },
  { value: 'hybrid_diesel', label: 'Híbrido diésel (no se enchufa)' },
  { value: 'phev_gasoline', label: 'Híbrido enchufable gasolina' },
  { value: 'phev_diesel', label: 'Híbrido enchufable diésel' },
  { value: 'other', label: 'Otro' },
  { value: 'unknown', label: 'No sé' },
];

export const TRANSMISSION_OPTIONS: VehicleOption<TransmissionType>[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automática' },
  { value: 'cvt', label: 'CVT' },
  { value: 'dct', label: 'Doble embrague (DCT)' },
  { value: 'other', label: 'Otra' },
  { value: 'unknown', label: 'No sé' },
];

export const DRIVETRAIN_OPTIONS: VehicleOption<DrivetrainType>[] = [
  { value: '4x2', label: '4x2' },
  { value: '4x4', label: '4x4' },
  { value: 'awd', label: 'AWD' },
  { value: 'other', label: 'Otra' },
  { value: 'unknown', label: 'No sé' },
];

export const TIMING_OPTIONS: VehicleOption<TimingSystem>[] = [
  { value: 'belt', label: 'Correa' },
  { value: 'chain', label: 'Cadena' },
  { value: 'other', label: 'Otro' },
  { value: 'unknown', label: 'No sé' },
];

export const BODY_OPTIONS: VehicleOption<BodyType>[] = [
  { value: 'sedan', label: 'Sedán' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'suv', label: 'SUV' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'van', label: 'Van' },
  { value: 'other', label: 'Otro' },
];

const labelIn = <T extends string>(options: VehicleOption<T>[], value: T | undefined) =>
  value === undefined ? undefined : options.find((o) => o.value === value)?.label;

/** El usuario eligió "No sé": se muestra como desconocido, nunca como un valor supuesto. */
export const UNKNOWN_LABEL = 'Desconocido';

/**
 * Textos para mostrar. Sin dato (nunca respondió) → undefined ("Sin registrar");
 * "No sé" → "Desconocido"; la energía sin confirmar → "Sin confirmar".
 */
export const vehicleLabels = {
  energy: (v?: EnergySource) => (!v || v === 'unknown' ? 'Sin confirmar' : labelIn(ENERGY_OPTIONS, v)),
  transmission: (v?: TransmissionType) => (v === 'unknown' ? UNKNOWN_LABEL : labelIn(TRANSMISSION_OPTIONS, v)),
  drivetrain: (v?: DrivetrainType) => (v === 'unknown' ? UNKNOWN_LABEL : labelIn(DRIVETRAIN_OPTIONS, v)),
  timing: (v?: TimingSystem) => (v === 'unknown' ? UNKNOWN_LABEL : labelIn(TIMING_OPTIONS, v)),
  body: (v?: BodyType) => labelIn(BODY_OPTIONS, v),
};

/**
 * Preguntas del perfil que dependen del vehículo, como datos: cada una declara
 * qué capacidades necesita. Una pregunta se muestra si puede aplicar ("yes" o
 * "unknown"); el cilindraje además es obligatorio cuando aplica con certeza.
 */
export type ProfileField =
  | 'displacementCc'
  | 'transmission'
  | 'timingSystem'
  | 'tankCapacityLiters'
  | 'batteryCapacityKwh';

const FIELD_REQUIRES: Record<ProfileField, CapabilityId[]> = {
  displacementCc: ['combustion-engine'],
  transmission: ['combustion-engine'],
  timingSystem: ['combustion-engine'],
  tankCapacityLiters: ['liquid-fuel'],
  // Solo eléctricos y enchufables: la batería de un híbrido convencional no se carga ni se mide.
  batteryCapacityKwh: ['external-charging'],
};

type EnergyOnly = Pick<CarProfile, 'energySource'>;

export function profileFieldApplies(field: ProfileField, profile: EnergyOnly): boolean {
  return requirementStatus(capabilitiesOf(profile), FIELD_REQUIRES[field]) !== 'no';
}

const decimal = (n: number) => String(n).replace('.', ',');

/** `labelKey` para pantallas traducidas (Configuración); `label` es el texto en español. */
export type VehicleInfoRow = { key: string; labelKey: TranslationKey; label: string; value: string | undefined };

/**
 * Filas de "Información del carro" (Mi carro, Configuración, resumen). Las que no
 * aplican a su fuente de energía no aparecen; las que aplican sin dato se muestran
 * vacías ("Sin registrar").
 */
export function vehicleInfoRows(profile: CarProfile): VehicleInfoRow[] {
  const show = (field: ProfileField) => profileFieldApplies(field, profile);
  const row = (key: string, labelKey: TranslationKey, value: string | undefined): VehicleInfoRow => ({
    key,
    labelKey,
    label: es[labelKey],
    value,
  });
  const rows: (VehicleInfoRow | false)[] = [
    row('brand', 'carro.brand', profile.brandName || undefined),
    row('model', 'carro.model', profile.model || undefined),
    row('variant', 'carro.variant', profile.variantName),
    row('year', 'carro.year', profile.year?.toString()),
    row('body', 'carro.body', vehicleLabels.body(profile.bodyType)),
    row('energy', 'carro.energy', vehicleLabels.energy(profile.energySource)),
    show('displacementCc') &&
      row('cc', 'carro.engine', profile.displacementCc ? `${profile.displacementCc} cc` : undefined),
    show('transmission') && row('transmission', 'carro.transmission', vehicleLabels.transmission(profile.transmission)),
    row('drivetrain', 'carro.drivetrain', vehicleLabels.drivetrain(profile.drivetrain)),
    show('timingSystem') && row('timing', 'carro.timing', vehicleLabels.timing(profile.timingSystem)),
    show('tankCapacityLiters') &&
      row('tank', 'carro.tank', profile.tankCapacityLiters ? `${decimal(profile.tankCapacityLiters)} L` : undefined),
    show('batteryCapacityKwh') &&
      row(
        'battery',
        'carro.battery',
        profile.batteryCapacityKwh ? `${decimal(profile.batteryCapacityKwh)} kWh` : undefined,
      ),
    row('plate', 'carro.plate', profile.plate),
  ];
  return rows.filter((r): r is VehicleInfoRow => r !== false);
}

/** Cilindraje obligatorio solo si el vehículo tiene motor de combustión con certeza. */
export function engineCcRequired(profile: EnergyOnly): boolean {
  return requirementStatus(capabilitiesOf(profile), FIELD_REQUIRES.displacementCc) === 'yes';
}
