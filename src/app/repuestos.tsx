import { router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import {
  findMaintenanceItem,
  maintenanceLabel,
  type ComponentCode,
  type MaintenanceItemCode,
} from '@/features/maintenance/catalog';
import type { ComponentSummary } from '@/features/cars/types';
import { PARTS_FOR_COMPONENT } from '@/features/parts/catalog';
import { CarFitCard } from '@/features/parts/components/CarFitCard';
import { PreviewBanner } from '@/features/parts/components/PreviewBanner';
import { usePartCategories, useSelectedCar } from '@/features/parts/hooks';
import type { PartTypeSummary } from '@/features/parts/repository';
import { partSpecSummary } from '@/features/parts/userSpecs';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, spacing } from '@/shared/theme';
import { ActionRow, Button, Card, FormScreen, SectionHeader, type IconName } from '@/shared/ui';

/** Estado del componente controlado relacionado (si está próximo o pendiente). */
function relatedStatus(code: MaintenanceItemCode, components: ComponentSummary[]): string | undefined {
  const tracks = findMaintenanceItem(code)?.tracks;
  const component = components.find((c) => c.code === tracks);
  if (!component || (component.status !== 'soon' && component.status !== 'due')) return undefined;
  return component.status === 'due' ? `Pendiente · ${component.detail}` : `Próximo · ${component.detail}`;
}

function countText(count: number, noted?: string): string {
  if (count > 0) return count === 1 ? '1 producto para tu carro' : `${count} productos para tu carro`;
  // Sin productos todavía: se muestra lo que anotó el usuario, o se le invita a anotarlo.
  return noted ? `Usa: ${noted}` : 'Toca para anotar lo que usa tu carro';
}

function PartList({ parts, icon }: { parts: PartTypeSummary[]; icon: IconName }) {
  const styles = useStyles();
  const { components } = useAppData();
  const { carSheet } = useSession();
  return (
    <Card flush>
      {parts.map((part, index) => {
        const status = relatedStatus(part.code, components);
        const text = countText(part.productCount, partSpecSummary(part.code, carSheet));
        return (
          <Fragment key={part.code}>
            {index > 0 && <View style={styles.divider} />}
            <ActionRow
              icon={icon}
              label={maintenanceLabel(part.code)}
              description={status ? `${status} · ${text}` : text}
              onPress={() => router.push({ pathname: '/repuestos/[code]', params: { code: part.code } })}
            />
          </Fragment>
        );
      })}
    </Card>
  );
}

/**
 * Repuestos para mi car. La pantalla no conoce carros concretos: pide al catálogo
 * las categorías y productos del carro seleccionado (`CarRef`).
 */
export default function PartsHubScreen() {
  const styles = useStyles();
  const { componente } = useLocalSearchParams<{ componente?: string }>();
  const { profile, components } = useAppData();
  const car = useSelectedCar();
  const categories = usePartCategories(car);

  const relatedCodes = componente ? PARTS_FOR_COMPONENT[componente as ComponentCode] : undefined;
  const relatedTitle = components.find((c) => c.code === componente)?.title;
  const allParts = categories.flatMap((c) => c.parts);
  const related = relatedCodes
    ?.map((code) => allParts.find((p) => p.code === code))
    .filter((p): p is PartTypeSummary => p !== undefined);

  return (
    <FormScreen title="Repuestos para mi carro" closeIcon="back">
      <PreviewBanner />
      <CarFitCard profile={profile} inCatalog={car !== null} />

      {related && related.length > 0 && relatedTitle ? (
        <View>
          <SectionHeader title={`Relacionados con ${relatedTitle.toLowerCase()}`} />
          <PartList parts={related} icon="partsCatalog" />
          <View style={styles.seeAll}>
            <Button label="Ver todos los repuestos" variant="ghost" onPress={() => router.replace('/repuestos')} />
          </View>
        </View>
      ) : (
        categories.map((category) => (
          <View key={category.id}>
            <SectionHeader title={category.label} icon={category.icon} />
            <PartList parts={category.parts} icon={category.icon} />
          </View>
        ))
      )}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  seeAll: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
}));
