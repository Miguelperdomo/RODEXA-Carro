/**
 * Tipos de los catálogos. Hoy se leen de datos estáticos (`./data`); más adelante
 * vendrán de SQLite/Supabase con la misma forma, sin cambiar las pantallas.
 */

/** Municipio de Colombia (DIVIPOLA del DANE). `id` es su código DANE de 5 dígitos. */
export type City = {
  id: string;
  name: string;
  department: string;
  /** Los 2 primeros dígitos del código DANE. */
  departmentCode: string;
};

export type Department = { code: string; name: string };

export type CarBrand = {
  id: string;
  name: string;
};

export type CarModel = {
  id: string;
  brandId: string;
  name: string;
  /**
   * Cilindraje nominal, solo cuando el nombre comercial lo indica claramente
   * (p. ej. un modelo que solo se vende con motor 1.6 → 1600). Sin dato = el usuario lo elige de la lista general.
   */
  engineCc?: number;
};

/** Variante de un modelo en un año: hoy solo distingue el cilindraje. */
export type CarVariant = {
  id: string;
  modelId: string;
  label: string;
  engineCc: number;
};

/** Años de un modelo. `verified: false` = rango general, no confirmado para ese modelo. */
export type ModelYears = {
  years: number[];
  verified: boolean;
};

/** Ids especiales para no bloquear al usuario cuando algo no está en el catálogo. */
export const OTHER_BRAND_ID = 'other';
export const OTHER_MODEL_ID = 'other';
/**
 * "Otro municipio" del catálogo anterior: ya no se ofrece (la lista oficial está completa),
 * pero quien lo tenía guardado sigue viendo ese texto en su perfil.
 */
export const OTHER_CITY_ID = 'other';
