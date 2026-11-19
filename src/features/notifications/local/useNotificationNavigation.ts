import { router, useRootNavigationState, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import * as Notifications from './expoNotifications';

/** Solo rutas internas de RODEXA ("/registrar/…"); cualquier otra cosa se ignora. */
function urlFrom(response: Notifications.NotificationResponse | null): string | null {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') ? url : null;
}

/**
 * Al tocar una notificación de RODEXA, abre su pantalla (SOAT → documento SOAT,
 * kilometraje → registrar kilometraje, etc.). Funciona con la app abierta, en
 * segundo plano o cerrada: espera a que la navegación y el primer ingreso estén listos.
 */
export function useNotificationNavigation(enabled: boolean) {
  const navigationReady = !!useRootNavigationState()?.key;
  const [pending, setPending] = useState<{ id: string; url: string } | null>(null);
  // Evita abrir dos veces la misma notificación (p. ej. al volver a montar).
  const handled = useRef<string | null>(null);
  // Última notificación ya abierta (la pendiente se queda guardada, pero no se repite).
  const opened = useRef<string | null>(null);

  useEffect(() => {
    const take = (response: Notifications.NotificationResponse | null) => {
      const url = urlFrom(response);
      const id = response?.notification.request.identifier ?? null;
      if (!url || !id || handled.current === id) return;
      handled.current = id;
      setPending({ id, url });
    };
    // App abierta por una notificación (estaba cerrada).
    Notifications.getLastNotificationResponseAsync().then(take).catch(() => {});
    // Toque con la app abierta o en segundo plano.
    let subscription: { remove: () => void } | undefined;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(take);
    } catch {
      // Sin módulo de notificaciones: no hay nada que abrir.
    }
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (!pending || !navigationReady || !enabled || opened.current === pending.id) return;
    opened.current = pending.id;
    router.push(pending.url as Href);
  }, [pending, navigationReady, enabled]);
}
