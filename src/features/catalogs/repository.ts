import { DEPARTMENTS, LEGACY_CITY_IDS, MUNICIPALITIES } from './data/colombia';
import { CAR_BRANDS } from './data/carBrands';
import { CAR_MODELS } from './data/carModels';
import { GENERIC_ENGINE_SIZES, GENERIC_YEAR_SPAN, MODEL_YEARS } from './data/carYears';
import {
  OTHER_BRAND_ID,
  type City,
  type Department,
  type ModelYears,
  type CarBrand,
  type CarModel,
  type CarVariant,
} from './types';

/**
 * Único punto de acceso a los catálogos. Hoy lee datos estáticos; en la etapa
 * de base de datos solo cambia este archivo (y `hooks.ts` si pasa a ser asíncrono).
 */

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, 'es');

/** Los 33 departamentos (incluida Bogotá D.C.), en orden alfabético. */
export function getDepartments(): readonly Department[] {
  return DEPARTMENTS;
}

const departmentName = (code: string) => DEPARTMENTS.find((d) => d.code === code)?.name;

const toCity = ([id, name]: readonly [string, string]): City => {
  const departmentCode = id.slice(0, 2);
  return { id, name, departmentCode, department: departmentName(departmentCode) ?? '' };
};

/** Solo los municipios del departamento elegido, por nombre (sin departamento → ninguno). */
export function getMunicipalities(departmentCode: string | null | undefined): City[] {
  if (!departmentCode) return [];
  return MUNICIPALITIES.filter(([id]) => id.startsWith(departmentCode))
    .map(toCity)
    .sort(byName);
}

/**
 * Municipio por su código DANE o por el id del catálogo anterior ("medellin"…), para que
 * nadie pierda la ciudad que guardó. Desconocido → undefined (nunca se inventa uno).
 */
export function findCity(id: string | null | undefined): City | undefined {
  if (!id) return undefined;
  const code = LEGACY_CITY_IDS[id] ?? id;
  const row = MUNICIPALITIES.find(([c]) => c === code);
  return row ? toCity(row) : undefined;
}

/** Marcas en orden del catálogo, con "Otra" al final. */
export function getBrands(): CarBrand[] {
  return [...CAR_BRANDS, { id: OTHER_BRAND_ID, name: 'Otra' }];
}

export function findBrand(id: string | null | undefined): CarBrand | undefined {
  return getBrands().find((b) => b.id === id);
}

/** Solo los modelos de la marca elegida (nunca un listado gigante). */
export function getModelsByBrand(brandId: string | null | undefined): CarModel[] {
  if (!brandId) return [];
  return CAR_MODELS.filter((m) => m.brandId === brandId).sort(byName);
}

export function findModel(id: string | null | undefined): CarModel | undefined {
  return CAR_MODELS.find((m) => m.id === id);
}

/** Años del modelo: verificados si existen; si no, rango general (más reciente primero). */
export function getYearsByModel(modelId: string | null | undefined, currentYear: number): ModelYears {
  const verified = modelId ? MODEL_YEARS[modelId] : undefined;
  if (verified && verified.length > 0) {
    return { years: [...verified].sort((a, b) => b - a), verified: true };
  }
  const newest = currentYear + 1; // modelos del año siguiente ya a la venta
  return {
    years: Array.from({ length: GENERIC_YEAR_SPAN }, (_, i) => newest - i),
    verified: false,
  };
}

/**
 * Variantes (cilindraje) de un modelo en un año. Hoy el año no cambia nada:
 * se usa el cilindraje del modelo si el catálogo lo tiene. Lista vacía = sin dato.
 */
export function getVariantsByModelAndYear(
  modelId: string | null | undefined,
  _year: number | null,
): CarVariant[] {
  const model = findModel(modelId);
  if (!model?.engineCc) return [];
  return [
    { id: `${model.id}-${model.engineCc}`, modelId: model.id, label: `${model.engineCc} cc`, engineCc: model.engineCc },
  ];
}

/** Lista general de cilindrajes para cuando el modelo no lo indica. */
export function getEngineSizes(): number[] {
  return GENERIC_ENGINE_SIZES;
}
