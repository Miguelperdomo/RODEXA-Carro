import { Field, NumberField } from '@/shared/ui';

import type { StepProps } from './types';

/** Paso 3 — Kilometraje actual: el punto de partida de todos los cálculos. */
export function OdometerStep({ form, update, errors }: StepProps) {
  return (
    <Field
      label="Míralo en el tablero de tu carro"
      hint="Usaremos este dato como punto de partida para calcular próximos mantenimientos."
      error={errors.km}>
      <NumberField
        value={form.km}
        onChange={(km) => update({ km })}
        suffix="km"
        placeholder="53.240"
        autoFocus
        invalid={!!errors.km}
        accessibilityLabel="Kilometraje actual"
      />
    </Field>
  );
}
