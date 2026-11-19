import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { CarAvatar } from '@/features/cars/components/CarAvatar';
import { formatPlate, plateColors } from '@/features/cars/plate';
import { useCarPhoto } from '@/features/cars/useCarPhoto';
import { odometerFreshness } from '@/features/odometer/freshness';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';
import { formatDaysAgo, formatKm } from '@/shared/utils/format';

import type { DashboardData } from '../types';

type CarCardProps = {
  car: DashboardData['car'];
  odometer: DashboardData['odometer'];
  /** Preferencia "Mostrar kilometraje estimado" (Configuración → Mantenimiento). */
  showEstimate?: boolean;
  /** Placa registrada (opcional). Sin placa se ofrece agregarla. */
  plate?: string;
  /** Apodo del carro (opcional): si existe, va como título y la marca/modelo debajo. */
  nickname?: string;
  /** Ciudad de matrícula, debajo de la placa (en mayúsculas). */
  plateCity?: string;
  /** Particular (placa amarilla) o servicio público (placa blanca). */
  serviceType?: 'private' | 'public';
};


/**
 * Tarjeta principal. El km registrado es el protagonista; el estimado
 * va aparte, más pequeño, con "~" y la palabra "Estimado" (regla §8.5).
 */
export function CarCard({ car, odometer, showEstimate = true, plate, nickname, plateCity, serviceType }: CarCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { estimate } = odometer;
  const freshness = odometerFreshness(odometer.daysSinceReading);
  const PLATE_COLORS = plateColors(serviceType);
  const carPhoto = useCarPhoto();

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.titleTexts}>
          <AppText variant="heading" tone="inverse">
            {nickname || car.name}
          </AppText>
          <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
            {nickname ? [car.name, car.subtitle].filter(Boolean).join(' · ') : car.subtitle}
          </AppText>
          {plate ? (
            <View
              style={[styles.plate, { backgroundColor: PLATE_COLORS.background, borderColor: PLATE_COLORS.border }]}
              accessible
              accessibilityLabel={`Placa ${plate}${plateCity ? `, matriculada en ${plateCity}` : ''}`}>
              <AppText variant="bodyStrong" color={PLATE_COLORS.text} style={styles.plateText}>
                {formatPlate(plate)}
              </AppText>
              {/* Abajo, la ciudad de matrícula (no "COLOMBIA"). */}
              {plateCity && (
                <AppText variant="tabLabel" color={PLATE_COLORS.text} style={styles.plateCity} numberOfLines={1}>
                  {plateCity}
                </AppText>
              )}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/mi-carro/editar')}
              hitSlop={8}
              style={styles.addPlate}>
              <AppText variant="captionStrong" color={colors.brand.onPrimaryMuted}>
                + Agregar placa
              </AppText>
            </Pressable>
          )}
        </View>
        {/* La foto del carro (opcional): con foto se ve en grande; sin foto, el menú para ponerla. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={carPhoto.photo ? 'Ver la foto de tu carro' : 'Ponerle foto a tu carro (opcional)'}
          onPress={carPhoto.onPhotoPress}
          hitSlop={8}>
          <CarAvatar
            photo={carPhoto.photo}
            size={56}
            radius={radius.pill}
            fallback={<Icon name="car" size={32} color={colors.brand.onPrimaryMuted} />}
          />
        </Pressable>
        {carPhoto.sheet}
      </View>

      <View>
        <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
          Kilometraje
        </AppText>
        <AppText variant="display" tone="inverse" numeric>
          {formatKm(odometer.registeredKm)}
        </AppText>
        <View style={styles.freshnessRow}>
          <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
            Actualizado {formatDaysAgo(odometer.daysSinceReading)}
          </AppText>
          <View style={styles.freshnessPill}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    freshness === 'fresh' ? colors.status.ok.color : colors.status.soon.color,
                },
              ]}
            />
            <AppText variant="captionStrong" tone="inverse">
              {freshness === 'fresh' ? 'Datos actualizados' : 'Requiere actualización'}
            </AppText>
          </View>
        </View>
      </View>

      {showEstimate && (
      <View style={styles.estimatePanel}>
        <Icon name="info" size={sizes.iconSm} color={colors.brand.onPrimaryMuted} />
        {estimate.kind === 'available' ? (
          <View style={styles.estimateTexts}>
            <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
              Referencia estimada
            </AppText>
            <AppText variant="bodyStrong" tone="inverse" numeric>
              ~{formatKm(estimate.km)}
            </AppText>
            <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
              Aproximado según tu ritmo (~{formatKm(estimate.kmPerDay)}/día). No reemplaza tu registro.
            </AppText>
          </View>
        ) : (
          <View style={styles.estimateTexts}>
            <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
              Referencia estimada
            </AppText>
            <AppText variant="bodyStrong" tone="inverse">
              Sin suficiente información
            </AppText>
            <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
              Registra tu kilometraje unas semanas para calcularlo.
            </AppText>
          </View>
        )}
      </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/registrar/kilometraje')}
        style={({ pressed }) => [styles.updateButton, pressed && styles.updateButtonPressed]}>
        <Icon name="odometer" size={sizes.iconSm} color={colors.brand.accent} />
        <AppText variant="bodyStrong" tone="brand">
          Actualizar kilometraje
        </AppText>
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTexts: {
    flex: 1,
  },
  plate: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 2,
  },
  plateText: {
    letterSpacing: 1,
    textAlign: 'center',
  },
  plateCity: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  addPlate: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  freshnessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  freshnessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.onPrimarySubtle,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  estimatePanel: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand.onPrimarySubtle,
  },
  estimateTexts: {
    flex: 1,
    gap: 2,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  updateButtonPressed: {
    backgroundColor: colors.brand.soft,
  },
}));
