import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { InfoButton, type InfoText } from './InfoButton';

type FieldProps = {
  label: string;
  optional?: boolean;
  hint?: string;
  /** Mensaje de error (bloquea guardar). */
  error?: string;
  /** Mensaje de advertencia (no bloquea). */
  warning?: string;
  /** ⓘ junto a la etiqueta (solo para lo que no todos entienden). */
  info?: InfoText;
  children: ReactNode;
};

/** Etiqueta + control + ayuda/error. Mantiene el mismo orden en todos los formularios. */
export function Field({ label, optional, hint, error, warning, info, children }: FieldProps) {
  const { colors } = useTheme();
  const message = error ?? warning;
  const messageStyle = error ? colors.status.due : colors.status.soon;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <AppText variant="bodyStrong" style={info && styles.labelText}>
          {label}
          {optional && (
            <AppText variant="caption" tone="muted">
              {'  (opcional)'}
            </AppText>
          )}
        </AppText>
        {info && <InfoButton {...info} />}
      </View>
      {children}
      {message ? (
        <View style={styles.message}>
          <Icon name={error ? 'statusDue' : 'warning'} size={16} color={messageStyle.color} />
          <AppText variant="caption" color={messageStyle.color} style={styles.messageText}>
            {message}
          </AppText>
        </View>
      ) : (
        hint && (
          <AppText variant="caption" tone="secondary">
            {hint}
          </AppText>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelText: {
    flexShrink: 1,
  },
  message: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  messageText: {
    flex: 1,
  },
});
