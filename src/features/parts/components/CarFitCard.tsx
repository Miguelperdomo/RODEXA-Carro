import { router } from 'expo-router';
import { View } from 'react-native';

import type { CarProfile } from '@/features/cars/types';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon } from '@/shared/ui';

/**
 * "Para tu carro": las recomendaciones dependerán de marca, modelo, año y
 * cilindraje. Si falta alguno, se dice claramente.
 */
export function CarFitCard({
  profile,
  inCatalog = true,
}: {
  profile: CarProfile;
  /** false = el modelo no está en el catálogo: no se confirma ninguna compatibilidad. */
  inCatalog?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const factors = [
    { label: 'Marca', value: profile.brandName },
    { label: 'Modelo', value: profile.model },
    { label: 'Año', value: profile.year?.toString() },
    { label: 'Cilindraje', value: profile.displacementCc ? `${profile.displacementCc} cc` : undefined },
  ];
  const missing = factors.filter((f) => !f.value);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name="car" size={28} color={colors.brand.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" tone="secondary">
            Para tu carro
          </AppText>
          <AppText variant="heading">
            {profile.brandName} {profile.model}
          </AppText>
        </View>
      </View>

      <View style={styles.factors}>
        {factors.map((factor) => (
          <View key={factor.label} style={[styles.factor, !factor.value && styles.factorMissing]}>
            <AppText variant="caption" tone="muted">
              {factor.label}
            </AppText>
            <AppText variant="captionStrong" tone={factor.value ? 'primary' : 'muted'}>
              {factor.value ?? 'Sin registrar'}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="caption" tone="secondary">
        Cada carro puede usar referencias, medidas o aceites diferentes. Las opciones se buscarán con
        estos datos.
      </AppText>

      {!inCatalog && (
        <AppText variant="caption" tone="secondary" style={styles.notInCatalog}>
          Tu modelo todavía no está en el catálogo de repuestos, así que no podemos confirmar compatibilidades.
        </AppText>
      )}

      {missing.length > 0 && (
        <View style={styles.missing}>
          <AppText variant="caption" tone="secondary">
            Completa {missing.map((m) => m.label.toLowerCase()).join(' y ')} para mejores resultados.
          </AppText>
          <Button
            label="Completar datos"
            variant="secondary"
            onPress={() => router.push('/mi-carro/editar')}
          />
        </View>
      )}
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  factor: {
    minWidth: '47%',
    flexGrow: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  factorMissing: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  notInCatalog: {
    marginTop: spacing.sm,
  },
  missing: {
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
}));
