import { TextInput } from 'react-native';

import { createStyles, radius, spacing, typography, useTheme } from '@/shared/theme';

type TextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
  /** "characters" para la placa (todo en mayúsculas). */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  invalid?: boolean;
  /** "phone-pad" para teléfonos. */
  keyboardType?: 'default' | 'phone-pad';
};

export function TextField({
  value,
  onChange,
  placeholder,
  multiline = false,
  maxLength = 200,
  accessibilityLabel,
  autoCapitalize = 'sentences',
  invalid = false,
  keyboardType = 'default',
}: TextFieldProps) {
  const { colors, textScale } = useTheme();
  const styles = useStyles();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      autoCapitalize={autoCapitalize}
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
      multiline={multiline}
      maxLength={maxLength}
      keyboardType={keyboardType}
      accessibilityLabel={accessibilityLabel}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        styles.input,
        multiline && styles.multiline,
        invalid && styles.invalid,
        // "Letra grande": lo que se escribe también crece.
        textScale !== 1 && {
          fontSize: typography.body.fontSize * textScale,
          lineHeight: Math.round(typography.body.lineHeight * textScale),
        },
      ]}
    />
  );
}

const useStyles = createStyles((colors) => ({
  input: {
    ...typography.body,
    color: colors.text.primary,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  multiline: {
    minHeight: 96,
  },
  invalid: {
    borderColor: colors.status.due.color,
  },
}));
