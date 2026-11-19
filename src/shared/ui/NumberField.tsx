import { TextInput, View } from 'react-native';

import { createStyles, radius, spacing, tabularNumbers, typography, useTheme } from '@/shared/theme';
import { formatThousands } from '@/shared/utils/format';

import { AppText } from './AppText';
import { parseNumberInput } from './parseNumberInput';

type NumberFieldProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  /** "$" para dinero. */
  prefix?: string;
  /** "km" para kilometraje. */
  suffix?: string;
  placeholder?: string;
  autoFocus?: boolean;
  invalid?: boolean;
  accessibilityLabel?: string;
  /** false para números que no llevan puntos de miles, como el año. */
  grouping?: boolean;
  maxDigits?: number;
  /** "md" para datos secundarios (año, cilindraje) en vez del tamaño grande. */
  size?: 'lg' | 'md';
};

/** Campo numérico grande con separador de miles. Solo acepta enteros positivos. */
export function NumberField({
  value,
  onChange,
  prefix,
  suffix,
  placeholder = '0',
  autoFocus,
  invalid,
  accessibilityLabel,
  grouping = true,
  maxDigits = 9,
  size = 'lg',
}: NumberFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const display = value === null ? '' : grouping ? formatThousands(value) : String(value);
  // Al pegar "$350.000,00" se quitan los centavos; al escribir o borrar no se toca nada.
  const handleChange = (text: string) => onChange(parseNumberInput(text, display, maxDigits));
  const affixVariant = size === 'lg' ? 'title' : 'bodyStrong';

  return (
    <View style={[styles.box, size === 'md' && styles.boxMd, invalid && styles.boxInvalid]}>
      {prefix && (
        <AppText variant={affixVariant} tone="muted">
          {prefix}
        </AppText>
      )}
      <TextInput
        value={display}
        onChangeText={handleChange}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        autoFocus={autoFocus}
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, size === 'md' && styles.inputMd]}
      />
      {suffix && (
        <AppText variant={affixVariant} tone="muted">
          {suffix}
        </AppText>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxMd: {
    minHeight: 52,
  },
  boxInvalid: {
    borderColor: colors.status.due.color,
  },
  input: {
    flex: 1,
    ...typography.display,
    ...tabularNumbers,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  inputMd: {
    ...typography.bodyStrong,
  },
}));
