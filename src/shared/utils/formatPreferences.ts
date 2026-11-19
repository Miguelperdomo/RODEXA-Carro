/**
 * Preferencias de formato globales (distancia y fecha). Las fija SettingsProvider
 * en cada render, así todas las funciones de formato usan el mismo criterio
 * sin que cada pantalla tenga que pasarlo.
 */
export type FormatPreferences = {
  distanceUnit: 'km' | 'mi';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
};

let current: FormatPreferences = { distanceUnit: 'km', dateFormat: 'DD/MM/YYYY' };

export function getFormatPreferences(): FormatPreferences {
  return current;
}

export function setFormatPreferences(preferences: FormatPreferences): void {
  current = preferences;
}
