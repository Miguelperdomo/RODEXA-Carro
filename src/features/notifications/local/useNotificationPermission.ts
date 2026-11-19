import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import * as Notifications from './expoNotifications';

export type PermissionState = {
  /** 'undetermined' = el usuario aún no ha decidido. */
  status: 'granted' | 'denied' | 'undetermined' | 'loading';
  canAskAgain: boolean;
};

// Un solo estado compartido: la sincronización y Configuración ven lo mismo.
let current: PermissionState = { status: 'loading', canAskAgain: false };
const listeners = new Set<(state: PermissionState) => void>();

function publish(result: Notifications.NotificationPermissionsStatus) {
  current = { status: result.granted ? 'granted' : result.status, canAskAgain: result.canAskAgain ?? false };
  listeners.forEach((listener) => listener(current));
}

async function refreshPermission() {
  try {
    publish(await Notifications.getPermissionsAsync());
  } catch {
    // Si el sistema no responde, se conserva el último estado conocido.
  }
}

/** Muestra la solicitud NATIVA de Android. Si ya no se puede preguntar, abre los ajustes del sistema. */
async function requestPermission() {
  if (current.status === 'denied' && !current.canAskAgain) {
    // Si el celular no deja abrir sus ajustes, no pasa nada (la app sigue normal).
    await Linking.openSettings().catch(() => undefined);
    return;
  }
  try {
    publish(await Notifications.requestPermissionsAsync());
  } catch {
    await refreshPermission();
  }
}

/**
 * Estado REAL del permiso de notificaciones del sistema. Se vuelve a leer al
 * regresar a la app (el usuario pudo cambiarlo en los ajustes de Android).
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>(current);

  useEffect(() => {
    listeners.add(setPermission);
    refreshPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermission();
    });
    return () => {
      listeners.delete(setPermission);
      sub.remove();
    };
  }, []);

  const request = useCallback(() => requestPermission(), []);
  return { permission, request };
}
