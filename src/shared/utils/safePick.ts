import { appAlert } from '@/shared/ui/AppDialog';

/**
 * Corre una acción de cámara, galería o archivos. Si el celular falla (cámara ocupada o
 * bloqueada, sin app de cámara, poco espacio…), avisa en vez de quedarse "sin hacer nada".
 * Devuelve lo que devuelva la acción, o `null` si falló.
 */
export async function safePick<T>(action: () => Promise<T>, what = 'la cámara'): Promise<T | null> {
  try {
    return await action();
  } catch {
    appAlert(`No se pudo abrir ${what}`, 'Intenta de nuevo. Si sigue pasando, cierra y abre RODEXA.');
    return null;
  }
}
