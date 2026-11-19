import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  INCOME_COPY,
  PERIOD_LABEL,
  periodRange,
  sortIncomes,
  summarize,
  workOf,
  type IncomePeriod,
  type IncomeRecord,
} from '@/features/income/income';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, Icon, SectionHeader, SegmentedControl, useToast } from '@/shared/ui';
import { formatDate, parseISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

const PERIODS: { value: IncomePeriod; label: string }[] = [
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

/**
 * Ingresos de mi carro (gratis): Hoy / Semana / Mes con Entró, Gastos y Te quedó, y los
 * últimos 8. Los gastos son los que ya registra (no se anotan dos veces). Al borrar, se
 * puede deshacer.
 */
export default function IncomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const persist = usePersist();
  const toast = useToast();
  const { history } = useAppData();
  const { incomes, setIncomes } = useSession();
  const [period, setPeriod] = useState<IncomePeriod>('month');

  const summary = summarize(incomes, history, periodRange(period, today()));
  const latest = sortIncomes(incomes).slice(0, 8);

  const remove = async (item: IncomeRecord) => {
    const rest = incomes.filter((i) => i.id !== item.id);
    if (!(await persist(() => setIncomes(rest)))) return;
    // Se puede deshacer durante 5 segundos (vuelve el mismo ingreso, con su id).
    toast.show('Ingreso borrado', {
      label: 'Deshacer',
      onPress: () => void persist(() => setIncomes([...rest, item])).then((ok) => ok && toast.show('Ingreso recuperado')),
    });
  };

  return (
    <FormScreen
      title={INCOME_COPY.title}
      closeIcon="back"
      footer={<Button label="Registrar ingreso" icon="add" fullWidth onPress={() => router.push('/registrar/ingreso')} />}>
      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      <Card>
        <AppText variant="captionStrong" tone="secondary">
          {PERIOD_LABEL[period].toUpperCase()}
        </AppText>
        <View style={styles.totals}>
          <Total label="Entró" value={formatCop(summary.incomeCop)} color={colors.status.ok.color} />
          <Total label="Gastos" value={formatCop(summary.expensesCop)} />
          <Total
            label="Te quedó"
            value={`${summary.leftCop < 0 ? '−' : ''}${formatCop(Math.abs(summary.leftCop))}`}
            color={summary.leftCop < 0 ? colors.status.due.color : undefined}
            strong
          />
        </View>
        <AppText variant="caption" tone="muted">
          {summary.leftCop < 0 ? `${INCOME_COPY.negative} ` : ''}
          {INCOME_COPY.disclaimer}
        </AppText>
      </Card>

      {latest.length === 0 ? (
        <EmptyState icon="income" title={INCOME_COPY.emptyTitle} message={INCOME_COPY.emptyMessage} />
      ) : (
        <View>
          <SectionHeader title="Últimos ingresos" />
          <Card flush>
            {latest.map((item, i) => {
              const work = workOf(item.work);
              return (
                <Fragment key={item.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.row}>
                    <View style={styles.icon}>
                      <Icon name={work.icon} size={20} color={colors.brand.accent} />
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="bodyStrong" numeric>
                        {formatCop(item.amountCop)}
                      </AppText>
                      <AppText variant="caption" tone="secondary" numberOfLines={1}>
                        {[work.label, formatDate(parseISODate(item.date)), item.note].filter(Boolean).join(' · ')}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Borrar ingreso de ${formatCop(item.amountCop)}`}
                      onPress={() => void remove(item)}
                      hitSlop={8}>
                      <Icon name="delete" size={20} color={colors.text.muted} />
                    </Pressable>
                  </View>
                </Fragment>
              );
            })}
          </Card>
        </View>
      )}

      <AppText variant="caption" tone="muted">
        {INCOME_COPY.closing}
      </AppText>
    </FormScreen>
  );
}

function Total({ label, value, color, strong }: { label: string; value: string; color?: string; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.total}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'bodyStrong'} color={color} numeric numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  totals: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  total: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
}));
