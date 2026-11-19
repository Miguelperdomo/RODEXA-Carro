import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { Settings } from '@/features/settings/types';

import { buildReminderPlan } from './plan';
import { cancelAllReminders, setupNotifications, syncReminders } from './scheduler';
import { useNotificationNavigation } from './useNotificationNavigation';
import { useNotificationPermission } from './useNotificationPermission';
import { appAlert } from '@/shared/ui/AppDialog';

/** Preferencias que NO cambian ningún aviso (pantalla, fotos, datos de otras pantallas). */
const NOT_IN_PLAN: (keyof Settings)[] = [
  'theme',
  'largeText',
  'sunMode',
  'carPhotoUri',
  'lastBackupAt',
  'backupFolderUri',
  'backupFolderName',
  'transitFareCop',
  'transitTripsPerMonth',
  'familyAppsNotify',
  'proNotifyMe',
  'proLaunchSeen',
  'showEstimate',
  'showRecommendations',
  'showGettingStarted',
  'quickCallInviteDismissed',
  'styleSuggestionSnoozedUntil',
  'tranquiAskSnoozedUntil',
  'rainSeasonDismissed',
  'carOpenGroups',
  'roadKit',
  'historyFilter',
  'historyView',
  'statsTab',
];

/** Huella de las preferencias que sí afectan los avisos. */
export function reminderSettingsKey(settings: Settings): string {
  const relevant = Object.fromEntries(Object.entries(settings).filter(([key]) => !NOT_IN_PLAN.includes(key as keyof Settings)));
  return JSON.stringify(relevant);
}

export const ACTIVATE_TITLE = '¿Activamos los avisos?';
export const ACTIVATE_MESSAGE =
  'Te avisamos antes de que venza el SOAT o la tecnomecánica y cuando le toque el aceite a tu carro. Solo lo importante, sin publicidad.';

/**
 * Mantiene los recordatorios del teléfono al día con los datos del carro. No dibuja nada.
 * Al entrar a la app principal (después del primer ingreso), y solo si Android todavía
 * permite preguntar, primero explica para qué sirven los avisos y luego pide el permiso.
 */
export function LocalReminders() {
  const { onboardingDone, data, picoYPlaca, customReminders, recurringExpenses, fines } = useSession();
  const { settings } = useSettings();
  const { permission, request } = useNotificationPermission();
  // Se prepara una sola vez (canal de Android y cómo se ven con la app abierta).
  const [ready] = useState(() => setupNotifications());
  const asked = useRef(false);
  // Tocar una notificación abre su pantalla (solo con el primer ingreso hecho).
  useNotificationNavigation(onboardingDone);

  useEffect(() => {
    // Android no distingue "nunca preguntado" de "rechazado una vez" (ambos: denied +
    // canAskAgain). Se pregunta una vez por apertura mientras el sistema lo permita;
    // tras rechazos repetidos Android pone canAskAgain = false y no se vuelve a pedir.
    const canAsk =
      permission.status === 'undetermined' || (permission.status === 'denied' && permission.canAskAgain);
    if (!onboardingDone || !canAsk || asked.current) return;
    // Antes de la ventana de Android, RODEXA explica PARA QUÉ sirven los avisos. Se espera a
    // que pase la pantalla de carga.
    const timer = setTimeout(() => {
      // Se marca al MOSTRARLO: si el estado del permiso cambió mientras esperaba, se reprograma.
      asked.current = true;
      appAlert(
        ACTIVATE_TITLE,
        ACTIVATE_MESSAGE,
        [
          // "Ahora no": no se abre la ventana de Android (así no queda bloqueada para después).
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Sí, activar avisos',
            onPress: () =>
              void ready.then(request).catch(() => {
                // Si el sistema no puede mostrar la solicitud, la app sigue normal.
              }),
          },
        ],
        { cancelable: true },
      );
    }, 1800);
    return () => clearTimeout(timer);
  }, [onboardingDone, permission.status, permission.canAskAgain, ready, request]);

  // Solo las preferencias que cambian algún aviso: tocar el tema, la letra o el Modo sol NO
  // recalcula el plan (es pesado con mucho historial).
  const planKey = reminderSettingsKey(settings);
  const latestSettings = useRef(settings);
  useEffect(() => {
    latestSettings.current = settings;
  }, [settings]);

  useEffect(() => {
    if (permission.status !== 'granted') return;
    ready
      .then(() =>
        // Sin primer ingreso no hay datos reales del carro: no queda nada programado.
        onboardingDone
          ? syncReminders(
              buildReminderPlan(data, latestSettings.current, new Date(), picoYPlaca, customReminders, recurringExpenses, fines),
            )
          : cancelAllReminders(),
      )
      .catch(() => {
        // Un fallo al programar no debe afectar el uso de la app.
      });
  }, [permission.status, onboardingDone, data, planKey, ready, picoYPlaca, customReminders, recurringExpenses, fines]);

  return null;
}
