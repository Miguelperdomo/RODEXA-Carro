import { useSettings } from '@/features/settings/SettingsProvider';
import { useT } from '@/i18n';
import { FormScreen, SettingsRow, SettingsSection } from '@/shared/ui';

/**
 * Preferencias de mantenimiento. Los intervalos de cada componente NO se editan
 * aquí: siguen en la configuración de cada componente (Mi carro).
 */
export default function MaintenancePreferencesScreen() {
  const t = useT();
  const { settings, update } = useSettings();

  return (
    <FormScreen title={t('mprefs.title')} closeIcon="back">
      <SettingsSection footnote={t('mprefs.note')}>
        <SettingsRow
          icon="notifications"
          label={t('mprefs.reminders')}
          accessory={{
            type: 'switch',
            value: settings.maintenanceReminders,
            onChange: (maintenanceReminders) => update({ maintenanceReminders }),
          }}
        />
        <SettingsRow
          icon="info"
          label={t('mprefs.showEstimate')}
          accessory={{
            type: 'switch',
            value: settings.showEstimate,
            onChange: (showEstimate) => update({ showEstimate }),
          }}
        />
        <SettingsRow
          icon="recommendation"
          label={t('mprefs.showRecommendations')}
          accessory={{
            type: 'switch',
            value: settings.showRecommendations,
            onChange: (showRecommendations) => update({ showRecommendations }),
          }}
        />
        <SettingsRow
          icon="checklist"
          label={t('mprefs.showGettingStarted')}
          accessory={{
            type: 'switch',
            value: settings.showGettingStarted,
            onChange: (showGettingStarted) => update({ showGettingStarted }),
          }}
        />
        <SettingsRow
          icon="odometer"
          label={t('mprefs.remindOdometer')}
          accessory={{
            type: 'switch',
            value: settings.odometerReminders,
            onChange: (odometerReminders) => update({ odometerReminders }),
          }}
        />
      </SettingsSection>
    </FormScreen>
  );
}
