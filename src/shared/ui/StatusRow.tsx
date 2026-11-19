import { Pressable, View } from 'react-native';

import { createStyles, radius, sizes, spacing, type StatusLevel, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type StatusRowProps = {
  /** Estado ya calculado. Este componente solo lo muestra, no lo calcula. */
  status: StatusLevel;
  /** Nombre del componente o documento: "Aceite", "SOAT"… */
  title: string;
  /** Ícono del componente; se pinta con el color del estado. Por defecto, el del estado. */
  icon?: IconName;
  /** Etiqueta del estado: "Al día", "Por vencer"… */
  statusLabel: string;
  /** Detalle: "Faltan 260 km", "Vigente hasta 14/05/2027"… */
  detail?: string;
  onPress?: () => void;
};

export function StatusRow({ status, title, icon, statusLabel, detail, onPress }: StatusRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const style = colors.status[status];

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}: ${statusLabel}${detail ? `. ${detail}` : ''}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconBadge, { backgroundColor: style.background }]}>
        <Icon name={icon ?? style.icon} size={sizes.iconMd} color={style.color} />
      </View>

      <View style={styles.texts}>
        <AppText variant="bodyStrong">{title}</AppText>
        {detail && (
          <AppText variant="caption" tone="secondary" numeric>
            {detail}
          </AppText>
        )}
      </View>

      <View style={[styles.pill, { backgroundColor: style.background }]}>
        <AppText variant="captionStrong" color={style.color}>
          {statusLabel}
        </AppText>
      </View>

      {onPress && <Icon name="chevronRight" size={sizes.iconMd} color={colors.text.muted} />}
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
}));
