import { useState } from 'react';

import type { IconName } from './Icon';
import { OptionSheet, type SelectOption } from './OptionSheet';
import { SettingsRow } from './SettingsRow';

type SettingsSelectRowProps<T extends string> = {
  icon: IconName;
  label: string;
  description?: string;
  options: (SelectOption & { value: T })[];
  value: T;
  onChange: (value: T) => void;
  cancelLabel?: string;
};

/** Fila con el valor actual que abre la hoja de selección compartida (OptionSheet). */
export function SettingsSelectRow<T extends string>({
  icon,
  label,
  description,
  options,
  value,
  onChange,
  cancelLabel,
}: SettingsSelectRowProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <SettingsRow
        icon={icon}
        label={label}
        description={description}
        accessory={{ type: 'value', value: current?.label ?? '', navigate: true }}
        onPress={() => setOpen(true)}
      />
      <OptionSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        cancelLabel={cancelLabel}
        onSelect={(next) => {
          setOpen(false);
          if (next !== value) onChange(next as T);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
