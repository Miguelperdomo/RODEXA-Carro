import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { findMaintenanceItem, maintenanceLabel } from '@/features/maintenance/catalog';
import { findPart } from '@/features/parts/catalog';
import { CarFitCard } from '@/features/parts/components/CarFitCard';
import { ProductCard } from '@/features/parts/components/ProductCard';
import { MyPartSpecsCard } from '@/features/parts/components/MyPartSpecsCard';
import { PreviewBanner } from '@/features/parts/components/PreviewBanner';
import { WorkshopsSection } from '@/features/parts/components/WorkshopsSection';
import { useCompatibleProducts, useSelectedCar } from '@/features/parts/hooks';
import { findPartCategory, NO_VERIFIED_PRODUCTS_MESSAGE } from '@/features/parts/repository';
import type { PartTypeCode } from '@/features/parts/types';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, maintenanceStatusLabels, radius, spacing, useTheme } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  FormScreen,
  Icon,
  SectionHeader,
  StatusRow,
} from '@/shared/ui';

export default function PartDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { profile, components } = useAppData();
  const part = findPart(code);
  const item = findMaintenanceItem(code);
  const car = useSelectedCar();
  // La pantalla solo pregunta por (car, tipo de repuesto); el catálogo decide qué mostrar.
  const products = useCompatibleProducts(car, code as PartTypeCode);

  if (!part || !item) {
    return (
      <FormScreen title="Repuestos" closeIcon="back">
        <EmptyState icon="partsCatalog" title="No encontramos este repuesto" />
      </FormScreen>
    );
  }

  const label = maintenanceLabel(part.code);
  const category = findPartCategory(part.code);
  // Si el repuesto pone al día un componente controlado, mostramos su estado.
  const component = components.find((c) => c.code === item.tracks && c.enabled);

  return (
    <FormScreen
      title={label}
      closeIcon="back"
      footer={
        <Button
          label="Registrar cuando lo cambies"
          icon="maintenance"
          fullWidth
          onPress={() =>
            router.push({ pathname: '/registrar/mantenimiento', params: { tipo: part.code } })
          }
        />
      }>
      <PreviewBanner />

      <CarFitCard profile={profile} inCatalog={car !== null} />

      <View>
        <SectionHeader title="Lo que necesitas" />
        {component ? (
          <Card flush>
            <StatusRow
              status={component.status}
              title={label}
              icon={component.icon}
              statusLabel={maintenanceStatusLabels[component.status]}
              detail={component.detail}
            />
          </Card>
        ) : (
          <Card>
            <View style={styles.needRow}>
              <View style={styles.needIcon}>
                <Icon name={category?.icon ?? 'partsCatalog'} color={colors.brand.accent} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{label}</AppText>
                <AppText variant="caption" tone="secondary">
                  {category?.label}
                </AppText>
              </View>
            </View>
          </Card>
        )}
      </View>

      <View>
        <SectionHeader title="Lo que usa mi carro" caption="Anótalo una vez y queda guardado en tu celular" />
        <MyPartSpecsCard code={part.code} />
      </View>

      <View>
        <SectionHeader title="Productos para tu carro" caption="Precios orientativos" />
        {products.length > 0 ? (
          <View style={styles.options}>
            {products.map((entry) => (
              <ProductCard key={entry.product.id} item={entry} />
            ))}
          </View>
        ) : (
          <View style={styles.insufficient}>
            <Icon name="warning" size={20} color={colors.status.soon.color} />
            <AppText variant="caption" tone="secondary" style={styles.flex}>
              {NO_VERIFIED_PRODUCTS_MESSAGE}
            </AppText>
          </View>
        )}
        <AppText variant="caption" tone="muted" style={styles.caption}>
          Solo mostramos productos cuya compatibilidad está registrada para tu carro. Verifica siempre
          con tu mecánico o el manual.
        </AppText>
      </View>

      <View style={[styles.notice, part.safetyCritical && styles.noticeSafety]}>
        <Icon
          name={part.safetyCritical ? 'warning' : 'maintenance'}
          size={20}
          color={part.safetyCritical ? colors.status.due.color : colors.text.secondary}
        />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          {part.safetyCritical
            ? 'Este repuesto es de seguridad. Verifica con tu mecánico antes de comprarlo o instalarlo.'
            : 'Verifica con tu mecánico o con el manual de tu carro antes de comprar.'}
        </AppText>
      </View>

      <WorkshopsSection />
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  needRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  needIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insufficient: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.status.soon.background,
  },
  options: {
    gap: spacing.md,
  },
  caption: {
    marginTop: spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeSafety: {
    borderColor: colors.status.due.background,
    backgroundColor: colors.status.due.background,
  },
}));
