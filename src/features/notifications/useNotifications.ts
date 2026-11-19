import { useMemo } from 'react';

import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { today } from '@/shared/utils/date';

import { buildNotifications } from './build';
import type { AppNotification } from './types';

export type NotificationWithState = AppNotification & { read: boolean };

/** Notificaciones actuales + estado leído/no leído + contador de no leídas. */
export function useNotifications() {
  const data = useAppData();
  const { settings, readNotificationIds, markRead, markAllRead } = useSettings();

  const notifications = useMemo<NotificationWithState[]>(
    () =>
      buildNotifications(data, settings, today()).map((n) => ({
        ...n,
        read: readNotificationIds.includes(n.id),
      })),
    [data, settings, readNotificationIds],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead: () => markAllRead(notifications.map((n) => n.id)),
  };
}
