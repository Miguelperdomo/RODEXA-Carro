import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ENERGY_UNITS } from '@/features/cars/energy';
import { INSUFFICIENT_DATA_MESSAGE } from '@/features/energy/compute';
import { energyTitle } from '@/features/energy/meta';
import { describeEntry } from '@/features/history/presentation';
import {
  analysisEnergyKinds,
  analyzeEnergy,
  analyzeExpenses,
  changeBetween,
  comparePeriods,
  firstActivityMonth,
  maintenanceHistory,
  monthKeyOf,
  type EnergyAnalysis,
  type PeriodComparison,
} from '@/features/pro/analytics';
import { MonthBars, monthLong } from '@/features/pro/components/MonthBars';
import { ProGate } from '@/features/pro/components/ProGate';
import { PRO_FEATURES } from '@/features/pro/config';
import { useAppData } from '@/features/session/SessionProvider';
import { CategoryBars } from '@/features/stats/components/CategoryBars';
import { StatTile } from '@/features/stats/components/StatTile';
import { computeMonthStats, computeRollingYearStats } from '@/features/stats/compute';
import { createStyles, spacing } from '@/shared/theme';
import { ActionRow, AppText, Card, EmptyState, FormScreen, InfoRow, SectionHeader, SegmentedControl } from '@/shared/ui';
import { today } from '@/shared/utils/date';
import { costPerDistanceLabel, distanceUnit, formatConsumption, formatCop, formatCostPerKm, formatDecimal, formatKm } from '@/shared/utils/format';

type Vista = 'resumen' | 'gastos' | 'energia' | 'comparar';
const VIEWS: { value: Vista; label: string }[] = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'energia', label: 'Energía' },
  { value: 'comparar', label: 'Comparar' },
];

const STATS_FEATURE = PRO_FEATURES.find((f) => f.key === 'advanced_stats')!;

/** Estadísticas avanzadas, gastos, energía y comparación de períodos (RODEXA Pro). */
export default function ProAnalysisScreen() {
  const { vista } = useLocalSearchParams<{ vista?: string }>();
  const initial = VIEWS.some((v) => v.value === vista) ? (vista as Vista) : 'resumen';
  const [view, setView] = useState<Vista>(initial);
  const styles = useStyles();

  return (
    <FormScreen title="Análisis Pro" closeIcon="back">
      <ProGate feature={STATS_FEATURE}>
        <View style={styles.content}>
          <SegmentedControl<Vista> options={VIEWS} value={view} onChange={setView} />
          {view === 'resumen' && <Summary />}
          {view === 'gastos' && <Expenses />}
          {view === 'energia' && <Energy />}
          {view === 'comparar' && <Compare />}
        </View>
      </ProGate>
    </FormScreen>
  );
}

const NO_DATA = (
  <EmptyState
    icon="stats"
    title="Aún no hay datos para analizar"
    message="Registra tus gastos, tus cargas de combustible o energía y tu kilometraje: el análisis aparece con tus propios datos."
  />
);

/** Valor del mes, o "sin datos" si el mes es anterior a tu primer registro. */
const fromFirst = (first: string | undefined) => (monthKey: string, value: number | undefined) =>
  first !== undefined && monthKey >= first ? value : undefined;

function Summary() {
  const styles = useStyles();
  const { history, profile } = useAppData();
  const ref = today();
  const expenses = analyzeExpenses(history, ref);
  const maintenance = maintenanceHistory(history);
  const month = computeMonthStats(history, monthKeyOf(ref), ref);
  const year = computeRollingYearStats(history, ref);
  const first = firstActivityMonth(history);
  const inRange = fromFirst(first);
  if (history.length === 0) return NO_DATA;

  return (
    <>
      <View style={styles.tiles}>
        <View style={styles.tileRow}>
          <StatTile icon="expense" label="Gasto acumulado" value={formatCop(expenses.accumulatedCop)} caption="Desde tu primer registro" />
          <StatTile
            icon="stats"
            label="Promedio mensual"
            value={expenses.monthlyAverageCop !== undefined ? formatCop(expenses.monthlyAverageCop) : undefined}
            caption={`${expenses.monthsCovered} ${expenses.monthsCovered === 1 ? 'mes' : 'meses'}`}
          />
        </View>
        <View style={styles.tileRow}>
          <StatTile icon="calendar" label="Últimos 12 meses" value={formatCop(expenses.last12Cop)} />
          <StatTile
            icon="warning"
            label="Mes de mayor gasto"
            value={expenses.highestMonth ? formatCop(expenses.highestMonth.totalCop) : undefined}
            caption={expenses.highestMonth ? monthLong(expenses.highestMonth.monthKey) : undefined}
            emptyText="Sin gastos registrados"
          />
        </View>
        <View style={styles.tileRow}>
          <StatTile icon="calendar" label="Promedio diario" value={formatCop(month.dailyAverageCop)} caption="Este mes" />
          <StatTile
            icon="odometer"
            label={costPerDistanceLabel()}
            value={year.costPerKmCop !== undefined ? formatCostPerKm(year.costPerKmCop) : undefined}
            caption={year.kmTraveled !== undefined ? `Últimos 12 meses · ${formatKm(year.kmTraveled)}` : 'Últimos 12 meses'}
            emptyText="Datos insuficientes para calcularlo"
          />
        </View>
      </View>

      <View>
        <SectionHeader title="Gastos mensuales" caption="Toca un mes para ver su valor" />
        <Card>
          <MonthBars
            points={expenses.series.map((p) => ({ monthKey: p.monthKey, value: inRange(p.monthKey, p.totalCop) }))}
            format={formatCop}
            emptyText="Sin registros"
          />
        </Card>
      </View>

      <View>
        <SectionHeader title="Costo por kilómetro" caption="Todo lo gastado en el mes ÷ km recorridos" />
        <Card>
          <MonthBars
            points={expenses.series.map((p) => ({ monthKey: p.monthKey, value: p.costPerKmCop }))}
            format={(v) => `${formatCostPerKm(v)} por ${distanceUnit()}`}
            emptyText="Datos insuficientes"
          />
          <AppText variant="caption" tone="muted" style={styles.note}>
            Solo se calcula en los meses con lecturas de kilometraje suficientes (al inicio y al final del mes).
          </AppText>
        </Card>
      </View>

      <View>
        <SectionHeader title="Historial de mantenimiento" />
        <Card>
          <InfoRow label="Mantenimientos registrados" value={String(maintenance.count)} />
          <InfoRow label="Total con costo" value={formatCop(maintenance.totalCop)} divider />
          {maintenance.withoutCost > 0 && (
            <InfoRow label="Sin costo registrado" value={String(maintenance.withoutCost)} divider />
          )}
        </Card>
        {maintenance.entries.length > 0 && (
          <Card flush style={styles.list}>
            {maintenance.entries.slice(0, 5).map((entry, i) => {
              const view = describeEntry(entry, profile.energySource);
              return (
                <View key={entry.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <ActionRow icon={view.icon} label={view.title} description={[view.subtitle, view.trailing].filter(Boolean).join(' · ')} onPress={() => router.push('/historial')} />
                </View>
              );
            })}
          </Card>
        )}
      </View>
    </>
  );
}

function Expenses() {
  const styles = useStyles();
  const { history } = useAppData();
  const ref = today();
  const expenses = analyzeExpenses(history, ref);
  const month = comparePeriods(history, ref)[0];
  const inRange = fromFirst(firstActivityMonth(history));
  if (!expenses.hasData) {
    return (
      <EmptyState
        icon="expense"
        title="Aún no hay gastos registrados"
        message="Las cargas de combustible o energía, los mantenimientos y los documentos con valor cuentan como gasto."
      />
    );
  }
  const monthChange = changeBetween(month.current.metrics.totalCop, month.previous.metrics.totalCop);

  return (
    <>
      <View style={styles.tiles}>
        <View style={styles.tileRow}>
          <StatTile icon="expense" label="Gasto total" value={formatCop(expenses.accumulatedCop)} caption="Desde tu primer registro" />
          <StatTile
            icon="stats"
            label="Promedio mensual"
            value={expenses.monthlyAverageCop !== undefined ? formatCop(expenses.monthlyAverageCop) : undefined}
          />
        </View>
        <View style={styles.tileRow}>
          <StatTile
            icon={expenses.topCategory?.icon ?? 'expense'}
            label="Mayor gasto"
            value={expenses.topCategory?.label}
            caption={
              expenses.topCategory
                ? `${formatCop(expenses.topCategory.amountCop)} · ${Math.round(expenses.topCategory.share * 100)} % del total`
                : undefined
            }
          />
          <StatTile
            icon="calendar"
            label="Este mes vs. anterior"
            value={month.enough && monthChange ? `${monthChange.diff > 0 ? '↑' : monthChange.diff < 0 ? '↓' : '='} ${formatCop(Math.abs(monthChange.diff))}` : undefined}
            caption={month.enough && monthChange?.percent !== undefined ? `${Math.abs(monthChange.percent)} % ${monthChange.diff >= 0 ? 'más' : 'menos'}` : undefined}
            emptyText="Datos insuficientes para comparar"
          />
        </View>
      </View>

      <View>
        <SectionHeader title="Distribución" caption="Todo lo que registraste, por categoría" />
        <Card>
          <CategoryBars items={expenses.byCategory} />
        </Card>
      </View>

      <View>
        <SectionHeader title="Evolución" caption="Últimos 12 meses" />
        <Card>
          <MonthBars
            points={expenses.series.map((p) => ({ monthKey: p.monthKey, value: inRange(p.monthKey, p.totalCop) }))}
            format={formatCop}
            emptyText="Sin registros"
          />
        </Card>
      </View>

      <AppText variant="caption" tone="muted">
        Cada gasto cuenta una vez, en su fecha de pago. Lavado, parqueadero, multas y accesorios están en
        “Otros gastos”. La licencia de conducción es del conductor y no cuenta como gasto del carro.
      </AppText>
    </>
  );
}

function Energy() {
  const { history, profile } = useAppData();
  const ref = today();
  const kinds = analysisEnergyKinds(profile, history);
  if (kinds.length === 0) {
    return (
      <EmptyState
        icon="fuel"
        title="Confirma la energía de tu carro"
        message="Con la energía confirmada (gasolina, diésel, GNC, eléctrico o híbrido) verás el análisis que corresponde."
      />
    );
  }
  return (
    <>
      {kinds.map((kind) => (
        <EnergyCard key={kind} analysis={analyzeEnergy(history, kind, ref)} title={energyTitle(kind, profile.energySource)} />
      ))}
      <AppText variant="caption" tone="muted">
        El consumo solo se calcula entre registros comparables (tanque lleno con tanque lleno, carga completa con
        carga completa, o cargas que terminan en el mismo %). Nada se estima ni se completa.
      </AppText>
    </>
  );
}

function EnergyCard({ analysis, title }: { analysis: EnergyAnalysis; title: string }) {
  const styles = useStyles();
  const { history } = useAppData();
  const unit = ENERGY_UNITS[analysis.kind].quantity;
  const first = history.filter((e) => e.kind === analysis.kind).map((e) => e.date).sort()[0]?.slice(0, 7);
  const inRange = fromFirst(first);

  return (
    <View>
      <SectionHeader title={title} caption={`${analysis.records} ${analysis.records === 1 ? 'registro' : 'registros'}`} />
      {analysis.records === 0 ? (
        <Card>
          <AppText tone="secondary">Aún no hay registros de este tipo.</AppText>
        </Card>
      ) : (
        <View style={styles.tiles}>
          <View style={styles.tileRow}>
            <StatTile
              icon="odometer"
              label="Consumo promedio"
              value={analysis.consumption.status === 'calculated' ? formatConsumption(analysis.consumption.kmPerUnit, unit) : undefined}
              caption={analysis.consumption.status === 'calculated' ? `${analysis.consumption.pairs} ${analysis.consumption.pairs === 1 ? 'tramo' : 'tramos'} comparables` : undefined}
              emptyText={INSUFFICIENT_DATA_MESSAGE}
            />
            <StatTile
              icon="expense"
              label={costPerDistanceLabel()}
              value={analysis.costPerKmCop !== undefined ? formatCostPerKm(analysis.costPerKmCop) : undefined}
              emptyText="Datos insuficientes para calcularlo"
            />
          </View>
          <View style={styles.tileRow}>
            <StatTile
              icon="pricePerLiter"
              label="Precio promedio"
              value={analysis.avgUnitPriceCop !== undefined ? `${formatCop(analysis.avgUnitPriceCop)} / ${unit}` : undefined}
              emptyText="Sin precios registrados"
            />
            <StatTile icon="liters" label="Cantidad registrada" value={`${formatDecimal(analysis.quantity)} ${unit}`} />
          </View>
          <View style={styles.tileRow}>
            <StatTile icon="receipt" label="Gasto total" value={formatCop(analysis.spentCop)} caption={analysis.withoutCost > 0 ? `${analysis.withoutCost} sin costo registrado` : undefined} />
            <StatTile
              icon="calendar"
              label="Gasto mensual"
              value={analysis.monthlyAverageCop !== undefined ? formatCop(analysis.monthlyAverageCop) : undefined}
              caption="Promedio"
              emptyText="Sin costos registrados"
            />
          </View>
          <Card>
            <AppText variant="bodyStrong">Gasto por mes</AppText>
            <MonthBars
              points={analysis.series.map((p) => ({ monthKey: p.monthKey, value: inRange(p.monthKey, p.spentCop) }))}
              format={formatCop}
              emptyText="Sin registros"
            />
          </Card>
          <Card>
            <AppText variant="bodyStrong">Evolución del consumo</AppText>
            <MonthBars
              points={analysis.series.map((p) => ({ monthKey: p.monthKey, value: p.kmPerUnit }))}
              format={(v) => formatConsumption(v, unit)}
              emptyText="Datos insuficientes"
            />
          </Card>
        </View>
      )}
    </View>
  );
}

function Compare() {
  const { history } = useAppData();
  if (history.length === 0) return NO_DATA;
  return (
    <>
      {comparePeriods(history, today()).map((period) => (
        <PeriodCard key={period.months} period={period} />
      ))}
      <AppText variant="caption" tone="muted">
        Los períodos actuales incluyen el mes en curso. Solo se compara cuando tus registros cubren también el
        período anterior.
      </AppText>
    </>
  );
}

function PeriodCard({ period }: { period: PeriodComparison }) {
  const styles = useStyles();
  const { current, previous } = period;
  const range = (from: string, to: string) => (from === to ? monthLong(from) : `${monthLong(from)} – ${monthLong(to)}`);
  const money = (value: number | undefined) => (value !== undefined ? formatCop(value) : 'Datos insuficientes');
  const row = (label: string, a: number | undefined, b: number | undefined, format: (v: number | undefined) => string, divider = true) => {
    const change = changeBetween(a, b);
    const changeText =
      change === undefined
        ? ''
        : change.diff === 0
          ? ' · igual'
          : ` · ${change.diff > 0 ? '↑' : '↓'}${change.percent !== undefined ? ` ${Math.abs(change.percent)} %` : ''}`;
    return <InfoRow label={label} value={`${format(a)} (antes ${format(b)})${changeText}`} divider={divider} />;
  };

  return (
    <View>
      <SectionHeader title={period.label} caption={range(current.fromMonth, current.toMonth)} />
      <Card>
        {!period.enough ? (
          <AppText tone="secondary">
            Datos insuficientes para comparar: necesitas registros desde {monthLong(previous.fromMonth)}.
          </AppText>
        ) : (
          <>
            {row('Gastos', current.metrics.totalCop, previous.metrics.totalCop, money, false)}
            {row('Energía', current.metrics.energyCop, previous.metrics.energyCop, money)}
            {row('Mantenimiento', current.metrics.maintenanceCop, previous.metrics.maintenanceCop, money)}
            {row(costPerDistanceLabel(), current.metrics.costPerKmCop, previous.metrics.costPerKmCop, (v) => (v !== undefined ? formatCostPerKm(v) : 'Datos insuficientes'))}
            {row('Registros', current.metrics.records, previous.metrics.records, (v) => String(v ?? 0))}
            <AppText variant="caption" tone="muted" style={styles.note}>
              Antes: {range(previous.fromMonth, previous.toMonth)}
            </AppText>
          </>
        )}
      </Card>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  content: {
    gap: spacing.xl,
  },
  tiles: {
    gap: spacing.md,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  note: {
    marginTop: spacing.sm,
  },
  list: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
}));
