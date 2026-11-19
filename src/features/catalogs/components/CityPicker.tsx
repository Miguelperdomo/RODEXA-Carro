import { useState } from 'react';

import { Field, SelectField, type SelectOption } from '@/shared/ui';

import { useDepartments, useMunicipalities } from '../hooks';
import { findCity } from '../repository';

type CityPickerProps = {
  /** Código DANE del municipio (o un id del catálogo anterior, que también se reconoce). */
  value: string | null;
  onChange: (cityId: string | null) => void;
  /** Los dos campos son opcionales (como siempre lo ha sido la ciudad). */
  optional?: boolean;
  /** Etiquetas (p. ej. para la ciudad de la placa). */
  departmentLabel?: string;
  cityLabel?: string;
  cityHint?: string;
};

/**
 * Ciudad en dos pasos con los datos oficiales del DANE: primero el DEPARTAMENTO y, apenas se
 * elige, el campo con SOLO los municipios de ese departamento. Nunca pide la dirección.
 */
export function CityPicker({
  value,
  onChange,
  optional = true,
  departmentLabel = 'Departamento',
  cityLabel = 'Ciudad o municipio',
  cityHint = 'Solo la ciudad o el municipio, no tu dirección.',
}: CityPickerProps) {
  const departments = useDepartments();
  // Si ya tenía ciudad guardada, arranca con su departamento elegido.
  const [departmentCode, setDepartmentCode] = useState<string | null>(() => findCity(value)?.departmentCode ?? null);
  const municipalities = useMunicipalities(departmentCode);
  const departmentName = departments.find((d) => d.code === departmentCode)?.name;
  // Un id del catálogo anterior ("medellin") se muestra elegido con su código DANE.
  const selectedCode = findCity(value)?.id ?? null;

  const departmentOptions: SelectOption[] = departments.map((d) => ({ value: d.code, label: d.name }));
  const municipalityOptions: SelectOption[] = municipalities.map((m) => ({ value: m.id, label: m.name }));

  const chooseDepartment = (code: string) => {
    if (code === departmentCode) return;
    setDepartmentCode(code);
    // Cambió de departamento: el municipio elegido ya no corresponde.
    if (value !== null) onChange(null);
  };

  return (
    <>
      <Field label={departmentLabel} optional={optional}>
        <SelectField
          title={departmentLabel}
          icon="city"
          placeholder="Elige el departamento"
          options={departmentOptions}
          value={departmentCode}
          onChange={chooseDepartment}
        />
      </Field>
      {departmentCode && (
        <Field label={cityLabel} optional={optional} hint={cityHint}>
          <SelectField
            title={`Municipios de ${departmentName ?? 'tu departamento'}`}
            icon="location"
            placeholder="Elige la ciudad o el municipio"
            options={municipalityOptions}
            value={selectedCode}
            onChange={(id) => onChange(id)}
          />
        </Field>
      )}
    </>
  );
}
