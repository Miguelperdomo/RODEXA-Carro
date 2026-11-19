import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { createStyles, spacing, statusIcons, useTheme, type StatusLevel } from '@/shared/theme';
import { AppText, Card, Icon } from '@/shared/ui';

import type { StateItem } from '../stateAnalysis';

/** Nivel del análisis → estado visual existente (mismos colores e íconos de la app). */
const LEVEL_STATUS: Record<StateItem['level'], StatusLevel> = {
  due: 'due',
  soon: 'soon',
  nodata: 'nodata',
  info: 'ok',
};

/** Lista de puntos del análisis del estado; los que tienen pantalla se pueden tocar. */
export function StateList({ items }: { items: StateItem[] }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Card flush>
      {items.map((item, i) => {
        const status = colors.status[LEVEL_STATUS[item.level]];
        const icon = item.level === 'info' ? 'info' : statusIcons[LEVEL_STATUS[item.level]];
        const href = item.href;
        return (
          <Pressable
            key={item.key}
            disabled={!href}
            onPress={href ? () => router.push(href) : undefined}
            accessibilityRole={href ? 'button' : undefined}
            style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: item.level === 'info' ? colors.brand.soft : status.background }]}>
              <Icon name={icon} size={20} color={item.level === 'info' ? colors.brand.accent : status.color} />
            </View>
            <View style={styles.texts}>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {item.detail}
              </AppText>
            </View>
            {href && <Icon name="chevronRight" color={colors.text.muted} />}
          </Pressable>
        );
      })}
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.brand.soft,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
}));
