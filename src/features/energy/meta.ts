import { liquidFuelLabel } from '@/features/cars/energy';
import type { EnergySource } from '@/features/cars/types';
import type { EnergyKind, EnergyRecord, FuelUnit } from '@/features/history/types';
import type { IconName } from '@/shared/ui';
import { formatDecimal } from '@/shared/utils/format';

/** Textos e íconos de cada tipo de registro de energía (una sola fuente para todas las pantallas). */
export type EnergyMeta = {
  icon: IconName;
  /** "Tanqueo", "Carga de GNC", "Carga eléctrica". */
  action: string;
  actionDescription: string;
  saved: string;
  /** Sección de estadísticas / filtro del historial. */
  section: string;
  quantityLabel: string;
  quantityHint: string;
  /** Pregunta de referencia para comparar registros (tanque lleno / carga completa). */
  fullLabel?: string;
  fullHint?: string;
  /** Con qué registro se compara para medir el consumo. */
  reference: string;
  /** Estado vacío: "Registra tu primer tanqueo". */
  emptyTitle: string;
};

export const ENERGY_META: Record<EnergyKind, EnergyMeta> = {
  fuel: {
    icon: 'fuel',
    action: 'Carga de combustible',
    actionDescription: 'Cantidad, valor y kilometraje',
    saved: 'Carga de combustible registrada',
    section: 'Combustible',
    quantityLabel: '¿Cuánto combustible cargaste?',
    quantityHint: 'Como aparece en el surtidor, en litros o galones.',
    fullLabel: '¿Tanque lleno?',
    fullHint: 'Con dos cargas de tanque lleno, RODEXA puede calcular el consumo.',
    reference: 'el tanque lleno anterior',
    emptyTitle: 'Registra tu primera carga de combustible',
  },
  cng: {
    icon: 'fuel',
    action: 'Carga de GNC',
    actionDescription: 'm³, valor y kilometraje',
    saved: 'Carga de GNC registrada',
    section: 'GNC',
    quantityLabel: '¿Cuántos m³ cargaste?',
    quantityHint: 'Como aparece en el surtidor de gas.',
    fullLabel: '¿Carga completa?',
    fullHint: 'Con dos cargas completas RODEXA puede calcular el consumo en km/m³.',
    reference: 'la carga completa anterior',
    emptyTitle: 'Registra tu primera carga de GNC',
  },
  charge: {
    icon: 'evSystem',
    action: 'Carga eléctrica',
    actionDescription: 'kWh, valor y kilometraje',
    saved: 'Carga eléctrica registrada',
    section: 'Electricidad',
    quantityLabel: '¿Cuántos kWh cargaste?',
    quantityHint: 'Los que marca el cargador o su app.',
    reference: 'la carga anterior que terminó en el mismo %',
    emptyTitle: 'Registra tu primera carga eléctrica',
  },
};

export const FUEL_UNIT_LABELS: Record<FuelUnit, { short: string; long: string; plural: string }> = {
  L: { short: 'L', long: 'litro', plural: 'Litros' },
  gal: { short: 'gal', long: 'galón', plural: 'Galones' },
};

/** Unidad en que se escribió la cantidad de un registro ("L", "gal", "m³", "kWh"). */
export function quantityUnit(record: Pick<EnergyRecord, 'kind'> & { unit?: FuelUnit }): string {
  if (record.kind === 'fuel') return FUEL_UNIT_LABELS[record.unit ?? 'L'].short;
  return record.kind === 'cng' ? 'm³' : 'kWh';
}

/** "35 L", "8,5 gal", "18 m³", "32,4 kWh" (la unidad del propio registro, nunca otra). */
export function formatQuantity(record: EnergyRecord): string {
  return `${formatDecimal(record.quantity, 2)} ${quantityUnit(record)}`;
}

/** Título de la fila del historial: "Gasolina", "Diésel", "GNC", "Electricidad". */
export function energyTitle(kind: EnergyKind, energySource?: EnergySource): string {
  return kind === 'fuel' ? liquidFuelLabel(energySource) : ENERGY_META[kind].section;
}
