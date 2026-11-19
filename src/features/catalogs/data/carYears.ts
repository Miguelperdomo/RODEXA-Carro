/**
 * Años disponibles por modelo (Marca → Modelo → Años).
 *
 * Todavía no tenemos años VERIFICADOS para ningún modelo, así que el mapa está
 * vacío y el repositorio usa un rango general marcado como "sin verificar".
 * Cuando haya datos confiables: { 'chevrolet-onix': [2026, 2025, …] }.
 */
export const MODEL_YEARS: Record<string, number[]> = {};

/** Rango general cuando el modelo no tiene años verificados. */
export const GENERIC_YEAR_SPAN = 30;

/** Opciones generales de cilindraje cuando el modelo no lo indica (cc). */
export const GENERIC_ENGINE_SIZES = [
  800, 1000, 1200, 1300, 1400, 1500, 1600, 1800, 2000, 2200, 2400, 2500, 2700, 3000, 3500, 4000,
  5000,
];
