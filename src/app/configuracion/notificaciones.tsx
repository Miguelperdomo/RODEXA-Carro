import { router } from 'expo-router';

import { useNotificationPermission } from '@/features/notifications/local/useNotificationPermission';
import { useNotifications } from '@/features/notifications/useNotifications';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { Settings } from '@/features/settings/types';
import { isTranqui, TRANQUI_MUTED } from '@/features/settings/usageStyle';
import { useT, type TranslationKey } from '@/i18n';
import { FormScreen, SettingsRow, SettingsSection, type IconName } from '@/shared/ui';

type ToggleKey = keyof Pick<
  Settings,
  | 'maintenanceReminders'
  | 'documentReminders'
  | 'odometerReminders'
  | 'fuelReminders'
  | 'activityReminders'
  | 'actionConfirmations'
  | 'importantNotifications'
  | 'creditReminders'
  | 'longWeekendReminders'
  | 'fineReminders'
>;

const TOGGLES: { key: ToggleKey; label: TranslationKey; icon: IconName }[] = [
  { key: 'maintenanceReminders', label: 'notif.prefs.maintenance', icon: 'maintenance' },
  { key: 'documentReminders', label: 'notif.prefs.documents', icon: 'document' },
  { key: 'odometerReminders', label: 'notif.prefs.odometer', icon: 'odometer' },
  { key: 'fuelReminders', label: 'notif.prefs.fuel', icon: 'fuel' },
  { key: 'activityReminders', label: 'notif.prefs.activity', icon: 'car' },
  { key: 'actionConfirmations', label: 'notif.prefs.confirmations', icon: 'check' },
  { key: 'importantNotifications', label: 'notif.prefs.important', icon: 'info' },
  { key: 'creditReminders', label: 'notif.prefs.credit', icon: 'loan' },
  { key: 'longWeekendReminders', label: 'notif.prefs.longWeekend', icon: 'travel' },
  { key: 'fineReminders', label: 'notif.prefs.fines', icon: 'fine' },
];

const PERMISSION_LABEL: Record<string, TranslationKey> = {
  granted: 'notif.permission.granted',
  denied: 'notif.permission.denied',
  undetermined: 'notif.permission.undetermined',
  loading: 'notif.permission.undetermined',
};

/** Preferencias de notificaciones + estado real del permiso del teléfono. */
export default function NotificationPreferencesScreen() {
  const t = useT();
  const { settings, update } = useSettings();
  const { permission, request } = useNotificationPermission();
  const granted = permission.status === 'granted';
  const { unreadCount } = useNotifications();
  const tranqui = isTranqui(settings);

  return (
    <FormScreen title={t('notif.prefs.title')} closeIcon="back">
      {/* El centro de notificaciones vive aquí: todo lo de avisos en un solo lugar. */}
      <SettingsSection>
        <SettingsRow
          icon="notifications"
          label={t('settings.notificationCenter')}
          description={unreadCount > 0 ? t('settings.unread', { count: unreadCount }) : undefined}
          accessory={unreadCount > 0 ? { type: 'badge', count: unreadCount } : { type: 'chevron' }}
          onPress={() => router.push('/notificaciones')}
        />
      </SettingsSection>

      <SettingsSection footnote={granted ? undefined : t('notif.permission.hint')}>
        <SettingsRow
          icon="notifications"
          label={t('notif.permission.label')}
          accessory={{ type: 'value', value: t(PERMISSION_LABEL[permission.status]), navigate: !granted }}
          onPress={granted ? undefined : request}
        />
      </SettingsSection>

      <SettingsSection footnote={t('notif.prefs.note')}>
        {TOGGLES.map((toggle) => (
          <SettingsRow
            key={toggle.key}
            icon={toggle.icon}
            label={t(toggle.label)}
            // Tranqui no los envía aunque estén activados (al volver a "Al detalle", siguen como estaban).
            description={tranqui && TRANQUI_MUTED.includes(toggle.key) ? 'En el estilo Tranqui no se envían' : undefined}
            accessory={{
              type: 'switch',
              value: settings[toggle.key],
              onChange: (value) => update({ [toggle.key]: value }),
            }}
          />
        ))}
      </SettingsSection>
    </FormScreen>
  );
}
