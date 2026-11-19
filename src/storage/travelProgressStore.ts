import type { TravelChecklistState } from '@/features/travel/types';

import { isObject, unwrap, wrap } from './envelope';
import { keyValueStore } from './keyValueStore';
import { createWriteQueue } from './writeQueue';

/**
 * Progreso TEMPORAL de "Voy a viajar": los puntos marcados mientras la revisión
 * está en curso. Clave propia (no toca los datos del carro) y se borra al
 * terminar la revisión. No es un registro del Historial.
 */
const KEY = 'rodexa:travel-progress';

const queue = createWriteQueue((value) => keyValueStore.set(KEY, value));

export async function loadTravelProgress(): Promise<TravelChecklistState> {
  try {
    const raw = await keyValueStore.get(KEY);
    if (raw === null) return {};
    const unwrapped = unwrap(raw);
    if (!unwrapped.ok || !isObject(unwrapped.data)) return {};
    // Solo marcas válidas (id → true/false).
    return Object.fromEntries(
      Object.entries(unwrapped.data).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'),
    );
  } catch {
    return {};
  }
}

export function saveTravelProgress(state: TravelChecklistState): Promise<boolean> {
  return queue.enqueue(wrap(state));
}

export async function clearTravelProgress(): Promise<void> {
  await queue.flush();
  try {
    await keyValueStore.remove(KEY);
  } catch {
    // Si no se pudo borrar, la próxima revisión simplemente empieza con esas marcas.
  }
}
