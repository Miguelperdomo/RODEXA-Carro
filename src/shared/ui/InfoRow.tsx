import { View } from 'react-native';

import { createStyles, spacing } from '@/shared/theme';

import { AppText } from './AppText';

type InfoRowProps = {
  label: string;
  /** undefined / vacío → "Sin registrar". Nunca se inventa un valor. */
  value?: string;
  divider?: boolean;
};

export function InfoRow({ label, value, divider = false }: InfoRowProps) {
  const styles = useStyles();
  const missing = value === undefined || value.trim() === '';

  return (
    <View style={[styles.row, divider && styles.divider]}>
      <AppText tone="secondary">{label}</AppText>
      <AppText
        variant={missing ? 'body' : 'bodyStrong'}
        tone={missing ? 'muted' : 'primary'}
        numeric
        style={[styles.value, missing && styles.missing]}>
        {missing ? 'Sin registrar' : value}
      </AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  missing: {
    fontStyle: 'italic',
  },
}));
