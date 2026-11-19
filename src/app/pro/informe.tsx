import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ENERGY_UNITS } from '@/features/cars/energy';
import { INSUFFICIENT_DATA_MESSAGE } from '@/features/energy/compute';
import { energyTitle } from '@/features/energy/meta';
import { ProGate } from '@/features/pro/components/ProGate';
import { StateList } from '@/features/pro/components/StateList';
import { PRO_FEATURES } from '@/features/pro/config';
import { buildVehicleReport, type ReportRow } from '@/features/pro/report';
import { useAppData } from '@/features/session/SessionProvider';
import { CategoryBars } from '@/features/stats/components/CategoryBars';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, Card, FormScreen, Icon, InfoRow, SectionHeader } from '@/shared/ui';
import { formatDate, parseISODate, today } from '@/shared/utils/date';
import { costPerDistanceLabel, formatConsumption, formatCop, formatCostPerKm, formatDecimal, formatKm } from '@/shared/utils/format';

const FEATURE = PRO_FEATURES.find((f) => f.key === 'report')!;

/**
 * Informe completo del vehículo (RODEXA Pro). Vista dentro de la app: exportarlo a PDF
 * requiere una librería que todavía no está instalada.
 */
export default function ProReportScreen() {
  return (
    <FormScreen title="Informe del carro" closeIcon="back">
      <ProGate feature={FEATURE}>
        <ReportContent />
      </ProGate>
    </FormScreen>
  );
}

function ReportContent() {
  const styles = useStyles();
  const data = useAppData();
  const ref = today();
  const report = buildVehicleReport(data, ref);
  const { expenses, year } = report;

  return (
    <View style={styles.content}>
      <View>
        <AppText variant="title">{report.carName}</AppText>
        <AppText variant="caption" tone="secondary">
          Informe generado el {formatDate(ref)} con lo que registraste en RODEXA Carro.
        </AppText>
      </View>

      <Section title="Carro">
        <Rows rows={report.vehicle} />
      </Section>

      <Section title="Kilometraje">
        <InfoRow label="Registrado" value={formatKm(report.odometer.km)} />
        <InfoRow
          label="Última lectura"
          value={`${formatDate(parseISODate(report.odometer.lastReadingDate))} · hace ${report.odometer.daysSinceReading} ${report.odometer.daysSinceReading === 1 ? 'día' : 'días'}`}
          divider
        />
      </Section>

      <View>
        <SectionHeader title="Alertas" />
        {report.alerts.length > 0 ? (
          <StateList items={report.alerts} />
        ) : (
          <Card>
            <AppText tone="secondary">Sin mantenimientos atrasados ni documentos por vencer según tus registros.</AppText>
          </Card>
        )}
      </View>

      <Section title="Mantenimiento">
        {report.maintenance.length > 0 ? <Rows rows={report.maintenance} /> : <Empty text="No hay componentes activos." />}
      </Section>

      <Section title="Documentos">
        {report.documents.length > 0 ? <Rows rows={report.documents} /> : <Empty text="No hay documentos registrados." />}
      </Section>

      <Section title="Gastos">
        {expenses.hasData ? (
          <>
            <InfoRow label="Gasto acumulado" value={formatCop(expenses.accumulatedCop)} />
            <InfoRow
              label="Promedio mensual"
              value={expenses.monthlyAverageCop !== undefined ? formatCop(expenses.monthlyAverageCop) : 'Datos insuficientes'}
              divider
            />
            <InfoRow label="Últimos 12 meses" value={formatCop(year.totalCop)} divider />
            <InfoRow
              label={`${costPerDistanceLabel()} (12 meses)`}
              value={year.costPerKmCop !== undefined ? formatCostPerKm(year.costPerKmCop) : 'Datos insuficientes'}
              divider
            />
            {expenses.topCategory && (
              <InfoRow
                label="Categoría de mayor gasto"
                value={`${expenses.topCategory.label} · ${Math.round(expenses.topCategory.share * 100)} %`}
                divider
              />
            )}
            <View style={styles.bars}>
              <CategoryBars items={expenses.byCategory} />
            </View>
          </>
        ) : (
          <Empty text="Aún no hay gastos registrados." />
        )}
      </Section>

      <Section title="Energía">
        {report.energy.length === 0 ? (
          <Empty text="Energía del carro sin confirmar." />
        ) : (
          report.energy.map((e, i) => {
            const unit = ENERGY_UNITS[e.kind].quantity;
            return (
              <View key={e.kind}>
                <AppText variant="bodyStrong" style={i > 0 ? styles.energyTitle : undefined}>
                  {energyTitle(e.kind, data.profile.energySource)}
                </AppText>
                <InfoRow label="Registros" value={String(e.records)} />
                <InfoRow label="Cantidad" value={`${formatDecimal(e.quantity)} ${unit}`} divider />
                <InfoRow label="Gasto" value={formatCop(e.spentCop)} divider />
                <InfoRow
                  label="Consumo promedio"
                  value={e.consumption.status === 'calculated' ? formatConsumption(e.consumption.kmPerUnit, unit) : INSUFFICIENT_DATA_MESSAGE}
                  divider
                />
                <InfoRow
                  label={costPerDistanceLabel()}
                  value={e.costPerKmCop !== undefined ? formatCostPerKm(e.costPerKmCop) : 'Datos insuficientes'}
                  divider
                />
              </View>
            );
          })
        )}
      </Section>

      <Section title="Historial reciente">
        {report.history.length > 0 ? (
          report.history.map((h, i) => (
            <InfoRow key={`${h.title}-${i}`} label={h.title} value={[h.subtitle, h.trailing].filter(Boolean).join(' · ')} divider={i > 0} />
          ))
        ) : (
          <Empty text="Aún no hay registros." />
        )}
      </Section>

      <View style={styles.pdfNote}>
        <Icon name="info" size={18} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          Por ahora el informe se ve dentro de la app; descargarlo en PDF llegará más adelante. Los gráficos
          mes a mes están en Análisis Pro.
        </AppText>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <SectionHeader title={title} />
      <Card>{children}</Card>
    </View>
  );
}

function Rows({ rows }: { rows: ReportRow[] }) {
  return (
    <>
      {rows.map((r, i) => (
        <InfoRow key={`${r.label}-${i}`} label={r.label} value={r.value} divider={i > 0} />
      ))}
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <AppText tone="secondary">{text}</AppText>;
}

const useStyles = createStyles((colors) => ({
  content: {
    gap: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  bars: {
    marginTop: spacing.lg,
  },
  energyTitle: {
    marginTop: spacing.lg,
  },
  pdfNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
}));
