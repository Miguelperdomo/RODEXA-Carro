import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon, InfoButton, type IconName, type InfoText } from '@/shared/ui';

type StatTileProps = {
  icon: IconName;
  label: string;
  /** undefined → "Sin suficiente información", nunca un número inventado. */
  value?: string;
  caption?: string;
  /** Texto cuando no hay valor (p. ej. "Datos insuficientes para calcular consumo"). */
  emptyText?: string;
  /** ⓘ arriba a la derecha (solo para lo que no todos entienden). */
  info?: InfoText;
};

export function StatTile({ icon, label, value, caption, emptyText = 'Sin suficiente información', info }: StatTileProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.tile}>
      <View style={styles.top}>
        <Icon name={icon} size={20} color={colors.brand.accent} />
        {info && <InfoButton {...info} />}
      </View>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      {value ? (
        <AppText variant="heading" numeric numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {value}
        </AppText>
      ) : (
        <AppText variant="caption" tone="muted">
          {emptyText}
        </AppText>
      )}
      {caption && value && (
        <AppText variant="caption" tone="muted">
          {caption}
        </AppText>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  tile: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
