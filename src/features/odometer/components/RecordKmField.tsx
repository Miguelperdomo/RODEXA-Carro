import { Pressable, View } from 'react-native';

import { createStyles, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Field, Icon, NumberField } from '@/shared/ui';
import { distanceUnit } from '@/shared/utils/format';

type RecordKmFieldProps = {
  value: number | null;
  onChange: (km: number | null) => void;
  /** true = el usuario marcó "No sé el kilometraje". */
  unknown: boolean;
  onUnknownChange: (unknown: boolean) => void;
  label?: string;
  hint?: string;
  error?: string;
  warning?: string;
  size?: 'md';
  accessibilityLabel: string;
};

/**
 * Kilometraje de un registro con la opción explícita "No sé el kilometraje".
 * Al marcarla no se asume ningún valor: el registro se guarda con km desconocido.
 * El número escrito se conserva por si el usuario desmarca la opción.
 */
export function RecordKmField({
  value,
  onChange,
  unknown,
  onUnknownChange,
  label = 'Kilometraje al realizar este registro',
  hint,
  error,
  warning,
  size,
  accessibilityLabel,
}: RecordKmFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Field
      label={label}
      hint={distanceUnit() === 'mi' ? `${hint ? `${hint} ` : ''}Escríbelo en km, como marca el tablero.` : hint}
      error={unknown ? undefined : error}
      warning={unknown ? undefined : warning}>
      {!unknown && (
        <NumberField
          value={value}
          onChange={onChange}
          suffix="km"
          size={size}
          invalid={!!error}
          accessibilityLabel={accessibilityLabel}
        />
      )}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: unknown }}
        onPress={() => onUnknownChange(!unknown)}
        style={styles.checkRow}>
        <Icon
          name={unknown ? 'checkboxOn' : 'checkboxOff'}
          color={unknown ? colors.brand.accent : colors.text.secondary}
        />
        <AppText>No sé el kilometraje</AppText>
      </Pressable>
      {unknown && (
        <View>
          <AppText variant="caption" tone="secondary">
            Se guardará como kilometraje desconocido. RODEXA no usará ningún valor en su lugar.
          </AppText>
        </View>
      )}
    </Field>
  );
}

const useStyles = createStyles(() => ({
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchMin,
  },
}));
