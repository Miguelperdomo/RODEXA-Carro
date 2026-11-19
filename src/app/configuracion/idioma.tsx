import { router } from 'expo-router';

import { CURRENT_REGION } from '@/features/settings/defaults';
import { useSettings } from '@/features/settings/SettingsProvider';
import { LANGUAGE_NAMES, useT } from '@/i18n';
import { FormScreen, SettingsRow, SettingsSection } from '@/shared/ui';

export default function LanguageRegionScreen() {
  const t = useT();
  const { settings } = useSettings();

  return (
    <FormScreen title={t('region.title')} closeIcon="back">
      {/* Solo español por ahora: la traducción al inglés no está completa en todas las pantallas. */}
      <SettingsSection title={t('region.language')}>
        <SettingsRow icon="language" label={t('region.language')} accessory={{ type: 'value', value: LANGUAGE_NAMES.es }} />
      </SettingsSection>

      <SettingsSection title={t('region.region')} footnote={t('region.editInPreferences')}>
        <SettingsRow
          icon="city"
          label={t('region.country')}
          accessory={{ type: 'value', value: CURRENT_REGION.country }}
        />
        <SettingsRow
          icon="expense"
          label={t('region.currency')}
          accessory={{
            type: 'value',
            value: `${CURRENT_REGION.currency} — ${CURRENT_REGION.currencyName}`,
          }}
        />
        <SettingsRow
          icon="odometer"
          label={t('region.distance')}
          accessory={{ type: 'value', value: t('prefs.distance.km') }}
        />
        <SettingsRow
          icon="calendar"
          label={t('region.dateFormat')}
          accessory={{ type: 'value', value: settings.dateFormat, navigate: true }}
          onPress={() => router.push('/configuracion/preferencias')}
        />
      </SettingsSection>
    </FormScreen>
  );
}
