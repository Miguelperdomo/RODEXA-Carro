import { launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import { Linking } from 'react-native';
import { appAlert } from '@/shared/ui/AppDialog';
import { safePick } from '@/shared/utils/safePick';

/**
 * Tomar o elegir UNA foto. La cámara pide permiso solo en el momento de usarla (y si se negó
 * para siempre, se explica cómo activarlo). La galería usa el selector del sistema: no pide
 * permiso. Devuelve la ruta temporal de la foto, o null si se canceló.
 */
type PickOptions = { square?: boolean; quality?: number };

const toOptions = ({ square = false, quality = 0.7 }: PickOptions) => ({
  mediaTypes: ['images' as const],
  allowsEditing: square,
  ...(square ? { aspect: [1, 1] as [number, number] } : {}),
  quality,
});

export async function takePhoto(reason: string, options: PickOptions = {}): Promise<string | null> {
  const permission = await safePick(() => requestCameraPermissionsAsync(), 'la cámara');
  if (!permission) return null;
  if (!permission.granted) {
    if (!permission.canAskAgain) {
      appAlert('Permiso de cámara desactivado', `${reason} Activa el permiso de cámara de RODEXA en los ajustes del celular.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir ajustes', onPress: () => void Linking.openSettings().catch(() => undefined) },
      ]);
    }
    return null;
  }
  // Cámara ocupada, bloqueada o sin app de cámara: se avisa en vez de quedarse sin hacer nada.
  const result = await safePick(() => launchCameraAsync(toOptions(options)), 'la cámara');
  return result && !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}

export async function pickFromGallery(options: PickOptions = {}): Promise<string | null> {
  const result = await safePick(() => launchImageLibraryAsync(toOptions(options)), 'la galería');
  return result && !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}
