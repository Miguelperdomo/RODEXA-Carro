import { sanitizeParking, type ParkingSpot } from '@/features/parking/parking';

import { unwrap, wrap } from './envelope';
import { keyValueStore } from './keyValueStore';
import { createWriteQueue } from './writeQueue';

/**
 * Dónde quedó parqueado el carro ("¿Dónde lo parqueé?"). Clave propia: no toca los datos del
 * carro ni viaja en la copia (es de un momento). Se borra con "Ya lo recogí" y con "Eliminar
 * todos los datos". Solo se guarda en el teléfono.
 */
const KEY = 'rodexa:parking';

const queue = createWriteQueue((value) => keyValueStore.set(KEY, value));

export async function loadParking(): Promise<ParkingSpot | null> {
  try {
    const raw = await keyValueStore.get(KEY);
    if (raw === null) return null;
    const unwrapped = unwrap(raw);
    return unwrapped.ok ? sanitizeParking(unwrapped.data) : null;
  } catch {
    return null;
  }
}

/** `null` = ya lo recogió (no hay nada guardado). */
export function saveParking(spot: ParkingSpot | null): Promise<boolean> {
  return spot ? queue.enqueue(wrap(spot)) : clearParking().then(() => true);
}

export async function clearParking(): Promise<void> {
  await queue.flush();
  try {
    await keyValueStore.remove(KEY);
  } catch {
    // Si no se pudo borrar, solo queda el último lugar (sin datos del carro).
  }
}
