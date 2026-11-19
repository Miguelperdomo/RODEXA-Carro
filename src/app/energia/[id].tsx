import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ENERGY_UNITS } from '@/features/cars/energy';
import {
  consumptionEndingAt,
  costPerKm,
  estimatedChargeEnergy,
  INSUFFICIENT_DATA_MESSAGE,
} from '@/features/energy/compute';
import { ENERGY_META, energyTitle } from '@/features/energy/meta';
import { energyDetailRows } from '@/features/energy/presentation';
import type { EnergyRecord } from '@/features/history/types';
import { useEntryActions } from '@/features/history/useEntryActions';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, Icon, InfoRow } from '@/shared/ui';
import { formatConsumption, formatCop, formatDecimal, formatKm } from '@/shared/utils/format';

/** Detalle de un tanqueo, carga de GNC o carga eléctrica (se abre desde Historial). */
export default function EnergyDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history, profile } = useAppData();
  const record = history.find(
    (e): e is EnergyRecord => (e.kind === 'fuel' || e.kind === 'cng' || e.kind === 'charge') && e.id === id,
  );
  const { edit, remove } = useEntryActions(record);

  if (!record) {
    return (
      <FormScreen title="Registro" closeIcon="back">
        <EmptyState icon="fuel" title="No encontramos este registro" />
      </FormScreen>
    );
  }

  const meta = ENERGY_META[record.kind];
  const unit = ENERGY_UNITS[record.kind].quantity;
  const pair = consumptionEndingAt(history, record.id);
  const pairCostPerKm = pair ? costPerKm(pair.costCop, pair.distanceKm) : undefined;
  const estimate = record.kind === 'charge' ? estimatedChargeEnergy(record, profile.batteryCapacityKwh) : undefined;

  return (
    <FormScreen
      title={energyTitle(record.kind, profile.energySource)}
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button label="Editar" icon="note" fullWidth onPress={edit} />
          <Button label="Eliminar" icon="delete" variant="ghost" fullWidth onPress={remove} />
        </View>
      }>
      <Card>
        {energyDetailRows(record).map((row, index) => (
          <InfoRow key={row.label} label={row.label} value={row.value} divider={index > 0} />
        ))}
      </Card>

      {estimate && (
        <Card>
          <AppText variant="bodyStrong">≈ {formatDecimal(estimate.kwh, 1)} kWh estimados por batería</AppText>
          <AppText variant="caption" tone="secondary">
            Estimado con la capacidad de batería que registraste y los %. No reemplaza los{' '}
            {formatDecimal(record.quantity, 2)} kWh que registraste del cargador y no se usa para el consumo.
          </AppText>
        </Card>
      )}

      <Card tone={pair ? 'highlight' : 'default'}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Icon name={meta.icon} color={colors.brand.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" tone="secondary">
              Consumo de este tramo
            </AppText>
            {pair ? (
              <>
                <AppText variant="heading" numeric>
                  {formatConsumption(pair.kmPerUnit, unit)}
                </AppText>
                <AppText variant="caption" tone="secondary" numeric>
                  {formatKm(pair.distanceKm)} con {formatDecimal(pair.quantity, 2)} {unit} desde {meta.reference}.
                  {pairCostPerKm !== undefined ? ` Costo: ${formatCop(pairCostPerKm)}/km.` : ''}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="bodyStrong">{INSUFFICIENT_DATA_MESSAGE}</AppText>
                <AppText variant="caption" tone="secondary">
                  Se calcula entre este registro y {meta.reference}, ambos con kilometraje.
                </AppText>
              </>
            )}
          </View>
        </View>
      </Card>
      <AppText variant="caption" tone="muted">
        El consumo sale de lo que registraste; el real depende de cómo y por dónde manejes.
      </AppText>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  footer: {
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
