import { DEMO_DATA_ENABLED } from '@/config/dev';
import { OTHER_MODEL_ID } from '@/features/catalogs/types';
import { capabilitiesOf, type CapabilityInput, type Tri } from '@/features/cars/capabilities';
import { isItemVisible } from '@/features/maintenance/applicability';
import type { CarProfile } from '@/features/cars/types';

import { findPart } from './catalog';
import { PART_CATEGORIES } from './data/categories';
import { DEMO_COMPATIBILITY } from './data/compatibility.demo';
import { DEMO_PRODUCTS } from './data/products.demo';
import type {
  Compatibility,
  CompatibleProduct,
  CompatibilityStatus,
  CarRef,
  PartCategory,
  PartProduct,
  PartTypeCode,
} from './types';

/**
 * Único punto de acceso al catálogo de repuestos. Las pantallas nunca conocen
 * carros concretos: preguntan por `CarRef` + tipo de repuesto. Hoy lee datos
 * locales; con SQLite/Supabase solo cambia este archivo (y `hooks.ts` si pasa a
 * ser asíncrono).
 */

/**
 * Productos y compatibilidades VERIFICADOS. Hoy no hay ninguno: la lista real está
 * vacía hasta tener fuentes. Los DEMO solo aparecen en desarrollo si se activan a
 * propósito (src/config/dev.ts); en producción, nunca.
 */
const VERIFIED_PRODUCTS: PartProduct[] = [];
const VERIFIED_COMPATIBILITY: Compatibility[] = [];
const PRODUCTS: PartProduct[] = DEMO_DATA_ENABLED ? DEMO_PRODUCTS : VERIFIED_PRODUCTS;
const COMPATIBILITY: Compatibility[] = DEMO_DATA_ENABLED ? DEMO_COMPATIBILITY : VERIFIED_COMPATIBILITY;

/** Mensaje cuando no hay productos verificados para el carro. */
export const NO_VERIFIED_PRODUCTS_MESSAGE =
  'No tenemos productos verificados para este carro todavía. Pronto agregaremos más información.';

/** ¿Hay algún producto en el catálogo? (para decir "todavía no hay productos verificados"). */
export const HAS_PRODUCTS = PRODUCTS.length > 0;

/** Orden de confianza: primero lo verificado. `unknown` nunca se muestra. */
const STATUS_RANK: Record<CompatibilityStatus, number> = { verified: 0, specification_match: 1, unknown: 2 };

const triToBoolean = (value: Tri) => (value === 'yes' ? true : value === 'no' ? false : undefined);

/** Referencia del carro para el catálogo. Sin modelo del catálogo → null (no se adivina). */
export function carRefFromProfile(profile: CarProfile): CarRef | null {
  if (!profile.modelId || profile.modelId === OTHER_MODEL_ID) return null;
  return {
    carId: profile.modelId,
    label: `${profile.brandName} ${profile.model}`.trim(),
    year: profile.year,
    displacementCc: profile.displacementCc,
    liquidCooling: triToBoolean(capabilitiesOf(profile)['engine-coolant']),
  };
}

function yearMatches(compatibility: Compatibility, year: number | undefined): boolean {
  const range = compatibility.years;
  if (!range) return true;
  // Si la compatibilidad depende del año y no sabemos el año, no se confirma.
  if (year === undefined) return false;
  return (range.from === undefined || year >= range.from) && (range.to === undefined || year <= range.to);
}

/** Productos compatibles (confirmados o por especificación) de un tipo de repuesto para ese carro. */
export function getCompatibleProducts(car: CarRef | null, partType: PartTypeCode): CompatibleProduct[] {
  if (!car) return [];
  return COMPATIBILITY.filter(
    (c) => c.carId === car.carId && c.status !== 'unknown' && yearMatches(c, car.year),
  )
    .map((compatibility) => ({
      compatibility,
      product: PRODUCTS.find((p) => p.id === compatibility.productId),
    }))
    .filter((r): r is CompatibleProduct => r.product !== undefined && r.product.partType === partType)
    .sort((a, b) => STATUS_RANK[a.compatibility.status] - STATUS_RANK[b.compatibility.status]);
}

export type PartTypeSummary = { code: PartTypeCode; productCount: number };
export type CategoryWithParts = PartCategory & { parts: PartTypeSummary[] };

/**
 * Categorías disponibles para ese carro, con sus tipos de repuesto y cuántos
 * productos compatibles tiene cada uno. Qué repuesto aplica lo decide la MISMA regla
 * del mantenimiento (Fase B): un eléctrico no ve bujías, aceite de motor ni filtros de
 * combustible. Una categoría sin tipos aplicables no aparece.
 */
export function getPartCategories(car: CarRef | null, profile: CapabilityInput): CategoryWithParts[] {
  const caps = capabilitiesOf(profile);
  return [...PART_CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      ...category,
      parts: category.partTypes
        .filter((code) => findPart(code) !== undefined && isItemVisible(code, caps))
        .map((code) => ({ code, productCount: getCompatibleProducts(car, code).length })),
    }))
    .filter((category) => category.parts.length > 0);
}

export function findPartCategory(partType: PartTypeCode): PartCategory | undefined {
  return PART_CATEGORIES.find((c) => c.partTypes.includes(partType));
}
