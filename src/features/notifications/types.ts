import type { Href } from 'expo-router';

import type { IconName } from '@/shared/ui';

export type NotificationCategory = 'maintenance' | 'documents' | 'odometer' | 'system';

/**
 * Notificación dentro de la app (mock). Se deduce de los datos actuales; no es
 * push. En la etapa de SQLite/Supabase la misma forma servirá para guardarlas.
 */
export type AppNotification = {
  /** Estable: la misma situación produce el mismo id (para recordar si se leyó). */
  id: string;
  category: NotificationCategory;
  icon: IconName;
  title: string;
  message: string;
  /** Fecha ISO de la situación que la originó. */
  date: string;
  /** A dónde lleva al tocarla (rutas existentes). */
  href?: Href;
};
