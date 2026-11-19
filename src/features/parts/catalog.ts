import type { ComponentCode, MaintenanceItemCode } from '@/features/maintenance/catalog';
import type { IconName } from '@/shared/ui';


/**
 * Repuestos de RODEXA Carro — solo diseño (docs/modulo-repuestos.md).
 * Aquí se definen QUÉ campos tendría la especificación de cada repuesto,
 * nunca sus valores: esos vendrán de fuentes verificadas en el futuro.
 */
export type PartDefinition = {
  code: MaintenanceItemCode;
  /** Campos que mostrará la especificación compatible (sin valores). */
  specFields: string[];
  /** Frenos y llantas: aviso reforzado de verificar con el mecánico. */
  safetyCritical?: boolean;
};

export const PARTS: PartDefinition[] = [
  { code: 'oil', specFields: ['Tipo de aceite', 'Viscosidad', 'Norma', 'Cantidad'] },
  { code: 'oil_filter', specFields: ['Referencia', 'Tipo'] },
  { code: 'air_filter', specFields: ['Referencia', 'Tipo'] },
  { code: 'fuel_filter', specFields: ['Referencia'] },
  { code: 'cabin_filter', specFields: ['Referencia', 'Tipo'] },
  { code: 'spark_plug', specFields: ['Referencia', 'Grado térmico', 'Calibración'] },
  { code: 'timing_belt', specFields: ['Referencia', 'Número de dientes', 'Ancho', 'Incluye tensor'] },
  { code: 'accessory_belt', specFields: ['Referencia', 'Número de canales', 'Longitud'] },
  { code: 'clutch', specFields: ['Referencia del kit', 'Diámetro del disco'] },
  { code: 'brake_pads_front', specFields: ['Referencia', 'Compuesto'], safetyCritical: true },
  { code: 'brake_pads_rear', specFields: ['Referencia', 'Compuesto'], safetyCritical: true },
  { code: 'brake_shoes', specFields: ['Referencia', 'Medida'], safetyCritical: true },
  { code: 'brake_disc_front', specFields: ['Diámetro', 'Espesor mínimo'], safetyCritical: true },
  { code: 'brake_disc_rear', specFields: ['Diámetro', 'Espesor mínimo'], safetyCritical: true },
  { code: 'brake_fluid', specFields: ['Tipo'], safetyCritical: true },
  { code: 'tire_front', specFields: ['Medida', 'Índice de carga', 'Tipo'], safetyCritical: true },
  { code: 'tire_rear', specFields: ['Medida', 'Índice de carga', 'Tipo'], safetyCritical: true },
  { code: 'wheel_bearings', specFields: ['Referencia'] },
  { code: 'front_suspension', specFields: ['Referencia', 'Tipo'] },
  { code: 'rear_shock', specFields: ['Referencia', 'Tipo'] },
  { code: 'battery', specFields: ['Voltaje', 'Capacidad', 'Tipo'] },
  { code: 'headlight_bulb', specFields: ['Tipo de bombillo', 'Potencia'] },
  { code: 'fuses', specFields: ['Amperaje'] },
  { code: 'wipers', specFields: ['Longitud conductor', 'Longitud pasajero', 'Tipo de anclaje'] },
  { code: 'coolant', specFields: ['Tipo'] },
];

export function findPart(code: string): PartDefinition | undefined {
  return PARTS.find((part) => part.code === code);
}

/** Repuestos relacionados con cada componente controlado de "Mi carro". */
export const PARTS_FOR_COMPONENT: Partial<Record<ComponentCode, MaintenanceItemCode[]>> = {
  oil: ['oil', 'oil_filter'],
  brake_check: ['brake_pads_front', 'brake_pads_rear', 'brake_shoes', 'brake_fluid'],
  tires: ['tire_front', 'tire_rear'],
  battery: ['battery'],
  // "Alineación y balanceo" y "Mantenimiento general" son servicios, no un repuesto: sin opciones.
};

export type PartTier = {
  key: 'budget' | 'balanced' | 'original';
  label: string;
  icon: IconName;
  /** Criterio visible de por qué una opción cae en esta categoría. */
  criterion: string;
};

/** Criterios provisionales (docs/modulo-repuestos.md §5); nunca "el mejor". */
export const PART_TIERS: PartTier[] = [
  {
    key: 'budget',
    label: 'Económica',
    icon: 'tierBudget',
    criterion: 'Menor precio entre las opciones compatibles verificadas.',
  },
  {
    key: 'balanced',
    label: 'Calidad/precio',
    icon: 'tierBalanced',
    criterion: 'Marca reconocida con precio en el rango medio.',
  },
  {
    key: 'original',
    label: 'Original',
    icon: 'premium',
    criterion: 'Referencia original del fabricante del carro.',
  },
];
