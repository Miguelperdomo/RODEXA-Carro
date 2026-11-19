import { Pressable, View } from 'react-native';

import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';
import { formatCop } from '@/shared/utils/format';

import type { CategoryTotal } from '../compute';

type CategoryBarsProps = {
  items: CategoryTotal[];
  /** Tocar una categoría (p. ej. ver sus gastos en Historial). */
  onPress?: (item: CategoryTotal) => void;
};

/**
 * Barras horizontales de una sola serie (gasto por categoría).
 * Un solo color (marca), nombre y valor escritos: se lee sin tocar nada.
 */
export function CategoryBars({ items, onPress }: CategoryBarsProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const max = Math.max(...items.map((i) => i.amountCop), 1);

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={styles.item}
          disabled={!onPress}
          onPress={onPress ? () => onPress(item) : undefined}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={`${item.label}: ${formatCop(item.amountCop)}, ${Math.round(item.share * 100)} por ciento`}>
          <View style={styles.labels}>
            <Icon name={item.icon} size={18} color={colors.text.secondary} />
            <AppText variant="bodyStrong" style={styles.label} numberOfLines={1}>
              {item.label}
            </AppText>
            <AppText variant="bodyStrong" numeric>
              {formatCop(item.amountCop)}
            </AppText>
            <AppText variant="caption" tone="muted" numeric style={styles.share}>
              {Math.round(item.share * 100)} %
            </AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${(item.amountCop / max) * 100}%` }]} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  list: {
    gap: spacing.lg,
  },
  item: {
    gap: spacing.sm,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
  share: {
    width: 40,
    textAlign: 'right',
  },
  track: {
    height: 10,
    borderRadius: 4,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
}));
