import { router } from 'expo-router';
import { View } from 'react-native';

import { ENERGY_META } from '@/features/energy/meta';
import { infoConsumption } from '@/shared/help/infoTexts';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon, SectionHeader } from '@/shared/ui';
import { costPerDistanceLabel, formatConsumption, formatCop, formatCostPerKm, formatDecimal } from '@/shared/utils/format';

import { UNIT_NAMES, type EnergyBlock } from '../screen';
import { StatTile } from './StatTile';

/** Un bloque por energía (combustible, GNC, electricidad), cada uno con SU unidad. */
export function EnergyBlockCard({ block }: { block: EnergyBlock }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const icon = ENERGY_META[block.kind].icon;

  if (block.records === 0 && !block.spentCop) {
    return (
      <View>
        <SectionHeader title={block.title} icon={icon} caption={block.subtitle} />
        <Card>
          <View style={styles.emptyRow}>
            <Icon name={icon} size={28} color={colors.brand.accent} />
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{block.canRecord ? block.emptyTitle : 'Sin registros en el mes'}</AppText>
              <AppText variant="caption" tone="secondary">
                Con tus registros, RODEXA podrá calcular cuánto gastas y cuánto consume tu carro.
              </AppText>
            </View>
          </View>
          {block.canRecord && (
            <View style={styles.emptyAction}>
              <Button
                label={block.actionLabel}
                icon={icon}
                onPress={() => router.push({ pathname: '/registrar/energia', params: { tipo: block.kind } })}
              />
            </View>
          )}
        </Card>
      </View>
    );
  }

  return (
    <View>
      <SectionHeader title={block.title} icon={icon} caption={block.subtitle} />
      <View style={styles.tiles}>
        <View style={styles.row}>
          <StatTile
            icon={icon}
            label={`${block.title} del mes`}
            value={block.spentCop !== undefined ? formatCop(block.spentCop) : undefined}
            caption={block.withoutCost > 0 ? `${block.withoutCost} sin costo registrado` : undefined}
          />
          <StatTile
            icon="liters"
            label="Cantidad cargada"
            value={block.quantity !== undefined ? `${formatDecimal(block.quantity)} ${block.unit}` : undefined}
          />
        </View>
        <View style={styles.row}>
          <StatTile
            icon="receipt"
            label="Promedio por carga"
            value={block.averagePerRecordCop !== undefined ? formatCop(block.averagePerRecordCop) : undefined}
          />
          <StatTile
            icon="pricePerLiter"
            label={`Precio promedio por ${UNIT_NAMES[block.unit]}`}
            value={block.avgUnitPriceCop !== undefined ? formatCop(block.avgUnitPriceCop) : undefined}
          />
        </View>
        <View style={styles.row}>
          <StatTile
            icon="odometer"
            label="Consumo estimado"
            info={infoConsumption(block.kind)}
            value={block.consumption ? formatConsumption(block.consumption.kmPerUnit, block.consumption.unit) : undefined}
            emptyText={block.consumptionMessage}
          />
          <StatTile
            icon="expense"
            label={costPerDistanceLabel()}
            value={block.costPerKmCop !== undefined ? formatCostPerKm(block.costPerKmCop) : undefined}
          />
        </View>
      </View>
      <AppText variant="caption" tone="muted" style={styles.note}>
        {block.note}
      </AppText>
    </View>
  );
}

const useStyles = createStyles(() => ({
  flex: {
    flex: 1,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyAction: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  tiles: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  note: {
    marginTop: spacing.sm,
  },
}));
