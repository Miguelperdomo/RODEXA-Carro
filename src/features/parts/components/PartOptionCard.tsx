import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon } from '@/shared/ui';

import type { PartTier } from '../catalog';
import { Placeholder } from './Placeholder';

/**
 * Nivel 1–2: una opción de repuesto. Hoy es un espacio reservado:
 * marca, referencia, características y precio aún no existen.
 */
export function PartOptionCard({ tier }: { tier: PartTier }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name={tier.icon} size={22} color={colors.brand.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{tier.label}</AppText>
          <AppText variant="caption" tone="secondary">
            Por qué: {tier.criterion}
          </AppText>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.placeholderGroup}>
          <AppText variant="caption" tone="muted">
            Marca y referencia
          </AppText>
          <Placeholder width="70%" height={14} />
        </View>
        <View style={styles.placeholderGroup}>
          <AppText variant="caption" tone="muted">
            Características
          </AppText>
          <View style={styles.chips}>
            <Placeholder width={72} height={24} />
            <Placeholder width={96} height={24} />
            <Placeholder width={64} height={24} />
          </View>
        </View>
      </View>

      <View style={styles.priceRow}>
        <AppText variant="caption" tone="secondary">
          Precio aproximado
        </AppText>
        <AppText variant="heading" tone="muted" numeric>
          $ —
        </AppText>
      </View>
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  placeholderGroup: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
