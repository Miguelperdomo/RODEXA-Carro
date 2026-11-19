import { CarSelector } from '@/features/catalogs/components/CarSelector';
import { CityPicker } from '@/features/catalogs/components/CityPicker';
import { Field, TextField } from '@/shared/ui';

import type { StepProps } from './types';

/** Paso 2 — Tu carro: Marca → Modelo → Año → Combustible → Cilindraje + placa opcional. */
export function CarStep({ form, update, errors }: StepProps) {
  return (
    <>
      <CarSelector
        value={form.car}
        onChange={(car) => update({ car })}
        errors={errors}
      />

      <Field
        label="Placa"
        optional
        hint="Solo para identificar tu carro."
        error={errors.plate}>
        <TextField
          value={form.plate}
          onChange={(text) => update({ plate: text.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
          placeholder="ABC123"
          autoCapitalize="characters"
          maxLength={6}
          invalid={!!errors.plate}
          accessibilityLabel="Placa"
        />
      </Field>

      {/* La ciudad de matrícula va debajo de la placa en Inicio (sin ella, la de tu perfil). */}
      {form.plate !== '' && (
        <CityPicker
          value={form.plateCityId}
          onChange={(plateCityId) => update({ plateCityId })}
          departmentLabel="Departamento de la placa"
          cityLabel="Ciudad de la placa"
          cityHint="Donde está matriculado tu carro. Si no la eliges, usamos la ciudad de tu perfil."
        />
      )}
    </>
  );
}
