import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, maintenanceStatusLabels, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';
import { today } from '@/shared/utils/date';

import { nextMaintenance } from '../nextMaintenance';

/**
 * Inicio: el mantenimiento más próximo, con barra de progreso (según tus registros).
 * No aparece si ese componente ya está en el bloque "Hoy" (`shownInToday`).
 */
export function NextMaintenanceCard({ shownInToday = [] }: { shownInToday?: string[] }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { components, history, odometer } = useAppData();
  const next = nextMaintenance(components, history, odometer.registeredKm, today());
  if (!next || shownInToday.includes(next.component.code)) return null;

  const tone = colors.status[next.status];
  const percent = Math.round(next.progress * 100);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Próximo mantenimiento: ${next.component.title}. ${next.remaining}`}
      onPress={() => router.push({ pathname: '/mi-carro/componente/[code]', params: { code: next.component.code } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: tone.background }]}>
          <Icon name={next.component.icon} color={tone.color} />
        </View>
        <View style={styles.texts}>
          <AppText variant="caption" tone="secondary">
            Próximo mantenimiento
          </AppText>
          <AppText variant="bodyStrong">{next.component.title}</AppText>
        </View>
        <View style={[styles.pill, { backgroundColor: tone.background }]}>
          <AppText variant="captionStrong" color={tone.color}>
            {maintenanceStatusLabels[next.status]}
          </AppText>
        </View>
      </View>
      <AppText variant="heading" numeric>
        {next.remaining}
      </AppText>
      <View style={styles.track} accessibilityLabel={`${percent} % del intervalo`}>
        <View style={[styles.bar, { width: `${Math.max(percent, 2)}%`, backgroundColor: tone.color }]} />
      </View>
      <AppText variant="caption" tone="muted">
        Según tus registros y el intervalo que configuraste.
      </AppText>
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
}));
