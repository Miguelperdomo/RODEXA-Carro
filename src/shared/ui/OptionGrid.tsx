import { Pressable, View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type Option<T extends string> = {
  value: T;
  label: string;
  icon: IconName;
};

type OptionGridProps<T extends string> = {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  /** 2 columnas para textos largos, 3 para categorías cortas. */
  columns?: 2 | 3;
};

/** Cuadrícula de opciones grandes con ícono, pensada para tocar con el pulgar. */
export function OptionGrid<T extends string>({
  options,
  selected,
  onToggle,
  columns = 2,
}: OptionGridProps<T>) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <View key={option.value} style={{ width: columns === 3 ? '33.333%' : '50%' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => [
                styles.tile,
                isSelected && styles.tileSelected,
                pressed && !isSelected && styles.tilePressed,
              ]}>
              {isSelected && (
                <View style={styles.check}>
                  <Icon name="check" size={14} color={colors.brand.onPrimary} />
                </View>
              )}
              <Icon
                name={option.icon}
                size={26}
                color={isSelected ? colors.brand.accent : colors.text.secondary}
              />
              <AppText
                variant="captionStrong"
                align="center"
                color={isSelected ? colors.brand.accent : colors.text.primary}
                numberOfLines={2}>
                {option.label}
              </AppText>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -spacing.xs,
  },
  tile: {
    margin: spacing.xs,
    minHeight: 88,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tileSelected: {
    borderColor: colors.brand.accent,
    backgroundColor: colors.brand.soft,
  },
  tilePressed: {
    backgroundColor: colors.background,
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
