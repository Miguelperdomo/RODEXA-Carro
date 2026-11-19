import { Linking, Share } from 'react-native';

import { BRAND } from '@/config/brand';

/**
 * Compartir y recomendar RODEXA Carro. Solo abre las apps del teléfono (menú de
 * compartir o WhatsApp) con un mensaje listo: el usuario decide si lo envía.
 * No se guarda ni se envía nada desde RODEXA.
 */
export const SHARE_MESSAGE =
  'Estoy usando RODEXA Carro para llevar el control y el cuidado de mi carro. Te la recomiendo.';

export const RECOMMEND_MESSAGE =
  'Te recomiendo RODEXA Carro 🚗 Te ayuda a llevar el control del kilometraje, los mantenimientos, los documentos y los gastos de tu carro.';

/** El enlace de Google Play se agrega solo cuando exista (hoy todavía no). */
export function withStoreLink(message: string, storeUrl = BRAND.playStoreUrl): string {
  return storeUrl ? `${message}\n${storeUrl}` : message;
}

/** Menú nativo de compartir de Android (WhatsApp, Telegram, correo…). */
export async function shareApp(): Promise<void> {
  try {
    await Share.share({ message: withStoreLink(SHARE_MESSAGE) });
  } catch {
    // Si el usuario cierra el menú o el sistema no responde, no pasa nada.
  }
}

/** Abre WhatsApp con la recomendación lista; sin WhatsApp, usa el menú de compartir. */
export async function recommendApp(): Promise<void> {
  const message = withStoreLink(RECOMMEND_MESSAGE);
  try {
    await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
  } catch {
    try {
      await Share.share({ message });
    } catch {
      // Sin forma de compartir: no se muestra ningún error técnico.
    }
  }
}
