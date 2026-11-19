import { CityPicker } from '@/features/catalogs/components/CityPicker';
import { Field, TextField } from '@/shared/ui';

import type { StepProps } from './types';

/** Paso 1 — Sobre ti. Nombre y ciudad (departamento y municipio oficiales; nunca dirección). */
export function AboutStep({ form, update, errors }: StepProps) {
  return (
    <>
      <Field label="¿Cómo te llamas?" error={errors.name}>
        <TextField
          value={form.name}
          onChange={(name) => update({ name })}
          placeholder="Tu nombre"
          autoCapitalize="words"
          maxLength={40}
          invalid={!!errors.name}
          accessibilityLabel="Nombre"
        />
      </Field>
      <CityPicker value={form.cityId} onChange={(cityId) => update({ cityId })} />
    </>
  );
}
