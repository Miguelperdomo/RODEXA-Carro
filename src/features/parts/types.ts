import type { MaintenanceItemCode } from '@/features/maintenance/catalog';
import type { InfoSource } from '@/shared/types/source';
import type { IconName } from '@/shared/ui';

/**
 * Modelo de datos del catálogo de repuestos. Pensado como tablas separadas
 * (carros · categorías · tipos de repuesto · productos · compatibilidades · fuentes)
 * para pasar luego a SQLite/Supabase sin tocar las pantallas.
 */

/**
 * El carro para el que se consulta. `carId` = id del modelo en el catálogo de carros
 * (p. ej. "chevrolet-onix"). Año, cilindraje y refrigeración permiten diferencias por
 * versión. Con varios carros por usuario, cada uno produce su propia referencia.
 */
export type CarRef = {
  carId: string;
  label: string;
  year?: number;
  displacementCc?: number;
  /** true / false / undefined = sin confirmar. */
  liquidCooling?: boolean;
};

/** Tipo de repuesto = el mismo código del catálogo de mantenimiento (aceite, bujía…). */
export type PartTypeCode = MaintenanceItemCode;

export type PartCategory = {
  id: string;
  label: string;
  icon: IconName;
  order: number;
  partTypes: PartTypeCode[];
};

/** De dónde sale un dato (tipo compartido con mantenimiento y documentos). */
export type { InfoSource };

/** Precio ORIENTATIVO: siempre un rango con fecha y fuente, nunca un precio fijo. */
export type PriceRange = {
  min: number;
  max: number;
  currency: 'COP';
  /** Fecha ISO en que se tomó la referencia. */
  referenceDate: string;
  source?: InfoSource;
};

export type ProductSpec = { label: string; value: string };

/** Un producto existe UNA vez, aunque sea compatible con muchos carros. */
export type PartProduct = {
  id: string;
  partType: PartTypeCode;
  name: string;
  brand: string;
  reference?: string;
  presentation?: string;
  specs: ProductSpec[];
  description?: string;
  price?: PriceRange;
  source?: InfoSource;
  /** Producto de demostración (no real). */
  demo?: boolean;
};

/**
 * Estado de una compatibilidad:
 * - verified: confirmada por una fuente;
 * - specification_match: coincide con las especificaciones conocidas del carro;
 * - unknown: no hay información suficiente → NUNCA se muestra como compatible.
 */
export type CompatibilityStatus = 'verified' | 'specification_match' | 'unknown';

/** Relación CARRO ↔ PRODUCTO (muchos a muchos). */
export type Compatibility = {
  carId: string;
  productId: string;
  status: CompatibilityStatus;
  /** Solo para ciertos años del modelo (si se omite, aplica a todos). */
  years?: { from?: number; to?: number };
  source?: InfoSource;
  note?: string;
};

/** Resultado de la consulta: el producto con su compatibilidad para ESE carro. */
export type CompatibleProduct = { product: PartProduct; compatibility: Compatibility };
