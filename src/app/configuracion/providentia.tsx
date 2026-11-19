import { router } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import { NoticeCard, ProvidentiaLogo, StatusPill, TextSection } from '@/features/about/components/InstitutionalBlocks';
import { FOUNDER, PROVIDENTIA } from '@/features/about/providentia';
import { BRAND } from '@/config/brand';
import { CONTACT_DRAFT, openEmailDraft } from '@/features/help/email';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, FormScreen, Icon, SectionHeader, SettingsRow, SettingsSection, useToast, type IconName } from '@/shared/ui';

/**
 * Sobre Providentia Tech: quién está detrás de RODEXA. Presentación institucional y
 * transparente: es un proyecto tecnológico en construcción, no una empresa registrada.
 */
export default function ProvidentiaScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();

  return (
    <FormScreen title="Sobre Providentia Tech" closeIcon="back">
      <View style={styles.hero}>
        <ProvidentiaLogo />
        <AppText variant="title" align="center">
          {PROVIDENTIA.name}
        </AppText>
        <AppText tone="secondary" align="center">
          {PROVIDENTIA.tagline}
        </AppText>
        <StatusPill label={PROVIDENTIA.status} />
      </View>

      <TextSection title="Qué es Providentia Tech" icon="company" paragraphs={PROVIDENTIA.about} />
      <TextSection title="Nuestro propósito" icon="recommendation" paragraphs={PROVIDENTIA.purpose} />
      <TextSection title="Cómo empezó" icon="history" paragraphs={PROVIDENTIA.story} />

      <View>
        <SectionHeader title="Nuestros proyectos" icon="partsCatalog" />
        <Card flush>
          {PROVIDENTIA.projects.map((project, i) => (
            <Fragment key={project.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.project}>
                <View style={styles.projectIcon}>
                  <Icon name={project.icon as IconName} color={colors.brand.accent} />
                </View>
                <View style={styles.flex}>
                  <View style={styles.projectTitle}>
                    <AppText variant="bodyStrong">{project.title}</AppText>
                    {'current' in project && project.current && (
                      <View style={styles.here}>
                        <AppText variant="captionStrong" tone="brand">
                          Estás aquí
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText variant="caption" tone="secondary">
                    {project.description}
                  </AppText>
                </View>
              </View>
            </Fragment>
          ))}
        </Card>
      </View>

      <View>
        <SectionHeader title="Hacia dónde vamos" icon="usageTravel" />
        <Card style={styles.steps}>
          {PROVIDENTIA.future.map((step, i) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="captionStrong" color={colors.brand.onPrimary}>
                  {i + 1}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{step.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  {step.text}
                </AppText>
              </View>
            </View>
          ))}
          <AppText variant="caption" tone="muted">
            Sin fechas comprometidas: el proyecto crece a medida que avanza.
          </AppText>
        </Card>
      </View>

      <NoticeCard title="Transparencia" icon="info">
        {PROVIDENTIA.transparency.map((text) => (
          <AppText key={text} tone="secondary">
            {text}
          </AppText>
        ))}
      </NoticeCard>

      <SettingsSection title="Quién está detrás">
        <SettingsRow
          icon="founder"
          label="Conoce al fundador"
          description={FOUNDER.name}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/fundador')}
        />
      </SettingsSection>

      <SettingsSection title="Contacto" footnote={BRAND.supportEmail}>
        <SettingsRow
          icon="contact"
          label="Contactar a Providentia Tech"
          description={BRAND.supportEmail}
          accessory={{ type: 'chevron' }}
          onPress={() => openEmailDraft(CONTACT_DRAFT, () => toast.show('Correo copiado'))}
        />
        <SettingsRow
          icon="bug"
          label="Reportar un problema"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/reportar')}
        />
        <SettingsRow
          icon="suggest"
          label="Sugerir una mejora"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/sugerir')}
        />
      </SettingsSection>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  project: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  here: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
