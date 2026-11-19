import { USAGE_OPTIONS } from '@/features/cars/usage';
import { Field, OptionGrid } from '@/shared/ui';

import type { StepProps } from './types';

/**
 * Paso 3 — Uso principal (`usage_type`), una sola selección.
 * Por ahora solo se guarda: todavía no cambia recomendaciones ni cálculos.
 */
export function UsageStep({ form, update, errors }: StepProps) {
  return (
    <Field label="Elige el uso principal" hint="Si lo usas para varias cosas, elige “Uso mixto”." error={errors.usageType}>
      <OptionGrid
        options={USAGE_OPTIONS}
        selected={form.usageType ? [form.usageType] : []}
        onToggle={(usageType) => update({ usageType })}
      />
    </Field>
  );
}
