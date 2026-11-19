import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { maintenanceLabel } from '@/features/maintenance/catalog';
import { USAGE_LABELS } from '@/features/cars/usage';
import { vehicleInfoRows } from '@/features/cars/vehicleOptions';
import { useSession } from '@/features/session/SessionProvider';
import { spacing } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, InfoRow, SectionHeader } from '@/shared/ui';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatCop, formatKm } from '@/shared/utils/format';

const dateText = (iso?: string) => (iso ? formatDate(parseISODate(iso)) : 'Lo agrego después');

export default function OnboardingSummaryScreen() {
  const { draft } = useSession();

  if (!draft) {
    return (
      <FormScreen title="Revisa tus datos" closeIcon="back">
        <EmptyState icon="statusNoData" title="No hay datos para revisar" />
      </FormScreen>
    );
  }

  const { profile, user, maintenance, documents } = draft;
  // En el primer ingreso solo se piden estos datos; el resto se completa en Mi carro.
  const rows = vehicleInfoRows(profile).filter((row) =>
    ['brand', 'model', 'year', 'energy', 'cc', 'plate'].includes(row.key),
  );

  return (
    <FormScreen
      title="Revisa tus datos"
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          {/* Antes de crear: "¿Cómo quieres usar RODEXA?" (Tranqui o Al detalle). */}
          <Button label="Continuar" fullWidth onPress={() => router.push('/estilo')} />
          <Button label="Editar" variant="ghost" fullWidth onPress={() => router.back()} />
        </View>
      }>
      <AppText tone="secondary">
        Revisa que todo esté bien. Podrás cambiar cualquier dato después desde Mi carro.
      </AppText>

      <View>
        <SectionHeader title="Tu carro" icon="car" />
        <Card>
          {rows.map((row, index) => (
            <InfoRow key={row.key} label={row.label} value={row.value} divider={index > 0} />
          ))}
          <InfoRow label="Kilometraje" value={formatKm(draft.km)} divider />
        </Card>
      </View>

      <View>
        <SectionHeader title="Uso" icon="usageMixed" />
        <Card>
          <InfoRow
            label="Uso principal"
            value={profile.usageType ? USAGE_LABELS[profile.usageType] : undefined}
          />
        </Card>
      </View>

      <View>
        <SectionHeader title="Tu información" icon="note" />
        <Card>
          <InfoRow label="Nombre" value={user.name} />
          <InfoRow label="Ciudad" value={user.city} divider />
        </Card>
      </View>

      <View>
        <SectionHeader title="Mantenimiento registrado" icon="maintenance" />
        <Card>
          {maintenance.length === 0 ? (
            <AppText tone="secondary">No registraste mantenimientos recientes.</AppText>
          ) : (
            maintenance.map((m, index) => (
              <InfoRow
                key={`${m.code}-${index}`}
                label={m.code === 'other' ? (m.description ?? 'Otro') : maintenanceLabel(m.code)}
                value={[
                  formatDate(parseISODate(m.date)),
                  m.km !== null ? formatKm(m.km) : 'Km desconocido',
                  m.costCop !== null ? formatCop(m.costCop) : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                divider={index > 0}
              />
            ))
          )}
        </Card>
      </View>

      <View>
        <SectionHeader title="Documentos" icon="document" />
        <Card>
          <InfoRow label="SOAT" value={dateText(documents.soatExpiresAt)} />
          <InfoRow label="Tecnomecánica" value={dateText(documents.rtmExpiresAt)} divider />
        </Card>
      </View>

      {draft.credit && (
        <View>
          <SectionHeader title="Crédito" icon="loan" />
          <Card>
            <InfoRow label="Cuota" value={formatCop(draft.credit.amountCop)} />
            <InfoRow
              label="Cuotas"
              value={`${draft.credit.paidBefore} de ${draft.credit.totalInstallments} pagadas`}
              divider
            />
            <InfoRow label="Día de pago" value={`El ${draft.credit.dayOfMonth} de cada mes`} divider />
          </Card>
        </View>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.xs,
  },
});
