import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';
import { formatMonthYear, parseISODate } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

import type { MonthBar } from '../trend';

const shortMonth = (monthKey: string) => formatMonthYear(parseISODate(`${monthKey}-01`)).slice(0, 3);

/**
 * Gráfica de barras de gasto por mes (sin librerías). El mes elegido va resaltado; un mes sin
 * gastos registrados muestra una raya ("sin datos"), nunca una barra en $0. Con `average`, una
 * línea punteada marca el promedio.
 */
export function MonthBarsChart({ bars, selected, average }: { bars: MonthBar[]; selected?: string; average?: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const max = Math.max(...bars.map((b) => b.totalCop ?? 0), average ?? 0, 1);
  const label = bars
    .map((b) => `${shortMonth(b.monthKey)}: ${b.totalCop !== undefined ? formatCop(b.totalCop) : 'sin datos'}`)
    .join('. ');

  return (
    <View accessible accessibilityLabel={label}>
      <View style={styles.chart}>
        {average !== undefined && <View style={[styles.average, { bottom: `${(average / max) * 100}%` }]} />}
        {bars.map((b) => {
          const isSelected = b.monthKey === selected;
          return (
            <View key={b.monthKey} style={styles.column}>
              {b.totalCop !== undefined ? (
                <View
                  style={[
                    styles.bar,
                    { height: `${Math.max(4, (b.totalCop / max) * 100)}%`, backgroundColor: isSelected ? colors.brand.accent : colors.brand.soft },
                  ]}
                />
              ) : (
                <View style={styles.empty} />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {bars.map((b) => (
          <AppText key={b.monthKey} variant="caption" tone={b.monthKey === selected ? 'brand' : 'muted'} align="center" style={styles.column}>
            {shortMonth(b.monthKey)}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  chart: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  empty: {
    width: '70%',
    height: 2,
    backgroundColor: colors.border,
  },
  average: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.text.muted,
  },
  labels: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
}));
