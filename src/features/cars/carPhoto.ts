import { Directory, File, Paths } from 'expo-file-system';

/**
 * Foto del carro (opcional): una sola, guardada SOLO en el celular, en la carpeta privada de
 * RODEXA (no en la galería). Sin foto, la app muestra el ícono de siempre.
 */
const FOLDER = 'carro';

function folder(): Directory {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Copia la foto elegida a la carpeta de RODEXA y borra la anterior (solo hay una). */
export async function keepCarPhoto(sourceUri: string): Promise<string> {
  const dir = folder();
  // Nombre único (aunque se guarden dos fotos en el mismo milisegundo).
  const dest = new File(dir, `carro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
  await new File(sourceUri).copy(dest);
  for (const item of dir.list()) {
    if (item instanceof File && item.uri !== dest.uri) {
      try {
        item.delete();
      } catch {
        // Si no se pudo borrar ahora, se borra con la próxima foto.
      }
    }
  }
  return dest.uri;
}

/**
 * La foto guardada, solo si es de la carpeta de RODEXA y sigue existiendo. Una ruta de otro
 * lado no vale: se muestra el ícono.
 */
export function validCarPhoto(uri: string): string | undefined {
  if (!uri) return undefined;
  try {
    const dir = new Directory(Paths.document, FOLDER);
    if (!uri.startsWith(dir.uri)) return undefined;
    return new File(uri).exists ? uri : undefined;
  } catch {
    return undefined;
  }
}

/** "Quitar foto" y "Eliminar todos los datos". */
export function deleteCarPhotos(): void {
  try {
    const dir = new Directory(Paths.document, FOLDER);
    if (dir.exists) dir.delete();
  } catch {
    // Sin carpeta: no hay nada que borrar.
  }
}
