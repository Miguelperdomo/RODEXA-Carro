import { Fragment } from 'react';
import { View } from 'react-native';

import { DocumentRow } from '@/features/documents/components/DocumentRow';
import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { Settings } from '@/features/settings/types';
import { useT, type TranslationKey } from '@/i18n';
import { createStyles } from '@/shared/theme';
import { Card, FormScreen, SettingsRow, SettingsSection, type IconName } from '@/shared/ui';

type ToggleKey = keyof Pick<
  Settings,
  'remindSoat' | 'remindRtm' | 'remindPolicy' | 'remindTax' | 'remindLicense' | 'remindOther'
>;

const TOGGLES: { key: ToggleKey; label: TranslationKey; icon: IconName }[] = [
  { key: 'remindSoat', label: 'dprefs.soat', icon: 'insurance' },
  { key: 'remindRtm', label: 'dprefs.rtm', icon: 'inspection' },
  { key: 'remindPolicy', label: 'dprefs.policy', icon: 'insurance' },
  { key: 'remindTax', label: 'dprefs.tax', icon: 'tax' },
  { key: 'remindLicense', label: 'dprefs.license', icon: 'document' },
  { key: 'remindOther', label: 'dprefs.other', icon: 'document' },
];

/** Preferencias de recordatorios de documentos + estado actual de cada uno. */
export default function DocumentPreferencesScreen() {
  const t = useT();
  const styles = useStyles();
  const { settings, update } = useSettings();
  const { documents } = useAppData();

  return (
    <FormScreen title={t('dprefs.title')} closeIcon="back">
      <SettingsSection>
        {TOGGLES.map((toggle) => (
          <SettingsRow
            key={toggle.key}
            icon={toggle.icon}
            label={t(toggle.label)}
            accessory={{
              type: 'switch',
              value: settings[toggle.key],
              onChange: (value) => update({ [toggle.key]: value }),
            }}
          />
        ))}
      </SettingsSection>

      <Card flush>
        {documents.map((doc, index) => (
          <Fragment key={doc.key}>
            {index > 0 && <View style={styles.divider} />}
            <DocumentRow doc={doc} />
          </Fragment>
        ))}
      </Card>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
}));
