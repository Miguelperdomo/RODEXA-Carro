import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon } from '@/shared/ui';

import { useProAccess } from '../access';
import type { ProFeature } from '../config';

type ProGateProps = {
  feature: Pick<ProFeature, 'title' | 'description'>;
  /** Características que se muestran en la versión gratis (qué incluye la función). */
  points?: string[];
  children: ReactNode;
};

/**
 * Muestra la función solo con RODEXA Pro activo. En Free explica qué hace y lleva a los
 * planes; nunca bloquea lo esencial (esto solo envuelve pantallas Pro).
 */
export function ProGate({ feature, points, children }: ProGateProps) {
  const { isPro, source } = useProAccess();
  const { colors } = useTheme();
  const styles = useStyles();

  if (isPro) {
    return (
      <>
        {source === 'dev_preview' && (
          <View style={styles.preview}>
            <Icon name="preview" size={16} color={colors.brand.accent} />
            <AppText variant="caption" tone="brand">
              Vista previa Pro (solo desarrollo)
            </AppText>
          </View>
        )}
        {children}
      </>
    );
  }

  return (
    <Card tone="highlight" style={styles.locked}>
      <View style={styles.badge}>
        <AppText variant="captionStrong" color={colors.brand.onPrimary}>
          ✦ Pro · Próximamente
        </AppText>
      </View>
      <AppText variant="title">
        {feature.title}
      </AppText>
      <AppText tone="secondary">{feature.description}</AppText>
      {points && points.length > 0 && (
        <View style={styles.points}>
          {points.map((point) => (
            <View key={point} style={styles.point}>
              <Icon name="check" size={18} color={colors.brand.accent} />
              <AppText style={styles.flex}>{point}</AppText>
            </View>
          ))}
        </View>
      )}
      <AppText variant="caption" tone="muted">
        Solo en la versión RODEXA Pro, disponible próximamente. Todo lo que usas hoy en RODEXA Carro sigue siendo gratis.
      </AppText>
      <Button label="Conoce RODEXA Pro" variant="secondary" icon="premium" fullWidth onPress={() => router.push('/pro')} />
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.soft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  locked: {
    gap: spacing.md,
  },
  points: {
    gap: spacing.sm,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
}));
