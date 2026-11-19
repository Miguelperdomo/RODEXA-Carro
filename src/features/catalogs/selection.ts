import { profileFieldApplies } from '@/features/cars/vehicleOptions';
import type { CarProfile, EnergySource } from '@/features/cars/types';

import { findBrand, findModel, getVariantsByModelAndYear } from './repository';
import { OTHER_BRAND_ID, OTHER_MODEL_ID } from './types';

/** Selección en cascada Marca → Modelo → Año → Combustible → Cilindraje (si aplica). */
export type CarSelection = {
  brandId: string | null;
  /** Solo si la marca es "Otra". */
  otherBrandName: string;
  modelId: string | null;
  /** Solo si el modelo es "Otro modelo" (o la marca es "Otra"). */
  otherModelName: string;
  year: number | null;
  /** null = aún no respondió; "unknown" = eligió "No sé". Nunca se asume gasolina. */
  energySource: EnergySource | null;
  engineCc: number | null;
};

export const EMPTY_SELECTION: CarSelection = {
  brandId: null,
  otherBrandName: '',
  modelId: null,
  otherModelName: '',
  year: null,
  energySource: null,
  engineCc: null,
};

/** El cilindraje que el catálogo conoce para esa combinación (si hay uno solo). */
function knownEngineCc(modelId: string | null, year: number | null): number | null {
  const variants = getVariantsByModelAndYear(modelId, year);
  return variants.length === 1 ? variants[0].engineCc : null;
}

/** Cambiar la marca limpia modelo, año y cilindraje. */
export function selectBrand(current: CarSelection, brandId: string): CarSelection {
  if (brandId === current.brandId) return current;
  return {
    ...EMPTY_SELECTION,
    brandId,
    // Con "Otra" marca no hay catálogo de modelos: el modelo se escribe.
    modelId: brandId === OTHER_BRAND_ID ? OTHER_MODEL_ID : null,
  };
}

/** Cambiar el modelo limpia año y cilindraje (y propone el cilindraje si el catálogo lo tiene). */
export function selectModel(current: CarSelection, modelId: string): CarSelection {
  if (modelId === current.modelId) return current;
  return {
    ...current,
    modelId,
    otherModelName: '',
    year: null,
    engineCc: knownEngineCc(modelId, null),
  };
}

/** Cambiar el año recalcula el cilindraje según las variantes de ese año. */
export function selectYear(current: CarSelection, year: number): CarSelection {
  const variants = getVariantsByModelAndYear(current.modelId, year);
  const stillValid =
    variants.length === 0 || variants.some((v) => v.engineCc === current.engineCc);
  return {
    ...current,
    year,
    engineCc: stillValid ? current.engineCc : knownEngineCc(current.modelId, year),
  };
}

/** Nombres legibles de la selección (para el perfil y el resumen). */
export function selectionNames(selection: CarSelection): { brandName: string; modelName: string } {
  const brandName =
    selection.brandId === OTHER_BRAND_ID
      ? selection.otherBrandName.trim()
      : (findBrand(selection.brandId)?.name ?? '');
  const modelName =
    selection.modelId === OTHER_MODEL_ID
      ? selection.otherModelName.trim()
      : (findModel(selection.modelId)?.name ?? '');
  return { brandName, modelName };
}

/** Selección → campos del perfil del carro. */
export function selectionToProfile(
  selection: CarSelection,
): Pick<CarProfile, 'brandCode' | 'brandName' | 'modelId' | 'model' | 'year' | 'energySource' | 'displacementCc'> {
  const { brandName, modelName } = selectionNames(selection);
  const energySource = selection.energySource ?? 'unknown';
  return {
    brandCode: selection.brandId ?? OTHER_BRAND_ID,
    brandName,
    modelId: selection.modelId ?? undefined,
    model: modelName,
    year: selection.year ?? undefined,
    energySource,
    // Un eléctrico no guarda cilindraje aunque se hubiera elegido antes de cambiar el combustible.
    displacementCc: profileFieldApplies('displacementCc', { energySource }) ? (selection.engineCc ?? undefined) : undefined,
  };
}

/** Perfil existente → selección (para editar). */
export function profileToSelection(profile: CarProfile): CarSelection {
  const brand = findBrand(profile.brandCode);
  const model = findModel(profile.modelId);
  return {
    brandId: brand ? brand.id : OTHER_BRAND_ID,
    otherBrandName: brand ? '' : profile.brandName,
    modelId: model ? model.id : OTHER_MODEL_ID,
    otherModelName: model ? '' : profile.model,
    year: profile.year ?? null,
    // Sin dato (versión anterior) = "No sé": se muestra como sin confirmar, no como gasolina.
    energySource: profile.energySource ?? 'unknown',
    engineCc: profile.displacementCc ?? null,
  };
}
