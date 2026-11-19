import { Pressable, View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type QuickTile = { key: string; icon: IconName; label: string; onPress: () => void };

/** Accesos rápidos: íconos grandes en cuadrícula de 3 columnas (se ve igual con letra grande). */
export function QuickTiles({ tiles, tone = 'default' }: { tiles: QuickTile[]; tone?: 'default' | 'alert' }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const color = tone === 'alert' ? colors.status.due.color : colors.brand.accent;
  return (
    <View style={styles.grid}>
      {tiles.map((t) => (
        <Pressable
          key={t.key}
          accessibilityRole="button"
          accessibilityLabel={t.label}
          onPress={t.onPress}
          style={({ pressed }) => [styles.tile, tone === 'alert' && styles.alert, pressed && styles.pressed]}>
          <Icon name={t.icon} size={26} color={color} />
          <AppText variant="captionStrong" align="center" numberOfLines={2}>
            {t.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: colors.highContrast ? 2 : 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  alert: {
    backgroundColor: colors.status.due.background,
    borderColor: colors.status.due.background,
  },
  pressed: {
    opacity: 0.8,
  },
}));
