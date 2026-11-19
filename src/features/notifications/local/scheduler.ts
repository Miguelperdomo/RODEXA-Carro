import { Platform } from 'react-native';

import * as Notifications from './expoNotifications';
import type { PlannedReminder } from './types';

/** Canal de Android para los recordatorios del carro. */
export const REMINDER_CHANNEL_ID = 'recordatorios';
/** Prefijo de los recordatorios de RODEXA: solo estos se cancelan al reprogramar. */
const REMINDER_PREFIX = 'rx-';

/** ¿Se pudo crear el canal propio? En Expo Go para Android no existe el gestor de canales. */
let channelReady = false;

/** Canal para el trigger: el propio si existe; si no, Android usa el canal por defecto. */
export function reminderChannel(): { channelId?: string } {
  return channelReady ? { channelId: REMINDER_CHANNEL_ID } : {};
}

/**
 * Configuración única al abrir la app: cómo se muestran con la app abierta y el
 * canal de Android (debe existir ANTES de pedir el permiso en Android 13+).
 * Nunca falla: si algo no está disponible (p. ej. en Expo Go), la app sigue normal.
 */
export async function setupNotifications(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Sin handler solo cambia cómo se ven con la app abierta.
  }
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Recordatorios de tu carro',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#1E4FD8',
      });
      channelReady = true;
    } catch {
      channelReady = false;
    }
  }
}

/**
 * Huella del último plan enviado al teléfono. Evita reprogramar si nada cambió.
 * En memoria por ahora; con persistencia se guardará junto con el plan.
 */
let lastSyncedFingerprint: string | null = null;

function fingerprint(plan: PlannedReminder[]): string {
  return JSON.stringify(plan.map((r) => [r.id, r.fireAt.getTime(), r.body, r.href]));
}

/**
 * Deja en el teléfono exactamente los recordatorios del plan: cancela los de
 * RODEXA que ya no aplican (p. ej. el SOAT anterior o un aviso de km que ya se
 * actualizó) y programa los nuevos. Ids estables → nunca hay duplicados.
 */
let pendingPlan: PlannedReminder[] | null = null;
let draining: Promise<void> | null = null;

/**
 * Las sincronizaciones van EN FILA: si llegan dos seguidas, no se mezclan (antes podían
 * quedar programados avisos del plan anterior). Mientras una corre, solo se guarda el
 * plan más reciente y se aplica al terminar.
 */
export function syncReminders(plan: PlannedReminder[]): Promise<void> {
  pendingPlan = plan;
  if (!draining) {
    draining = (async () => {
      try {
        while (pendingPlan) {
          const next = pendingPlan;
          pendingPlan = null;
          await applyPlan(next);
        }
      } finally {
        draining = null;
      }
    })();
  }
  return draining;
}

async function applyPlan(plan: PlannedReminder[]): Promise<void> {
  const print = fingerprint(plan);
  if (print === lastSyncedFingerprint) return;

  await cancelScheduled();
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_PREFIX}${reminder.id}`,
      // `url`: pantalla que se abre al tocarla (ver LocalReminders).
      content: { title: reminder.title, body: reminder.body, data: { url: reminder.href } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        ...reminderChannel(),
      },
    });
  }
  lastSyncedFingerprint = print;
}

/** Cancela todos los recordatorios de RODEXA (en la misma fila que las sincronizaciones). */
export function cancelAllReminders(): Promise<void> {
  return syncReminders([]);
}

/** No toca otras notificaciones: solo las de RODEXA (prefijo propio). */
async function cancelScheduled(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  lastSyncedFingerprint = null;
}
