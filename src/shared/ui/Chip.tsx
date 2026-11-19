import { Pressable } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
};

/** Opción seleccionable (fechas rápidas, filtros…). */
export function Chip({ label, selected, onPress, icon }: ChipProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const color = selected ? colors.brand.onPrimary : colors.text.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}>
      {icon && <Icon name={icon} size={sizes.iconSm} color={color} />}
      <AppText variant="captionStrong" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  pressed: {
    backgroundColor: colors.brand.soft,
  },
}));
