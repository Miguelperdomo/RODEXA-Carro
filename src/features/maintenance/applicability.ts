import { requirementStatus, type Capabilities, type CapabilityId } from '@/features/cars/capabilities';

import {
  MAINTENANCE_CATEGORIES,
  findMaintenanceItem,
  type CatalogItem,
  type MaintenanceCategoryCode,
  type MaintenanceItem,
} from './catalog';

/**
 * Regla única de aplicabilidad de mantenimientos y componentes:
 * - "applies": todas las capacidades que pide están confirmadas y no depende del modelo.
 * - "maybe": algo es desconocido o depende del modelo → "Depende de tu carro".
 *   Se muestra, pero NUNCA como obligatorio ni como que aplica con certeza.
 * - "not_applicable": alguna capacidad confirma que no existe → no se muestra.
 */
export type Applicability = 'applies' | 'maybe' | 'not_applicable';

type Requirement = { requires?: readonly CapabilityId[]; dependsOnModel?: boolean };

export function applicabilityOf(requirement: Requirement, caps: Capabilities): Applicability {
  const status = requirementStatus(caps, requirement.requires ?? []);
  if (status === 'no') return 'not_applicable';
  if (status === 'unknown' || requirement.dependsOnModel) return 'maybe';
  return 'applies';
}

/** ¿Este mantenimiento puede mostrarse? ("Otro" y los códigos desconocidos siempre). */
export function isItemVisible(code: string, caps: Capabilities): boolean {
  const item = findMaintenanceItem(code);
  return !item || applicabilityOf(item, caps) !== 'not_applicable';
}

export type ApplicableItem = { item: MaintenanceItem; applicability: Exclude<Applicability, 'not_applicable'> };
export type ApplicableCategory = {
  code: MaintenanceCategoryCode;
  label: string;
  icon: (typeof MAINTENANCE_CATEGORIES)[number]['icon'];
  canBeNotApplicable: boolean;
  /** Primero lo que aplica; después lo que depende del carro. */
  items: ApplicableItem[];
};

/**
 * Catálogo filtrado para un vehículo. `keep` = códigos que se muestran aunque no
 * apliquen (p. ej. al corregir un registro viejo que ya los tenía).
 * Las categorías sin ítems visibles no aparecen.
 */
export function applicableCategories(caps: Capabilities, keep: readonly string[] = []): ApplicableCategory[] {
  return MAINTENANCE_CATEGORIES.flatMap((category) => {
    const items = (category.items as readonly CatalogItem[])
      .map((raw): ApplicableItem | null => {
        const item: MaintenanceItem = { ...raw, code: raw.code as MaintenanceItem['code'], category: category.code };
        const applicability = applicabilityOf(item, caps);
        if (applicability !== 'not_applicable') return { item, applicability };
        return keep.includes(item.code) ? { item, applicability: 'maybe' } : null;
      })
      .filter((entry): entry is ApplicableItem => entry !== null)
      .sort((a, b) => Number(a.applicability === 'maybe') - Number(b.applicability === 'maybe'));
    if (items.length === 0) return [];
    return [
      {
        code: category.code,
        label: category.label,
        icon: category.icon,
        canBeNotApplicable: 'canBeNotApplicable' in category && category.canBeNotApplicable === true,
        items,
      },
    ];
  });
}
