import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { INFO_CARE_SCORE } from '@/shared/help/infoTexts';
import { AppText, Icon, InfoButton } from '@/shared/ui';

import { careScore, scoreTone } from '../score';

/** Mi carro: puntaje de cuidado compacto; al tocarlo, el detalle. */
export function CareScoreCard() {
  const { colors } = useTheme();
  const styles = useStyles();
  const care = careScore(useAppData());
  const tone = scoreTone(care.score, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Puntaje de cuidado: ${care.score ?? 'sin suficiente información'}`}
      onPress={() => router.push('/puntaje')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.badge, { borderColor: tone.color, backgroundColor: tone.background }]}>
        <AppText variant="heading" numeric color={tone.color}>
          {care.score ?? '–'}
        </AppText>
      </View>
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong">Puntaje de cuidado</AppText>
          <InfoButton {...INFO_CARE_SCORE} />
        </View>
        <AppText variant="caption" tone="secondary">
          {care.score !== undefined
            ? `${care.label} · ${care.tips.length > 0 ? `${care.tips.length} ${care.tips.length === 1 ? 'cosa' : 'cosas'} para mejorar` : 'todo al día'}`
            : 'Completa tus datos para calcularlo'}
        </AppText>
      </View>
      <Icon name="chevronRight" color={colors.text.muted} />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
}));
