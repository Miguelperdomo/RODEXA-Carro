import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CONTACT_DRAFT, openEmailDraft } from '@/features/help/email';
import { FAQ } from '@/features/help/faq';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useT } from '@/i18n';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, FormScreen, Icon, SettingsRow, SettingsSection, useToast } from '@/shared/ui';

/**
 * Ayuda y soporte: preguntas frecuentes en acordeón + contacto por correo. Los
 * correos se preparan en la app de correo del usuario (nada se envía ni se guarda aquí).
 */
export default function HelpScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const t = useT();
  const { settings } = useSettings();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const lang = settings.language;

  return (
    <FormScreen title={t('help.title')} closeIcon="back">
      <View>
        <AppText variant="captionStrong" tone="secondary" style={styles.sectionTitle}>
          {t('help.faq').toUpperCase()}
        </AppText>
        <Card flush>
          {FAQ.map((item, index) => {
            const isOpen = open === item.id;
            return (
              <Fragment key={item.id}>
                {index > 0 && <View style={styles.divider} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => setOpen(isOpen ? null : item.id)}
                  style={({ pressed }) => [styles.question, pressed && styles.pressed]}>
                  <AppText variant="bodyStrong" style={styles.flex}>
                    {item.question[lang]}
                  </AppText>
                  <Icon name={isOpen ? 'expandLess' : 'expandMore'} color={colors.text.muted} />
                </Pressable>
                {isOpen && (
                  <AppText tone="secondary" style={styles.answer}>
                    {item.answer[lang]}
                  </AppText>
                )}
              </Fragment>
            );
          })}
        </Card>
      </View>

      <SettingsSection title={t('help.contact')}>
        <SettingsRow
          icon="bug"
          label={t('help.report')}
          description={t('help.report.description')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/reportar')}
        />
        <SettingsRow
          icon="suggest"
          label={t('help.suggest')}
          description={t('help.suggest.description')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/sugerir')}
        />
        <SettingsRow
          icon="contact"
          label={t('help.contactUs')}
          description={t('help.contactUs.description')}
          accessory={{ type: 'chevron' }}
          onPress={() => openEmailDraft(CONTACT_DRAFT, () => toast.show(t('help.emailCopied')))}
        />
      </SettingsSection>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  answer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
}));
