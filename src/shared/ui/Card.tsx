import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles, radius, spacing } from '@/shared/theme';

type CardProps = {
  children: ReactNode;
  /** Si se pasa, toda la tarjeta se puede tocar. */
  onPress?: () => void;
  /** `highlight` usa el fondo suave de la marca. */
  tone?: 'default' | 'highlight';
  /** Sin padding interno, para listas de filas que manejan su propio espacio. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, onPress, tone = 'default', flush = false, style }: CardProps) {
  const styles = useStyles();
  const cardStyle = [
    styles.base,
    tone === 'highlight' && styles.highlight,
    !flush && styles.padded,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
  highlight: {
    backgroundColor: colors.brand.soft,
    borderColor: colors.brand.soft,
  },
  pressed: {
    opacity: 0.85,
  },
}));
