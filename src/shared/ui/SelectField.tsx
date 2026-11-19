import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { OptionSheet, type SelectOption } from './OptionSheet';

export type { SelectOption };

type SelectFieldProps = {
  /** Título de la hoja de selección. */
  title: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: IconName;
  disabled?: boolean;
  /** Texto cuando está deshabilitado: "Primero elige la marca". */
  disabledHint?: string;
  /** Texto cuando la lista está vacía. */
  emptyText?: string;
  invalid?: boolean;
  /** Se muestra buscador si hay más opciones que esto. */
  searchThreshold?: number;
};

/**
 * Selector de catálogo: campo que abre una hoja desde abajo (OptionSheet) con
 * buscador, opción seleccionada marcada y botón Cancelar.
 */
export function SelectField({
  title,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  icon,
  disabled = false,
  disabledHint,
  emptyText,
  invalid = false,
  searchThreshold,
}: SelectFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          invalid && styles.fieldInvalid,
          disabled && styles.fieldDisabled,
          pressed && styles.fieldPressed,
        ]}>
        {icon && (
          <Icon name={icon} color={disabled ? colors.text.muted : colors.brand.accent} />
        )}
        <View style={styles.fieldTexts}>
          <AppText
            variant={selected ? 'bodyStrong' : 'body'}
            tone={selected ? 'primary' : 'muted'}
            numberOfLines={1}>
            {disabled && disabledHint ? disabledHint : (selected?.label ?? placeholder)}
          </AppText>
          {selected?.description && !disabled && (
            <AppText variant="caption" tone="secondary" numberOfLines={1}>
              {selected.description}
            </AppText>
          )}
        </View>
        <Icon name="selectArrow" color={colors.text.muted} />
      </Pressable>

      <OptionSheet
        visible={open}
        title={title}
        options={options}
        value={value}
        onSelect={(next) => {
          onChange(next);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        emptyText={emptyText}
        searchThreshold={searchThreshold}
      />
    </>
  );
}

const useStyles = createStyles((colors) => ({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldInvalid: {
    borderColor: colors.status.due.color,
  },
  fieldDisabled: {
    backgroundColor: colors.background,
  },
  fieldPressed: {
    borderColor: colors.brand.accent,
  },
  fieldTexts: {
    flex: 1,
  },
}));
