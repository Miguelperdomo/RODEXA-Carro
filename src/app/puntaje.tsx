import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { careScore, scoreTone } from '@/features/care/score';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, FormScreen, Icon, SectionHeader } from '@/shared/ui';

/** Puntaje de cuidado: de dónde sale cada punto y qué hacer para subirlo. */
export default function CareScoreScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const data = useAppData();
  const care = careScore(data);
  const tone = scoreTone(care.score, colors);

  return (
    <FormScreen title="Puntaje de cuidado" closeIcon="back">
      <Card style={styles.hero}>
        <View style={[styles.ring, { borderColor: tone.color, backgroundColor: tone.background }]}>
          <AppText variant="display" numeric color={tone.color}>
            {care.score ?? '–'}
          </AppText>
          <AppText variant="caption" tone="secondary">
            de 100
          </AppText>
        </View>
        <AppText variant="heading">{care.label ?? 'Sin suficiente información'}</AppText>
        <AppText variant="caption" tone="secondary" align="center">
          {care.score !== undefined
            ? 'Qué tan al día llevas tu carro según tus registros.'
            : 'Configura tus mantenimientos o registra tus documentos para calcularlo.'}
        </AppText>
      </Card>

      <View>
        <SectionHeader title="De dónde sale" />
        <Card>
          {care.parts.map((part, i) => (
            <View key={part.key} style={[styles.part, i > 0 && styles.divider]}>
              <View style={styles.partHeader}>
                <AppText variant="bodyStrong" style={styles.flex}>
                  {part.title}
                </AppText>
                <AppText variant="bodyStrong" numeric tone={part.value === undefined ? 'muted' : 'primary'}>
                  {part.value === undefined ? 'No cuenta' : `${Math.round(part.value * part.weight)} / ${part.weight}`}
                </AppText>
              </View>
              <View style={styles.track}>
                {part.value !== undefined && (
                  <View style={[styles.bar, { width: `${Math.max(part.value * 100, 2)}%`, backgroundColor: colors.brand.primary }]} />
                )}
              </View>
              <AppText variant="caption" tone="secondary">
                {part.detail}
              </AppText>
            </View>
          ))}
        </Card>
      </View>

      {care.tips.length > 0 && (
        <View>
          <SectionHeader title="Para subir tu puntaje" />
          <Card flush>
            {care.tips.map((tip, i) => {
              const status = colors.status[tip.level];
              const href = tip.href;
              return (
                <Fragment key={tip.text}>
                  {i > 0 && <View style={styles.dividerFlush} />}
                  <Pressable
                    disabled={!href}
                    onPress={href ? () => router.push(href) : undefined}
                    accessibilityRole={href ? 'button' : undefined}
                    style={({ pressed }) => [styles.tip, pressed && styles.pressed]}>
                    <Icon name={status.icon} size={20} color={status.color} />
                    <AppText style={styles.flex}>{tip.text}</AppText>
                    {href && <Icon name="chevronRight" color={colors.text.muted} />}
                  </Pressable>
                </Fragment>
              );
            })}
          </Card>
        </View>
      )}

      <AppText variant="caption" tone="muted">
        Mantenimientos al día (50), documentos vigentes (30) y kilometraje actualizado (20). Lo que no tiene datos no
        suma ni resta. Es una guía con tus registros: RODEXA no revisa el carro.
      </AppText>
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
  },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  part: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  partHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dividerFlush: {
    height: 1,
    backgroundColor: colors.border,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.brand.soft,
  },
}));

