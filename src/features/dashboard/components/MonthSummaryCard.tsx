import { router } from 'expo-router';
import { View } from 'react-native';

import { BudgetBar } from '@/features/budget/components/BudgetBar';
import { budgetStatus } from '@/features/budget/rules';
import { useSession } from '@/features/session/SessionProvider';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon, SectionHeader } from '@/shared/ui';
import { distanceUnit, formatCop, formatCostPerKm, formatKm } from '@/shared/utils/format';

import type { MonthSummary } from '../types';

type MonthSummaryCardProps = {
  month: MonthSummary;
};

/** "Este mes". El costo por km solo aparece si hay datos suficientes (regla §8.7). */
export function MonthSummaryCard({ month }: MonthSummaryCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { kmTraveled, costPerKmCop } = month;
  const { budget } = useSession();
  const budgetNow = budgetStatus(budget, month.totalCop);

  return (
    <View>
      <SectionHeader title="Este mes" icon="expense" caption={month.monthLabel} />
      <Card onPress={() => router.push('/estadisticas')}>
        <View style={styles.totalRow}>
          <View style={styles.totalTexts}>
            <AppText variant="caption" tone="secondary">
              Gastos registrados
            </AppText>
            <AppText variant="display" numeric>
              {formatCop(month.totalCop)}
            </AppText>
            {month.totalCop === 0 && (
              <AppText variant="caption" tone="muted">
                Aún no registras gastos este mes. Usa el botón + para agregar uno.
              </AppText>
            )}
          </View>
          <Icon name="chevronRight" color={colors.text.muted} />
        </View>

        {/* Presupuesto mensual (si el usuario lo configuró en Mi carro). */}
        {budgetNow && (
          <View style={styles.budget}>
            <BudgetBar status={budgetNow} />
          </View>
        )}

        {kmTraveled !== undefined && costPerKmCop !== undefined && (
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <AppText variant="bodyStrong" numeric>
                {formatKm(kmTraveled)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                recorridos
              </AppText>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <AppText variant="bodyStrong" numeric>
                {formatCostPerKm(costPerKmCop)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                por {distanceUnit()}
              </AppText>
            </View>
          </View>
        )}

        {month.previousMonth && (
          <AppText variant="caption" tone="muted" numeric style={styles.previous}>
            En {month.previousMonth.label} gastaste {formatCop(month.previousMonth.totalCop)}
          </AppText>
        )}
      </Card>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalTexts: {
    flex: 1,
  },
  metrics: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  previous: {
    marginTop: spacing.md,
  },
  budget: {
    marginTop: spacing.md,
  },
}));
