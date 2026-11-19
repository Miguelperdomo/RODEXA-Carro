import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon } from './Icon';

type SuccessViewProps = {
  title: string;
  /** Resumen de lo registrado: [{ label: 'Kilometraje', value: '53.520 km' }] */
  summary: { label: string; value: string }[];
  message?: string;
};

/** Confirmación visual después de guardar. Usa el azul de marca (el verde es solo para estados). */
export function SuccessView({ title, summary, message }: SuccessViewProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name="check" size={44} color={colors.brand.onPrimary} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>

      <Card style={styles.summary}>
        {summary.map((row, index) => (
          <View key={row.label} style={[styles.row, index > 0 && styles.rowDivider]}>
            <AppText tone="secondary">{row.label}</AppText>
            <AppText variant="bodyStrong" numeric style={styles.value}>
              {row.value}
            </AppText>
          </View>
        ))}
      </Card>

      {message && (
        <AppText variant="caption" tone="muted" align="center">
          {message}
        </AppText>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    alignSelf: 'stretch',
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
}));
