import { useMemo } from 'react';

import {
  getBrands,
  getDepartments,
  getEngineSizes,
  getMunicipalities,
  getModelsByBrand,
  getVariantsByModelAndYear,
  getYearsByModel,
} from './repository';

/**
 * Lo que consumen las pantallas. Si en el futuro el repositorio pasa a ser
 * asíncrono (SQLite/Supabase), el cambio queda aquí y no en los componentes.
 */
export const useDepartments = () => useMemo(() => getDepartments(), []);
export const useMunicipalities = (departmentCode: string | null) =>
  useMemo(() => getMunicipalities(departmentCode), [departmentCode]);
export const useBrands = () => useMemo(() => getBrands(), []);
export const useModels = (brandId: string | null) =>
  useMemo(() => getModelsByBrand(brandId), [brandId]);
export const useYears = (modelId: string | null) =>
  useMemo(() => getYearsByModel(modelId, new Date().getFullYear()), [modelId]);
export const useVariants = (modelId: string | null, year: number | null) =>
  useMemo(() => getVariantsByModelAndYear(modelId, year), [modelId, year]);
export const useEngineSizes = () => useMemo(() => getEngineSizes(), []);
