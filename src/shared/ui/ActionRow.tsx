import { Pressable, View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type ActionRowProps = {
  icon: IconName;
  label: string;
  description?: string;
  onPress: () => void;
};

/** Fila de acción dentro de una tarjeta: ícono + texto + flecha. */
export function ActionRow({ icon, label, description, onPress }: ActionRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}>
        <Icon name={icon} size={sizes.iconMd} color={colors.brand.accent} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description && (
          <AppText variant="caption" tone="secondary">
            {description}
          </AppText>
        )}
      </View>
      <Icon name="chevronRight" color={colors.text.muted} />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
}));
