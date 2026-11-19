import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { TextSection } from '@/features/about/components/InstitutionalBlocks';
import { FOUNDER, PROVIDENTIA } from '@/features/about/providentia';
import { BRAND } from '@/config/brand';
import { CONTACT_DRAFT, openEmailDraft } from '@/features/help/email';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, FormScreen, SettingsRow, SettingsSection, useToast } from '@/shared/ui';

/**
 * Conoce al fundador: presentación profesional y humana. Solo información profesional
 * (sin documento, dirección, teléfono ni datos personales). Sin foto inventada: si no hay
 * una fotografía real, se muestran sus iniciales.
 */
export default function FounderScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();

  return (
    <FormScreen title="Conoce al fundador" closeIcon="back">
      <View style={styles.hero}>
        {FOUNDER.photo !== undefined ? (
          <Image source={FOUNDER.photo} style={styles.avatar} contentFit="cover" accessibilityLabel={`Foto de ${FOUNDER.name}`} />
        ) : (
          <View style={[styles.avatar, styles.initials]} accessible accessibilityLabel={`Iniciales de ${FOUNDER.name}`}>
            <AppText variant="display" color={colors.brand.onPrimary}>
              {FOUNDER.initials}
            </AppText>
          </View>
        )}
        <AppText variant="title" align="center">
          {FOUNDER.name}
        </AppText>
        <AppText variant="bodyStrong" tone="brand" align="center">
          {FOUNDER.role}
        </AppText>
        <AppText tone="secondary" align="center">
          {FOUNDER.education}
        </AppText>
      </View>

      <TextSection title="Sobre mí" icon="founder" paragraphs={FOUNDER.bio} />
      <TextSection title="Por qué Providentia Tech" icon="recommendation" paragraphs={FOUNDER.why} />

      <AppText variant="caption" tone="muted">
        {PROVIDENTIA.transparency[1]}
      </AppText>

      <SettingsSection title="Más">
        <SettingsRow
          icon="company"
          label="Sobre Providentia Tech"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/providentia')}
        />
        <SettingsRow
          icon="contact"
          label="Contactar a Providentia Tech"
          description={BRAND.supportEmail}
          accessory={{ type: 'chevron' }}
          onPress={() => openEmailDraft(CONTACT_DRAFT, () => toast.show('Correo copiado'))}
        />
      </SettingsSection>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: spacing.sm,
  },
  initials: {
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
