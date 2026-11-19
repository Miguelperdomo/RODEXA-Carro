

import { CURRENT_REGION } from '@/features/settings/defaults';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { Currency, DateFormat } from '@/features/settings/types';
import { useT } from '@/i18n';
import { FormScreen, SettingsRow, SettingsSection, SettingsSelectRow, useToast } from '@/shared/ui';
import { appAlert } from '@/shared/ui/AppDialog';

/** Formatos globales: se aplican en las funciones de formato centralizadas (formatKm, formatDate). */
export default function GeneralPreferencesScreen() {
  const t = useT();
  const toast = useToast();
  const { settings, update, resetPreferences } = useSettings();

  const changed = () => toast.show(t('toast.preferenceUpdated'));

  const confirmReset = () =>
    appAlert(t('confirm.reset.title'), t('confirm.reset.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('confirm.reset.action'),
        onPress: () => {
          resetPreferences();
          toast.show(t('toast.preferencesReset'));
        },
      },
    ]);

  return (
    <FormScreen title={t('prefs.title')} closeIcon="back">
      <SettingsSection footnote={t('prefs.note')}>
        <SettingsSelectRow<Currency>
          icon="expense"
          label={t('prefs.currency')}
          options={[{ value: 'COP', label: `COP — ${CURRENT_REGION.currencyName}` }]}
          value={settings.currency}
          cancelLabel={t('common.cancel')}
          onChange={(currency) => update({ currency })}
        />
        <SettingsSelectRow<DateFormat>
          icon="calendar"
          label={t('prefs.dateFormat')}
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: '28/09/2026' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: '09/28/2026' },
          ]}
          value={settings.dateFormat}
          cancelLabel={t('common.cancel')}
          onChange={(dateFormat) => {
            update({ dateFormat });
            changed();
          }}
        />
      </SettingsSection>

      {/* Al final: vuelve a dejar las preferencias como venían (no toca los datos del carro). */}
      <SettingsSection>
        <SettingsRow
          icon="reset"
          label={t('settings.resetPreferences')}
          description={t('settings.resetPreferences.description')}
          accessory={{ type: 'chevron' }}
          onPress={confirmReset}
        />
      </SettingsSection>
    </FormScreen>
  );
}
