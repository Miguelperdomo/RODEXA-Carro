import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useSyncExternalStore } from 'react';

import { clearParking, loadParking, saveParking } from '@/storage/parkingStore';

import type { ParkingInput, ParkingSpot } from './parking';

/**
 * Un solo lugar guardado, compartido por Mi carro y la pantalla "¿Dónde lo parqueé?": cuando
 * uno lo cambia, todos lo ven al instante. Se lee del celular la primera vez que se pide.
 */
let current: ParkingSpot | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit(next: ParkingSpot | null) {
  current = next;
  listeners.forEach((l) => l());
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  void loadParking().then((spot) => {
    // Si mientras tanto ya se guardó algo nuevo, eso manda.
    if (current === null) emit(spot);
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// ——— Foto del lugar (opcional): una sola, en la carpeta privada de RODEXA ———
const FOLDER = 'parqueadero';

function deletePhotos() {
  try {
    const dir = new Directory(Paths.document, FOLDER);
    if (dir.exists) dir.delete();
  } catch {
    // Sin carpeta: no hay nada que borrar.
  }
}

async function keepPhoto(sourceUri: string): Promise<string> {
  deletePhotos();
  const dir = new Directory(Paths.document, FOLDER);
  dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `parqueadero-${Date.now()}.jpg`);
  await new File(sourceUri).copy(dest);
  return dest.uri;
}

/** La foto guardada, solo si es de la carpeta de RODEXA y sigue existiendo. */
export function validParkingPhoto(uri: string | undefined): string | undefined {
  if (!uri) return undefined;
  try {
    if (!uri.startsWith(new Directory(Paths.document, FOLDER).uri)) return undefined;
    return new File(uri).exists ? uri : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Guarda dónde quedó el carro (reemplaza el anterior). `photo`: una foto recién tomada (se
 * copia a la carpeta de RODEXA), `null` para quitarla, `undefined` para dejar la que había.
 */
export async function parkHere(input: Omit<ParkingInput, 'photoUri'>, photo?: string | null): Promise<boolean> {
  let photoUri = current?.photoUri;
  if (photo === null) {
    deletePhotos();
    photoUri = undefined;
  } else if (photo) {
    photoUri = await keepPhoto(photo);
  }
  const next: ParkingSpot = { ...input, at: new Date().toISOString(), ...(photoUri ? { photoUri } : {}) };
  emit(next);
  return saveParking(next);
}

/** "Ya lo recogí": se borra el lugar (y su foto). */
export async function pickedUp(): Promise<void> {
  emit(null);
  deletePhotos();
  await clearParking();
}

/** "Eliminar todos los datos": también se olvida el parqueadero. */
export const forgetParking = pickedUp;

/** El lugar guardado (null = no hay). */
export function useParking(): ParkingSpot | null {
  useEffect(ensureLoaded, []);
  return useSyncExternalStore(subscribe, () => current);
}
