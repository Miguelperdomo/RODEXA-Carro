import { Pressable, View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  /** Ocupa todo el ancho disponible. */
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const pressedStyles = usePressedStyles();
  // Relleno azul → texto blanco; botones sin relleno → azul legible sobre el fondo (accent).
  const textColor = variant === 'primary' ? colors.brand.onPrimary : colors.brand.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && pressedStyles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}>
      <View style={styles.content}>
        {icon && <Icon name={icon} size={sizes.iconSm} color={textColor} />}
        <AppText variant="bodyStrong" color={textColor}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  base: {
    minHeight: sizes.touchMin,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.brand.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
}));

const usePressedStyles = createStyles((colors) => ({
  primary: { backgroundColor: colors.brand.pressed },
  secondary: { backgroundColor: colors.brand.soft },
  ghost: { backgroundColor: colors.brand.soft },
}));
