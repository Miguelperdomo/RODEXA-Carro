import { Pressable, Switch, View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Accessory =
  | { type: 'chevron' }
  /** Valor actual; con `navigate` también muestra la flecha. */
  | { type: 'value'; value: string; navigate?: boolean }
  | { type: 'switch'; value: boolean; onChange: (value: boolean) => void }
  /** Contador (p. ej. notificaciones sin leer) + flecha. */
  | { type: 'badge'; count: number }
  | { type: 'soon'; label?: string };

type SettingsRowProps = {
  icon: IconName;
  label: string;
  description?: string;
  accessory: Accessory;
  onPress?: () => void;
  /** Acción destructiva (eliminar datos): ícono y texto en rojo, sin depender solo del color. */
  destructive?: boolean;
};

/** Fila de configuración: ícono + texto + (flecha | valor | interruptor | contador | "Pronto"). */
export function SettingsRow({
  icon,
  label,
  description,
  accessory,
  onPress,
  destructive = false,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const accent = destructive ? colors.status.due.color : colors.brand.accent;

  const content = (
    <>
      <View style={[styles.icon, destructive && { backgroundColor: colors.status.due.background }]}>
        <Icon name={icon} size={sizes.iconMd} color={accent} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" color={destructive ? accent : undefined}>
          {label}
        </AppText>
        {description && (
          <AppText variant="caption" tone="secondary">
            {description}
          </AppText>
        )}
      </View>
      {accessory.type === 'chevron' && <Icon name="chevronRight" color={colors.text.muted} />}
      {accessory.type === 'value' && (
        <View style={styles.valueRow}>
          <AppText tone="secondary" numeric numberOfLines={1} style={styles.value}>
            {accessory.value}
          </AppText>
          {accessory.navigate && <Icon name="chevronRight" color={colors.text.muted} />}
        </View>
      )}
      {accessory.type === 'badge' && (
        <View style={styles.valueRow}>
          {accessory.count > 0 && (
            <View style={styles.badge}>
              <AppText variant="captionStrong" color={colors.brand.onPrimary} numeric>
                {accessory.count}
              </AppText>
            </View>
          )}
          <Icon name="chevronRight" color={colors.text.muted} />
        </View>
      )}
      {accessory.type === 'switch' && (
        <Switch
          value={accessory.value}
          onValueChange={accessory.onChange}
          trackColor={{ true: colors.brand.primary, false: colors.border }}
          thumbColor={colors.brand.onPrimary}
          accessibilityLabel={label}
        />
      )}
      {accessory.type === 'soon' && (
        <View style={styles.soon}>
          <AppText variant="captionStrong" tone="muted">
            {accessory.label ?? 'Pronto'}
          </AppText>
        </View>
      )}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessible={accessory.type !== 'switch'}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '45%',
  },
  value: {
    flexShrink: 1,
  },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soon: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
