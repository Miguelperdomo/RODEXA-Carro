import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';
import { formatCop } from '@/shared/utils/format';

import type { BudgetStatus } from '../rules';

/** Barra "lo registrado frente al presupuesto": verde, amarilla desde el 80 % y roja si se pasa. */
export function BudgetBar({ status }: { status: BudgetStatus }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tone = colors.status[status.level === 'over' ? 'due' : status.level === 'near' ? 'soon' : 'ok'];
  const fill = `${Math.min(status.ratio, 1) * 100}%` as const;

  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={`Presupuesto: ${status.percent} por ciento usado. ${formatCop(status.spentCop)} de ${formatCop(status.limitCop)}.`}>
      <View style={styles.labels}>
        <AppText variant="caption" tone="secondary" numeric style={styles.flex}>
          {formatCop(status.spentCop)} de {formatCop(status.limitCop)}
        </AppText>
        <AppText variant="captionStrong" color={tone.color} numeric>
          {status.percent} %
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: fill, backgroundColor: tone.color }]} />
      </View>
      <AppText variant="caption" color={status.level === 'ok' ? colors.text.secondary : tone.color}>
        {status.level === 'over'
          ? `Superaste el presupuesto por ${formatCop(status.overCop)}`
          : status.level === 'near'
            ? `Quedan ${formatCop(status.remainingCop)}: ya superaste el 80 %`
            : `Quedan ${formatCop(status.remainingCop)}`}
      </AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  root: {
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
}));
