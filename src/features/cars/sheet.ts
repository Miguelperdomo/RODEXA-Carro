import type { CarSheet } from '@/features/session/types';

import { capabilitiesOf, isApplicable, type CapabilityId, type CapabilityInput } from './capabilities';

export type SheetKey = keyof CarSheet;

export type SheetField = {
  key: SheetKey;
  label: string;
  placeholder: string;
  multiline?: boolean;
  uppercase?: boolean;
  /** Solo se ofrece si el vehículo puede tenerlo (misma regla de capacidades de A/B). */
  requires?: readonly CapabilityId[];
};

export type SheetGroup = { title: string; fields: SheetField[] };

/**
 * Datos que el usuario anota en la ficha (texto libre, en el celular). Los ejemplos
 * son solo guía de formato: RODEXA no los completa ni los valida.
 */
export const SHEET_GROUPS: SheetGroup[] = [
  {
    title: 'Mantenimiento',
    fields: [
      { key: 'oil', label: 'Aceite que usa', placeholder: 'Marca, tipo y viscosidad', requires: ['engine-oil'] },
      { key: 'sparkPlug', label: 'Bujías', placeholder: 'Referencia de las bujías', requires: ['spark-plugs'] },
      { key: 'battery', label: 'Batería de 12 V', placeholder: 'Referencia o tipo de batería', requires: ['battery-12v'] },
    ],
  },
  {
    title: 'Llantas',
    fields: [
      { key: 'tireFront', label: 'Medida llantas delanteras', placeholder: 'Como aparece en la llanta' },
      { key: 'tireRear', label: 'Medida llantas traseras', placeholder: 'Como aparece en la llanta' },
      { key: 'tirePressure', label: 'Presión recomendada', placeholder: 'Según el manual o el fabricante' },
    ],
  },
  {
    title: 'Identificación',
    fields: [
      { key: 'chassisNumber', label: 'Número de chasis (VIN)', placeholder: 'Como aparece en la licencia de tránsito', uppercase: true },
      { key: 'engineNumber', label: 'Número de motor', placeholder: 'Como aparece en la licencia de tránsito', uppercase: true },
      { key: 'policy', label: 'Póliza (nota)', placeholder: 'Aseguradora y número de póliza' },
    ],
  },
  {
    title: 'Notas',
    fields: [{ key: 'notes', label: 'Notas', placeholder: 'Cualquier dato que quieras tener a mano', multiline: true }],
  },
];

/**
 * Campos de la ficha para este vehículo: se ocultan solo los que se sabe que no aplican
 * (p. ej. aceite o bujías en un eléctrico). Si el usuario ya anotó algo, se muestra
 * siempre: nunca se esconden sus datos.
 */
export function sheetGroupsFor(profile: CapabilityInput, sheet: CarSheet): SheetGroup[] {
  const caps = capabilitiesOf(profile);
  return SHEET_GROUPS.map((group) => ({
    ...group,
    fields: group.fields.filter((f) => !!sheet[f.key]?.trim() || isApplicable(caps, f.requires ?? [])),
  })).filter((group) => group.fields.length > 0);
}
