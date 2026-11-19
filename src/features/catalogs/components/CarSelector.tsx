import type { EnergySource } from '@/features/cars/types';
import { engineCcRequired, ENERGY_OPTIONS, profileFieldApplies } from '@/features/cars/vehicleOptions';
import { AppText, Card, Field, SelectField, TextField, type SelectOption } from '@/shared/ui';

import { useBrands, useEngineSizes, useModels, useVariants, useYears } from '../hooks';
import { selectBrand, selectModel, selectYear, type CarSelection } from '../selection';
import { OTHER_BRAND_ID, OTHER_MODEL_ID } from '../types';

type CarSelectorProps = {
  value: CarSelection;
  onChange: (value: CarSelection) => void;
  errors: {
    brand?: string;
    model?: string;
    year?: string;
    energySource?: string;
    displacementCc?: string;
  };
};

const energyOptions: SelectOption[] = ENERGY_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

/**
 * Marca → Modelo → Año → Combustible → Cilindraje, desde catálogos.
 * Cada nivel depende del anterior y se limpia si el anterior cambia. El cilindraje
 * solo aparece si la fuente de energía puede tener motor de combustión (regla en vehicleOptions).
 */
export function CarSelector({ value, onChange, errors }: CarSelectorProps) {
  const brands = useBrands();
  const models = useModels(value.brandId);
  const years = useYears(value.modelId);
  const variants = useVariants(value.modelId, value.year);
  const genericSizes = useEngineSizes();

  const isOtherBrand = value.brandId === OTHER_BRAND_ID;
  const isOtherModel = value.modelId === OTHER_MODEL_ID;
  const hasModel = value.modelId !== null;
  // Cilindraje conocido por el catálogo: se toma solo, el usuario no lo elige.
  const knownCc = variants.length === 1 ? variants[0] : undefined;
  // Sin energía elegida todavía se muestra (puede aplicar); un eléctrico no lo ve.
  const energy = { energySource: value.energySource ?? undefined };
  const showCc = profileFieldApplies('displacementCc', energy);
  const ccRequired = value.energySource !== null && engineCcRequired(energy);

  const brandOptions: SelectOption[] = brands.map((b) => ({
    value: b.id,
    label: b.name,
  }));
  const modelOptions: SelectOption[] = [
    ...models.map((m) => ({ value: m.id, label: m.name })),
    {
      value: OTHER_MODEL_ID,
      label: 'Otro modelo',
      description: 'No está en la lista',
    },
  ];
  const yearOptions: SelectOption[] = years.years.map((y) => ({
    value: String(y),
    label: String(y),
  }));
  // Si el catálogo conoce el cilindraje, solo esa opción; si no, la lista general.
  const ccOptions: SelectOption[] =
    variants.length > 0
      ? variants.map((v) => ({
          value: String(v.engineCc),
          label: v.label,
          description: 'Según el catálogo',
        }))
      : genericSizes.map((cc) => ({ value: String(cc), label: `${cc} cc` }));

  return (
    <>
      <Field label="¿Cuál es la marca de tu carro?" error={errors.brand}>
        <SelectField
          title="Marca"
          icon="car"
          placeholder="Elige la marca"
          options={brandOptions}
          value={value.brandId}
          onChange={(brandId) => onChange(selectBrand(value, brandId))}
          invalid={!!errors.brand}
        />
        {isOtherBrand && (
          <TextField
            value={value.otherBrandName}
            onChange={(otherBrandName) => onChange({ ...value, otherBrandName })}
            placeholder="¿Cuál marca?"
            autoCapitalize="words"
            accessibilityLabel="Otra marca"
          />
        )}
      </Field>

      <Field
        label="¿Cuál es el modelo?"
        hint={
          value.brandId && !isOtherBrand && models.length === 0
            ? 'Información no disponible para esta marca todavía: elige "Otro modelo".'
            : undefined
        }
        error={errors.model}>
        {!isOtherBrand && (
          <SelectField
            title="Modelo"
            placeholder="Elige el modelo"
            options={modelOptions}
            value={value.modelId}
            onChange={(modelId) => onChange(selectModel(value, modelId))}
            disabled={!value.brandId}
            disabledHint="Primero elige la marca"
            invalid={!!errors.model}
          />
        )}
        {(isOtherModel || isOtherBrand) && value.brandId && (
          <TextField
            value={value.otherModelName}
            onChange={(otherModelName) => onChange({ ...value, otherModelName })}
            placeholder="Escribe el modelo"
            accessibilityLabel="Otro modelo"
          />
        )}
      </Field>

      <Field
        label="¿De qué año es tu carro?"
        hint={hasModel && !years.verified ? 'Años sin verificar para este modelo.' : undefined}
        error={errors.year}>
        <SelectField
          title="Año"
          placeholder="Elige el año"
          options={yearOptions}
          value={value.year !== null ? String(value.year) : null}
          onChange={(year) => onChange(selectYear(value, Number(year)))}
          disabled={!hasModel}
          disabledHint="Primero elige el modelo"
          invalid={!!errors.year}
        />
      </Field>

      <Field label="¿Qué combustible o energía usa?" error={errors.energySource}>
        <SelectField
          title="Combustible o energía"
          icon="fuel"
          placeholder="Elige una opción"
          options={energyOptions}
          value={value.energySource}
          onChange={(energySource) => onChange({ ...value, energySource: energySource as EnergySource })}
          disabled={!hasModel}
          disabledHint="Primero elige el modelo"
          invalid={!!errors.energySource}
        />
        {value.energySource === 'unknown' && (
          <AppText variant="caption" tone="muted">
            Quedará “Sin confirmar”. Mientras tanto te mostraremos todos los mantenimientos
            posibles; puedes confirmarlo después en Mi carro.
          </AppText>
        )}
      </Field>

      {showCc && (
        <Field
          label={knownCc ? 'Cilindraje' : ccRequired ? 'Selecciona el cilindraje' : 'Cilindraje'}
          optional={!knownCc && !ccRequired}
          error={knownCc ? undefined : errors.displacementCc}>
          {knownCc ? (
            <Card>
              <AppText variant="bodyStrong">{knownCc.label}</AppText>
              <AppText variant="caption" tone="secondary">
                Lo tomamos del catálogo para este modelo.
              </AppText>
            </Card>
          ) : (
            <SelectField
              title="Cilindraje"
              placeholder="Elige el cilindraje"
              options={ccOptions}
              value={value.engineCc !== null ? String(value.engineCc) : null}
              onChange={(cc) => onChange({ ...value, engineCc: Number(cc) })}
              disabled={!hasModel || value.year === null}
              disabledHint={!hasModel ? 'Primero elige el modelo' : 'Primero elige el año'}
              invalid={!!errors.displacementCc}
            />
          )}
          {hasModel && value.year !== null && !knownCc && (
            <AppText variant="caption" tone="muted">
              No tenemos el cilindraje de este modelo en el catálogo. Elige el que corresponda.
            </AppText>
          )}
        </Field>
      )}
    </>
  );
}
