import type { PartCategory } from '../types';

/**
 * Categorías de "Repuestos para mi carro". Para agregar una categoría basta con
 * sumarla aquí (con sus tipos de repuesto); la pantalla no cambia.
 */
export const PART_CATEGORIES: PartCategory[] = [
  {
    id: 'engine',
    label: 'Motor y transmisión',
    icon: 'oil',
    order: 1,
    partTypes: ['oil', 'oil_filter', 'air_filter', 'cabin_filter', 'fuel_filter', 'spark_plug', 'clutch'],
  },
  {
    id: 'brakes',
    label: 'Frenos',
    icon: 'brakes',
    order: 2,
    partTypes: ['brake_pads_front', 'brake_pads_rear', 'brake_shoes', 'brake_disc_front', 'brake_disc_rear', 'brake_fluid'],
  },
  { id: 'tires', label: 'Llantas', icon: 'tire', order: 3, partTypes: ['tire_front', 'tire_rear'] },
  { id: 'electrical', label: 'Sistema eléctrico', icon: 'electric', order: 4, partTypes: ['battery', 'headlight_bulb', 'fuses', 'wipers'] },
  { id: 'drive', label: 'Distribución y correas', icon: 'belt', order: 5, partTypes: ['timing_belt', 'accessory_belt'] },
  {
    id: 'other',
    label: 'Otros',
    icon: 'more',
    order: 6,
    partTypes: ['coolant', 'wheel_bearings', 'front_suspension', 'rear_shock'],
  },
];
