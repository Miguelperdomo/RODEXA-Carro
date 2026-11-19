import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';

import { BRAND } from '@/config/brand';
import { recommendApp, shareApp } from '@/features/about/share';
import { useT } from '@/i18n';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, BrandMark, FormScreen, SettingsRow, SettingsSection } from '@/shared/ui';

/** Acerca de RODEXA Carro. La versión se lee de la configuración de Expo (app.json). */
export default function AboutScreen() {
  const styles = useStyles();
  const t = useT();
  const version = Constants.expoConfig?.version;
  const soon = { type: 'soon' as const, label: t('common.soon') };

  return (
    <FormScreen title={t('about.title')} closeIcon="back">
      <View style={styles.hero}>
        <BrandMark size="lg" />
        <AppText tone="secondary" align="center">
          {BRAND.tagline}
        </AppText>
        <View style={styles.company}>
          <AppText variant="caption" tone="muted" align="center">
            {BRAND.madeBy}
          </AppText>
          <AppText variant="caption" tone="muted" align="center">
            © {BRAND.copyrightYear} {BRAND.company}
          </AppText>
          <AppText variant="caption" tone="muted" align="center">
            {BRAND.footerDescription}
          </AppText>
        </View>
      </View>

      <SettingsSection title={t('settings.section.about')}>
        <SettingsRow
          icon="version"
          label={t('settings.version')}
          accessory={{ type: 'value', value: version ?? '—' }}
        />
        <SettingsRow
          icon="info"
          label={t('about.status')}
          description={t('about.status.value')}
          accessory={{ type: 'value', value: '' }}
        />
      </SettingsSection>

      <SettingsSection title={t('about.legal')}>
        <SettingsRow
          icon="fine"
          label={t('about.terms')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/terminos')}
        />
        <SettingsRow
          icon="policy"
          label={t('about.privacy')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/politica-privacidad')}
        />
        <SettingsRow
          icon="version"
          label={t('about.licenses')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/licencias')}
        />
      </SettingsSection>

      <SettingsSection title={t('about.spread')}>
        <SettingsRow icon="star" label={t('about.rate')} accessory={soon} />
        <SettingsRow
          icon="share"
          label={t('about.share')}
          description={t('about.share.description')}
          accessory={{ type: 'chevron' }}
          onPress={shareApp}
        />
        <SettingsRow
          icon="recommend"
          label={t('about.recommend')}
          description={t('about.recommend.description')}
          accessory={{ type: 'chevron' }}
          onPress={recommendApp}
        />
      </SettingsSection>

      {/* Quién hace RODEXA: antes estaba suelto en Configuración. */}
      <SettingsSection title="Providentia Tech">
        <SettingsRow
          icon="company"
          label={t('settings.aboutProvidentia')}
          description={t('settings.aboutProvidentia.description')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/providentia')}
        />
        <SettingsRow
          icon="founder"
          label={t('settings.founder')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/fundador')}
        />
      </SettingsSection>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  company: {
    gap: 2,
    marginTop: spacing.sm,
  },
}));
