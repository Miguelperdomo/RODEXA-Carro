import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { hidesFuel } from '@/features/tranqui/style';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

import { gettingStartedSteps, isGettingStartedOpen } from '../gettingStarted';

/**
 * Primeros pasos (Inicio): una tarjeta compacta con lo que falta. Desaparece sola al
 * completar los pasos, o con "Omitir" (se puede volver a activar en Configuración →
 * Mantenimiento).
 */
export function GettingStartedCard() {
  const { colors } = useTheme();
  const styles = useStyles();
  const data = useAppData();
  const { settings, update } = useSettings();
  // Misma regla que usa "Llamar rápido" para no mostrar su invitación a la vez.
  const hideEnergy = hidesFuel(settings);
  const complianceDone = settings.roadKit !== '';
  if (!isGettingStartedOpen(settings.showGettingStarted, data, hideEnergy, complianceDone)) return null;
  const steps = gettingStartedSteps(data, hideEnergy, complianceDone);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={styles.flex}>
          Primeros pasos
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Omitir primeros pasos"
          hitSlop={10}
          onPress={() => update({ showGettingStarted: false })}>
          <AppText variant="captionStrong" tone="secondary">
            Omitir
          </AppText>
        </Pressable>
      </View>
      {steps.map((step, i) => (
        <Fragment key={step.key}>
          {i > 0 && <View style={styles.divider} />}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(step.href)}
            style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
            <View style={styles.icon}>
              <Icon name={step.icon} size={20} color={colors.brand.accent} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{step.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {step.description}
              </AppText>
            </View>
            <Icon name="chevronRight" color={colors.text.muted} />
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    backgroundColor: colors.brand.soft,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
}));
