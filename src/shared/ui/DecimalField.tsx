import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { createStyles, radius, spacing, tabularNumbers, typography, useTheme } from '@/shared/theme';

import { AppText } from './AppText';

type DecimalFieldProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  /** "L" para litros. */
  suffix?: string;
  placeholder?: string;
  /** Máximo de decimales (coma colombiana). */
  decimals?: number;
  invalid?: boolean;
  accessibilityLabel?: string;
};

/** Número con decimales (p. ej. litros "4,4"). Acepta coma o punto; muestra coma. */
export function DecimalField({
  value,
  onChange,
  suffix,
  placeholder = '0',
  decimals = 2,
  invalid,
  accessibilityLabel,
}: DecimalFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  // Texto propio para poder escribir "4," sin que se borre la coma.
  const [text, setText] = useState(value === null ? '' : String(value).replace('.', ','));

  const handleChange = (raw: string) => {
    const normalized = raw.replace('.', ',').replace(/[^\d,]/g, '');
    const [integer = '', ...rest] = normalized.split(',');
    const fraction = rest.join('').slice(0, decimals);
    const next = rest.length > 0 ? `${integer.slice(0, 4)},${fraction}` : integer.slice(0, 4);
    setText(next);
    const parsed = Number(next.replace(',', '.'));
    onChange(next === '' || next === ',' || Number.isNaN(parsed) ? null : parsed);
  };

  return (
    <View style={[styles.box, invalid && styles.boxInvalid]}>
      <TextInput
        value={text}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        accessibilityLabel={accessibilityLabel}
        style={styles.input}
      />
      {suffix && (
        <AppText variant="bodyStrong" tone="muted">
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
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxInvalid: {
    borderColor: colors.status.due.color,
  },
  input: {
    flex: 1,
    ...typography.bodyStrong,
    ...tabularNumbers,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
}));
