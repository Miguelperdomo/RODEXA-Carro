import { router } from 'expo-router';
import { View } from 'react-native';

import { needsEnergyConfirmation } from '@/features/cars/capabilities';
import { sheetGroupsFor } from '@/features/cars/sheet';
import { USAGE_LABELS } from '@/features/cars/usage';
import { vehicleInfoRows, vehicleLabels } from '@/features/cars/vehicleOptions';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import { notedParts } from '@/features/parts/userSpecs';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, InfoRow, SectionHeader } from '@/shared/ui';
import { formatKm } from '@/shared/utils/format';

/**
 * Ficha del carro: los datos del vehículo que registraste (solo los que le aplican
 * según su energía) y lo que anotaste para tenerlo a mano. Nada se completa solo.
 */
export default function CarSheetScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { profile, odometer } = useAppData();
  const { carSheet } = useSession();
  const rows = vehicleInfoRows(profile).filter((r) => !['brand', 'model', 'year', 'variant'].includes(r.key));
  // Solo lo que el usuario ya anotó (sin campos vacíos de relleno).
  const notes = sheetGroupsFor(profile, carSheet)
    .map((g) => ({ ...g, fields: g.fields.filter((f) => carSheet[f.key]?.trim()) }))
    .filter((g) => g.fields.length > 0);
  const parts = notedParts(carSheet);
  const title = [profile.brandName, profile.model].filter(Boolean).join(' ');
  const subtitle = [profile.variantName, profile.year?.toString()].filter(Boolean).join(' · ');

  return (
    <FormScreen title="Ficha del carro" closeIcon="back">
      <Card>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Icon name="car" size={28} color={colors.brand.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">{title || 'Mi carro'}</AppText>
            {subtitle !== '' && <AppText tone="secondary">{subtitle}</AppText>}
            <AppText variant="caption" tone="muted">
              {vehicleLabels.energy(profile.energySource)} · {formatKm(odometer.registeredKm)} registrados
            </AppText>
          </View>
        </View>
      </Card>

      {needsEnergyConfirmation(profile) && (
        <AppText variant="caption" tone="secondary">
          Confirma el combustible o la energía para ver solo los datos que aplican a tu carro.
        </AppText>
      )}

      <View>
        <SectionHeader title="Datos del carro" />
        <Card>
          {rows.map((row, index) => (
            <InfoRow key={row.key} label={row.label} value={row.value} divider={index > 0} />
          ))}
          <InfoRow
            label="Uso principal"
            value={profile.usageType ? USAGE_LABELS[profile.usageType] : undefined}
            divider
          />
          <View style={styles.action}>
            <Button
              label="Editar datos del carro"
              icon="note"
              variant="secondary"
              fullWidth
              onPress={() => router.push('/mi-carro/editar')}
            />
          </View>
        </Card>
      </View>

      <View>
        <SectionHeader title="Lo que anotaste" caption="Solo en tu celular" />
        <Card>
          {notes.length === 0 ? (
            <AppText tone="secondary">
              Aún no anotas datos como el aceite que usa, la medida de las llantas o el número de chasis.
            </AppText>
          ) : (
            notes.flatMap((group) => group.fields).map((field, index) => (
              <InfoRow key={field.key} label={field.label} value={carSheet[field.key]} divider={index > 0} />
            ))
          )}
          <View style={styles.action}>
            <Button
              label={notes.length === 0 ? 'Anotar datos' : 'Editar lo que anotaste'}
              icon="note"
              variant="secondary"
              fullWidth
              onPress={() => router.push('/mi-carro/ficha-editar')}
            />
          </View>
        </Card>
      </View>

      <View>
        <SectionHeader title="Repuestos que usa mi carro" caption="Lo que anotaste en Repuestos" />
        <Card>
          {parts.length === 0 ? (
            <AppText tone="secondary">
              Aún no anotas qué usa tu carro: el aceite, los filtros, las pastillas de freno, las llantas… Tenerlo aquí
              te sirve cuando vas al taller o a comprar.
            </AppText>
          ) : (
            parts.map((part, index) => (
              <InfoRow key={part.code} label={maintenanceLabel(part.code)} value={part.summary} divider={index > 0} />
            ))
          )}
          <View style={styles.action}>
            <Button
              label={parts.length === 0 ? 'Anotar repuestos' : 'Ver o editar repuestos'}
              icon="partsCatalog"
              variant="secondary"
              fullWidth
              onPress={() => router.push('/repuestos')}
            />
          </View>
        </Card>
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  action: {
    marginTop: spacing.md,
  },
}));
