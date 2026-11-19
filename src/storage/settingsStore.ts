import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import type { Settings } from '@/features/settings/types';

import { isObject, unwrap, wrap } from './envelope';
import { keyValueStore, STORAGE_KEYS } from './keyValueStore';
import { createWriteQueue } from './writeQueue';

export type StoredSettings = { settings: Settings; readNotificationIds: string[] };

export const DEFAULT_STORED_SETTINGS: StoredSettings = { settings: DEFAULT_SETTINGS, readNotificationIds: [] };

const queue = createWriteQueue((value) => keyValueStore.set(STORAGE_KEYS.settings, value));

/** Preferencias de texto con valores fijos: otro valor (dañado o de otra versión) se ignora. */
const ALLOWED_VALUES: Partial<Record<keyof Settings, readonly string[]>> = {
  // Solo español por ahora: una preferencia guardada en inglés vuelve a español.
  language: ['es'],
  usageStyle: ['tranqui', 'detail'],
  fuelTracking: ['none', 'monthly', 'each'],
};

/**
 * Preferencias guardadas encima de los valores por defecto: cada preferencia
 * conocida se toma solo si tiene el tipo correcto; las nuevas (de versiones
 * futuras) reciben su valor por defecto.
 */
export function sanitizeSettings(raw: unknown): StoredSettings {
  if (!isObject(raw)) return DEFAULT_STORED_SETTINGS;
  const stored = isObject(raw.settings) ? raw.settings : {};
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const allowed = ALLOWED_VALUES[key];
    if (allowed && !allowed.includes(stored[key] as string)) continue;
    if (typeof stored[key] === typeof DEFAULT_SETTINGS[key]) {
      (settings as Record<string, unknown>)[key] = stored[key];
    }
  }
  const ids = Array.isArray(raw.readNotificationIds)
    ? raw.readNotificationIds.filter((id): id is string => typeof id === 'string')
    : [];
  return { settings, readNotificationIds: ids };
}

export async function loadSettings(): Promise<StoredSettings> {
  try {
    const raw = await keyValueStore.get(STORAGE_KEYS.settings);
    if (raw === null) return DEFAULT_STORED_SETTINGS;
    const unwrapped = unwrap(raw);
    if (!unwrapped.ok) {
      console.warn(`[RODEXA] Preferencias ilegibles (${unwrapped.reason}). Se conserva una copia.`);
      await keyValueStore.set(STORAGE_KEYS.backup(STORAGE_KEYS.settings), raw).catch(() => {});
      return DEFAULT_STORED_SETTINGS;
    }
    return sanitizeSettings(unwrapped.data);
  } catch (error) {
    console.warn('[RODEXA] No se pudieron leer las preferencias.', error);
    return DEFAULT_STORED_SETTINGS;
  }
}

/** `true` cuando quedó guardado en el teléfono. */
export function saveSettings(value: StoredSettings): Promise<boolean> {
  return queue.enqueue(wrap(value));
}

export async function clearSettings(): Promise<void> {
  await queue.flush();
  await keyValueStore.remove(STORAGE_KEYS.settings);
}

export const flushSettings = () => queue.flush();
