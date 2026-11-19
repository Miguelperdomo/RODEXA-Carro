import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { budgetStatus } from '@/features/budget/rules';
import { periodRange, summarize } from '@/features/income/income';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { MonthBarsChart } from '@/features/stats/components/MonthBarsChart';
import { monthBars, monthInsights, totalsByMonth } from '@/features/stats/trend';
import { CategoryBars } from '@/features/stats/components/CategoryBars';
import { EnergyBlockCard } from '@/features/stats/components/EnergyBlockCard';
import { SettingsButton } from '@/features/settings/components/SettingsButton';
import { StatTile } from '@/features/stats/components/StatTile';
import { monthStats, statsMonths, yearlyStats } from '@/features/stats/screen';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { INFO_COST_PER_KM_MONTH, INFO_COST_PER_KM_YEAR } from '@/shared/help/infoTexts';
import { AppText, Card, EmptyState, Icon, Screen, SectionHeader, SegmentedControl } from '@/shared/ui';
import { formatDate, formatMonthYear, parseISODate, toISODate, today } from '@/shared/utils/date';
import { costPerDistanceLabel, formatCop, formatCostPerKm, formatKm, traveledLabel } from '@/shared/utils/format';

type StatsTab = 'month' | 'year' | 'records';

const TABS: { value: StatsTab; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'records', label: 'Récords' },
];

function monthLabel(monthKey: string): string {
  const label = formatMonthYear(parseISODate(`${monthKey}-01`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Estadísticas en 3 pestañas, cada una responde una pregunta:
 * - Mes: ¿cuánto me costó este mes? (total, presupuesto, tendencia, en qué se fue, lo que notamos).
 * - Año: ¿cuánto me cuesta tener el carro? (12 meses, promedio, costo por km, categorías).
 * - Récords: mis mejores y peores datos.
 * Lo que no se puede calcular dice "Sin suficiente información", nunca $0.
 */
export default function StatsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { history: entries, profile } = useAppData();
  const { budget, incomes } = useSession();
  const { settings, update } = useSettings();
  // Lo pesado (12 meses, récords, "Tu año") solo se recalcula si cambian los datos o el
  // día; cambiar de mes con las flechas solo recalcula ese mes.
  const dayKey = toISODate(today());
  const referenceDate = parseISODate(dayKey);
  const months = statsMonths(entries, referenceDate);
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(months.length - 1, 0));
  const yearlyData = yearlyStats(entries, profile, dayKey);
  const month = months.length > 0 ? monthStats(entries, profile, months, safeIndex, dayKey) : undefined;
  const tab: StatsTab = settings.statsTab === 'year' || settings.statsTab === 'records' ? settings.statsTab : 'month';
  const setTab = (next: StatsTab) => update({ statsTab: next });

  if (months.length === 0 || !month) {
    return (
      <Screen>
        <EmptyState
          icon="stats"
          title="Aún no hay estadísticas"
          message="Registra tus gastos y kilometraje para ver cuánto te cuesta tu carro."
        />
      </Screen>
    );
  }

  const { year, records, wrappedReady } = yearlyData;
  const comparison = month.comparison;
  const previousName = comparison ? formatMonthYear(parseISODate(`${comparison.previousKey}-01`)).split(' ')[0] : '';
  const totals = totalsByMonth(entries);
  const currentMonthKey = dayKey.slice(0, 7);
  const isCurrentMonth = month.monthKey === currentMonthKey;
  // El presupuesto es del mes en curso.
  const budgetNow = isCurrentMonth ? budgetStatus(budget, month.totalCop) : undefined;
  const income = incomes.length > 0 ? summarize(incomes, entries, periodRange('month', parseISODate(`${month.monthKey}-01`))) : undefined;
  const insights = monthInsights(entries, month.monthKey, month.byCategory);
  const openCategory = (item: { key: string }) => router.push({ pathname: '/historial', params: { categoria: item.key } });

  return (
    <Screen scroll scrollToTopOnTab contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="title" style={styles.flex}>
            Estadísticas
          </AppText>
          <SettingsButton />
        </View>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
        {tab === 'month' && (
          <View style={styles.monthNav}>
            <NavButton icon="back" label="Mes anterior" disabled={safeIndex >= months.length - 1} onPress={() => setIndex(safeIndex + 1)} />
            <AppText variant="bodyStrong" style={styles.monthLabel}>
              {monthLabel(month.monthKey)}
            </AppText>
            <NavButton icon="chevronRight" label="Mes siguiente" disabled={safeIndex === 0} onPress={() => setIndex(safeIndex - 1)} />
          </View>
        )}
      </View>

      {tab === 'month' && (
        <>
          {/* ¿Cuánto gasté? Con la comparación y el presupuesto. */}
          <Card>
            <AppText variant="captionStrong" tone="secondary">
              GASTASTE
            </AppText>
            <AppText variant="display" numeric>
              {formatCop(month.totalCop)}
            </AppText>
            {comparison ? (
              <AppText variant="caption" tone="secondary" numeric>
                {comparison.diffCop === 0
                  ? `Igual que en ${previousName} (${formatCop(comparison.previousTotalCop)})`
                  : `${comparison.diffCop < 0 ? '↓' : '↑'} ${formatCop(Math.abs(comparison.diffCop))}${
                      comparison.percent !== undefined ? ` (${Math.abs(comparison.percent)} %)` : ''
                    } ${comparison.diffCop < 0 ? 'menos' : 'más'} que en ${previousName} (${formatCop(comparison.previousTotalCop)})`}
              </AppText>
            ) : (
              <AppText variant="caption" tone="muted">
                Sin mes anterior para comparar
              </AppText>
            )}
            {!month.hasRecords && (
              <AppText variant="caption" tone="muted">
                Aún no registras nada en el mes.
              </AppText>
            )}
            {budgetNow && (
              <View style={styles.budget}>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(100, budgetNow.percent)}%`,
                        backgroundColor: budgetNow.level === 'over' ? colors.status.due.color : budgetNow.level === 'near' ? colors.status.soon.color : colors.status.ok.color,
                      },
                    ]}
                  />
                </View>
                <AppText variant="caption" tone="secondary" numeric>
                  {budgetNow.percent} % de tu presupuesto ({formatCop(budgetNow.limitCop)})
                </AppText>
              </View>
            )}
          </Card>

          {/* Tendencia: los últimos 6 meses hasta el mes elegido. */}
          <View>
            <SectionHeader title="Últimos 6 meses" />
            <Card>
              <MonthBarsChart bars={monthBars(totals, month.monthKey, 6)} selected={month.monthKey} />
            </Card>
          </View>

          {/* ¿En qué se fue? Tocar una categoría abre sus gastos en Historial. */}
          <View>
            <SectionHeader title="¿En qué se fue?" caption="Toca una para ver sus gastos" />
            <Card>
              {month.byCategory.length > 0 ? (
                <CategoryBars items={month.byCategory} onPress={openCategory} />
              ) : (
                <AppText tone="secondary">Sin gastos registrados en el mes.</AppText>
              )}
            </Card>
          </View>

          {/* Cuatro cuadros clave del mes. */}
          <View style={styles.tiles}>
            <View style={styles.tileRow}>
              <StatTile icon="odometer" label={traveledLabel()} value={month.kmTraveled !== undefined ? formatKm(month.kmTraveled) : undefined} />
              <StatTile
                icon="expense"
                label={costPerDistanceLabel()}
                value={month.costPerKmCop !== undefined ? formatCostPerKm(month.costPerKmCop) : undefined}
                info={INFO_COST_PER_KM_MONTH}
              />
            </View>
            <View style={styles.tileRow}>
              <StatTile
                icon={month.energyTile.icon}
                label={month.energyTile.label}
                value={month.energyTile.valueCop !== undefined ? formatCop(month.energyTile.valueCop) : undefined}
                caption={month.energyTile.caption}
              />
              <StatTile
                icon="maintenance"
                label="Mantenimiento"
                value={month.maintenanceCount > 0 || month.maintenanceCop > 0 ? formatCop(month.maintenanceCop) : undefined}
                caption={`${month.maintenanceCount} ${month.maintenanceCount === 1 ? 'registrado' : 'registrados'}`}
                emptyText="Sin registros en el mes"
              />
            </View>
            <View style={styles.tileRow}>
              <StatTile icon="calendar" label="Promedio diario" value={month.totalCop > 0 ? formatCop(month.dailyAverageCop) : undefined} emptyText="Sin gastos en el mes" />
              <StatTile
                icon="stats"
                label="Promedio mensual"
                value={month.monthlyAverageCop !== undefined ? formatCop(month.monthlyAverageCop) : undefined}
                caption={`${month.monthsWithData} ${month.monthsWithData === 1 ? 'mes' : 'meses'} con datos`}
              />
            </View>
          </View>

          {/* Lo que notamos: frases con tus datos (solo si hay suficientes). */}
          {insights.length > 0 && (
            <Card>
              <View style={styles.insightTitle}>
                <Icon name="recommendation" color={colors.brand.accent} />
                <AppText variant="bodyStrong">Lo que notamos</AppText>
              </View>
              {insights.map((line) => (
                <AppText key={line} tone="secondary" style={styles.insight}>
                  {line}
                </AppText>
              ))}
            </Card>
          )}

          {/* Energía del mes, según el tipo de energía del carro. */}
          {month.energy.map((block) => (
            <EnergyBlockCard key={block.kind} block={block} />
          ))}
          {month.energyUnconfirmed && (
            <Card flush>
              <View style={styles.unconfirmed}>
                <Icon name="info" color={colors.text.secondary} />
                <AppText tone="secondary" style={styles.flex}>
                  Depende de tu carro: confirma su energía en Mi carro para registrar cargas de combustible o energía.
                </AppText>
              </View>
            </Card>
          )}

          {/* Ingresos del mes: solo si registras ingresos. */}
          {income && income.count > 0 && (
            <Card onPress={() => router.push('/ingresos')}>
              <AppText variant="bodyStrong">Ingresos del mes</AppText>
              <AppText tone="secondary" numeric>
                Entró {formatCop(income.incomeCop)} · te quedó {income.leftCop < 0 ? '−' : ''}
                {formatCop(Math.abs(income.leftCop))}
              </AppText>
            </Card>
          )}
        </>
      )}

      {tab === 'year' && (
        <>
          {wrappedReady && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/tu-ano')}
              style={({ pressed }) => [styles.wrapped, pressed && styles.navButtonPressed]}>
              <Icon name="star" color={colors.brand.onPrimary} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong" color={colors.brand.onPrimary}>
                  Tu {referenceDate.getFullYear()} en carro
                </AppText>
                <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
                  Tu año en tarjetas: km, gastos, energía y récords
                </AppText>
              </View>
              <Icon name="chevronRight" color={colors.brand.onPrimary} />
            </Pressable>
          )}

          <View>
            <SectionHeader title="Lo que te costó tu carro" caption={`${monthLabel(year.fromMonth)} – ${monthLabel(year.toMonth)}`} />
            <Card>
              <MonthBarsChart bars={monthBars(totals, currentMonthKey, 12)} selected={currentMonthKey} average={year.monthlyAverageCop} />
              {year.monthlyAverageCop !== undefined && (
                <AppText variant="caption" tone="muted" style={styles.insight}>
                  La línea punteada es tu promedio mensual.
                </AppText>
              )}
            </Card>
          </View>

          <View style={styles.tiles}>
            <View style={styles.tileRow}>
              <StatTile icon="expense" label="Últimos 12 meses" value={formatCop(year.totalCop)} />
              <StatTile
                icon="stats"
                label="Promedio mensual"
                value={year.monthlyAverageCop !== undefined ? formatCop(year.monthlyAverageCop) : undefined}
                caption={`${year.monthsWithExpenses} ${year.monthsWithExpenses === 1 ? 'mes' : 'meses'} con gastos`}
              />
            </View>
            <View style={styles.tileRow}>
              <StatTile
                icon="odometer"
                label={costPerDistanceLabel()}
                value={year.costPerKmCop !== undefined ? formatCostPerKm(year.costPerKmCop) : undefined}
                info={INFO_COST_PER_KM_YEAR}
                caption={
                  year.kmMeasured !== undefined
                    ? `${formatKm(year.kmMeasured)} medidos${year.measuredFrom ? ` desde el ${formatDate(parseISODate(year.measuredFrom))}` : ''}`
                    : undefined
                }
              />
            </View>
          </View>

          {year.byCategory.length > 0 && (
            <View>
              <SectionHeader title="¿En qué se fue el año?" caption="Toca una para ver sus gastos" />
              <Card>
                <CategoryBars items={year.byCategory} onPress={openCategory} />
              </Card>
            </View>
          )}
        </>
      )}

      {tab === 'records' &&
        (records.length > 0 ? (
          <View>
            <SectionHeader title="Récords de tu carro" caption="Según lo que registraste" />
            <View style={styles.tiles}>
              {Array.from({ length: Math.ceil(records.length / 2) }, (_, row) => (
                <View key={row} style={styles.tileRow}>
                  {records.slice(row * 2, row * 2 + 2).map((r) => (
                    <StatTile key={r.key} icon={r.icon} label={r.title} value={r.value} caption={r.detail} />
                  ))}
                  {records.length % 2 === 1 && row === Math.ceil(records.length / 2) - 1 && <View style={styles.flex} />}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <EmptyState icon="star" title="Aún no hay récords" message="Con más registros verás tu mejor consumo, el mes más caro y más." />
        ))}

      <AppText variant="caption" tone="muted">
        Calculado con lo que registraste. Los mantenimientos con costo y los pagos de documentos (en el mes de su
        fecha de pago) cuentan como gasto. El costo por km solo aparece si hay lecturas de kilometraje suficientes
        para medir el mes.
      </AppText>
    </Screen>
  );
}

type NavButtonProps = {
  icon: 'back' | 'chevronRight';
  label: string;
  disabled: boolean;
  onPress: () => void;
};

function NavButton({ icon, label, disabled, onPress }: NavButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
      <Icon name={icon} color={disabled ? colors.border : colors.brand.accent} />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  content: {
    gap: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  header: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
  },
  navButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  navButtonPressed: {
    backgroundColor: colors.brand.soft,
  },
  tiles: {
    gap: spacing.md,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  wrapped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
  },
  unconfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  budget: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  insightTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insight: {
    marginTop: spacing.sm,
  },
  pro: {
    gap: spacing.md,
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
}));
