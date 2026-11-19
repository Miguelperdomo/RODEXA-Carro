import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const BAR_AREA = 120;

export type MonthBarPoint = {
  monthKey: string;
  /** undefined = no se puede medir ese mes (se dibuja vacío, nunca como 0). */
  value?: number;
};

type MonthBarsProps = {
  points: MonthBarPoint[];
  format: (value: number) => string;
  /** Texto para un mes sin medida ("Sin datos", "Datos insuficientes"…). */
  emptyText?: string;
};

export const monthShort = (monthKey: string) => MONTHS[Number(monthKey.slice(5, 7)) - 1] ?? '';
export const monthLong = (monthKey: string) =>
  `${MONTH_NAMES[Number(monthKey.slice(5, 7)) - 1] ?? ''} ${monthKey.slice(0, 4)}`;

/**
 * Barras verticales por mes (una sola serie, color de marca). Al tocar un mes se ve su
 * valor arriba; por defecto, el último mes con dato.
 */
export function MonthBars({ points, format, emptyText = 'Sin datos' }: MonthBarsProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const valid = points.filter((p): p is Required<MonthBarPoint> => p.value !== undefined && Number.isFinite(p.value));
  const max = Math.max(...valid.map((p) => p.value), 0);
  const fallback = valid.at(-1)?.monthKey ?? points.at(-1)?.monthKey;
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const current = points.find((p) => p.monthKey === (selected ?? fallback));
  const currentValid = current?.value !== undefined && Number.isFinite(current.value);

  return (
    <View style={styles.root}>
      {current && (
        <View style={styles.header}>
          <AppText variant="caption" tone="secondary">
            {monthLong(current.monthKey)}
          </AppText>
          <AppText variant="heading" numeric tone={currentValid ? 'primary' : 'muted'}>
            {currentValid ? format(current.value as number) : emptyText}
          </AppText>
        </View>
      )}
      <View style={styles.bars}>
        {points.map((p) => {
          const has = p.value !== undefined && Number.isFinite(p.value);
          const height = has && max > 0 ? Math.max(((p.value as number) / max) * BAR_AREA, (p.value as number) > 0 ? 3 : 0) : 0;
          const isSelected = p.monthKey === current?.monthKey;
          return (
            <Pressable
              key={p.monthKey}
              style={styles.column}
              onPress={() => setSelected(p.monthKey)}
              accessibilityRole="button"
              accessibilityLabel={`${monthLong(p.monthKey)}: ${has ? format(p.value as number) : emptyText}`}>
              <View style={styles.barArea}>
                {has ? (
                  <View
                    style={[
                      styles.bar,
                      { height, backgroundColor: isSelected ? colors.brand.accent : colors.brand.primary },
                    ]}
                  />
                ) : (
                  <View style={styles.emptyBar} />
                )}
              </View>
              <AppText variant="caption" tone={isSelected ? 'primary' : 'muted'} style={styles.label}>
                {monthShort(p.monthKey)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  header: {
    gap: 2,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barArea: {
    height: BAR_AREA,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  emptyBar: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 10,
  },
}));
