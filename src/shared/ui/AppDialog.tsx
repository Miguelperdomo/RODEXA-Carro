import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';

import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';

/** Igual que los botones de `Alert.alert`, para cambiar uno por otro sin tocar nada más. */
export type DialogButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

export type DialogOptions = { cancelable?: boolean; onDismiss?: () => void };

type DialogRequest = { title: string; message?: string; buttons: DialogButton[]; options?: DialogOptions };

/** La ventana que está montada (AppDialogHost). Si no hay ninguna, se usa la de Android. */
let showInHost: ((request: DialogRequest) => void) | null = null;

/**
 * Ventana de confirmación con el diseño de RODEXA. Se usa EXACTAMENTE como `Alert.alert`
 * (mismo orden de datos y botones). Si la ventana propia no está disponible (p. ej. en
 * la pantalla de error de datos), se muestra la del sistema para que nunca se pierda.
 */
export function appAlert(title: string, message?: string, buttons?: DialogButton[], options?: DialogOptions): void {
  const list = buttons && buttons.length > 0 ? buttons : [{ text: 'Entendido' }];
  if (showInHost) showInHost({ title, message, buttons: list, options });
  else Alert.alert(title, message, list, options);
}

/** Va una sola vez en la raíz de la app. Muestra las ventanas de una en una, en orden. */
export function AppDialogHost() {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0];

  useEffect(() => {
    showInHost = (request) => setQueue((q) => [...q, request]);
    return () => {
      showInHost = null;
    };
  }, []);

  if (!current) return null;

  const cancelButton = current.buttons.find((b) => b.style === 'cancel');
  const mainButtons = current.buttons.filter((b) => b.style !== 'cancel');
  const firstDefault = mainButtons.find((b) => b.style !== 'destructive');
  // Se puede cerrar tocando afuera o con "atrás" si hay "Cancelar", si se pidió, o si es solo un aviso.
  const dismissable =
    cancelButton !== undefined || current.options?.cancelable === true || current.buttons.every((b) => !b.onPress);

  const close = (after?: () => void | Promise<void>) => {
    setQueue((q) => q.slice(1));
    void after?.();
  };
  const dismiss = () => {
    if (!dismissable) return;
    close(cancelButton ? cancelButton.onPress : current.options?.onDismiss);
  };

  return (
    <Modal visible transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={dismiss} accessible={false} />
        <View style={styles.card} accessibilityViewIsModal>
          <AppText variant="heading" accessibilityRole="header">
            {current.title}
          </AppText>
          {current.message ? (
            <AppText tone="secondary" style={styles.message}>
              {current.message}
            </AppText>
          ) : null}

          <View style={styles.buttons}>
            {mainButtons.map((button, index) => {
              const destructive = button.style === 'destructive';
              const primary = button === firstDefault;
              const label = button.text ?? 'Entendido';
              return (
                <Pressable
                  key={`${label}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={() => close(button.onPress)}
                  style={({ pressed }) => [
                    styles.button,
                    destructive ? styles.destructive : primary ? styles.primary : styles.secondary,
                    pressed && styles.pressed,
                  ]}>
                  <AppText
                    variant="bodyStrong"
                    align="center"
                    color={
                      destructive ? colors.status.due.color : primary ? colors.brand.onPrimary : colors.brand.accent
                    }>
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
            {cancelButton && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={cancelButton.text ?? 'Cancelar'}
                onPress={() => close(cancelButton.onPress)}
                style={({ pressed }) => [styles.button, pressed && styles.cancelPressed]}>
                <AppText variant="bodyStrong" align="center" tone="secondary">
                  {cancelButton.text ?? 'Cancelar'}
                </AppText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createStyles((colors) => ({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.sm,
    borderWidth: colors.highContrast ? 2 : 0,
    borderColor: colors.border,
  },
  message: {
    marginTop: spacing.xs,
  },
  buttons: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    minHeight: colors.highContrast ? 56 : sizes.touchMin,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.brand.accent,
  },
  destructive: {
    backgroundColor: colors.status.due.background,
  },
  pressed: {
    opacity: 0.8,
  },
  cancelPressed: {
    backgroundColor: colors.background,
  },
}));
