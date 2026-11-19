import { getFormatPreferences } from './formatPreferences';

/**
 * Formatos colombianos: punto como separador de miles.
 * Se hace a mano para no depender del soporte de Intl en cada Android.
 */
export function formatThousands(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const KM_TO_MILES = 0.621371;

/**
 * Distancia según la preferencia global. Los datos siempre se guardan en km;
 * solo cambia cómo se muestran. 53240 → "53.240 km" · "33.081 mi".
 */
export function formatKm(km: number): string {
  if (getFormatPreferences().distanceUnit === 'mi') {
    return `${formatThousands(km * KM_TO_MILES)} mi`;
  }
  return `${formatThousands(km)} km`;
}

/** Unidad de distancia elegida para MOSTRAR (los datos siempre se guardan y escriben en km). */
export function distanceUnit(): 'km' | 'mi' {
  return getFormatPreferences().distanceUnit === 'mi' ? 'mi' : 'km';
}

/** "Costo por km" · "Costo por mi". */
export function costPerDistanceLabel(): string {
  return `Costo por ${distanceUnit()}`;
}

/** "Km recorridos" · "Millas recorridas". */
export function traveledLabel(): string {
  return distanceUnit() === 'mi' ? 'Millas recorridas' : 'Km recorridos';
}

/** Costo por km → por la unidad elegida: "~$350" (por km) · "~$563" (por milla). */
export function formatCostPerKm(copPerKm: number): string {
  return `~${formatCop(distanceUnit() === 'mi' ? copPerKm / KM_TO_MILES : copPerKm)}`;
}

/** Decimal con coma colombiana: 4.4 → "4,4", 40.25 → "40,3" (máx. `decimals`). */
export function formatDecimal(value: number, decimals = 1): string {
  return String(Number(value.toFixed(decimals))).replace('.', ',');
}

/** Litros (unidad base en Colombia): 4.4 → "4,4 L". */
export function formatLiters(liters: number): string {
  return `${formatDecimal(liters, 2)} L`;
}

/**
 * Consumo según la preferencia de distancia: "10,2 km/L" · "6,3 mi/L" · "5 km/kWh".
 * `unit` es la unidad de energía del consumo (L, m³ o kWh): nunca se mezclan.
 */
export function formatConsumption(kmPerUnit: number, unit: 'L' | 'gal' | 'm³' | 'kWh' = 'L'): string {
  if (getFormatPreferences().distanceUnit === 'mi') {
    return `${formatDecimal(kmPerUnit * KM_TO_MILES)} mi/${unit}`;
  }
  return `${formatDecimal(kmPerUnit)} km/${unit}`;
}

/** 384500 → "$384.500" */
export function formatCop(amount: number): string {
  return `$${formatThousands(amount)}`;
}

/** 8 → "hace 8 días", 2 → "antier", 1 → "ayer", 0 → "hoy" */
export function formatDaysAgo(days: number): string {
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days === 2) return 'antier';
  return `hace ${days} días`;
}
