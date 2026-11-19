import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type FormScreenProps = {
  title: string;
  children: ReactNode;
  /** Zona fija abajo (botón Guardar), siempre al alcance del pulgar. */
  footer?: ReactNode;
  /** Por defecto vuelve a la pantalla anterior. */
  onClose?: () => void;
  /** "close" (X) para formularios; "back" (←) para pantallas de detalle. */
  closeIcon?: 'close' | 'back';
  /** Botón opcional a la derecha del título (p. ej. "?" de preguntas frecuentes). */
  headerAction?: ReactNode;
};

/** Estructura común de formularios y detalles: encabezado + contenido + botón fijo abajo. */
export function FormScreen({
  title,
  children,
  footer,
  onClose = () => router.back(),
  closeIcon = 'close',
  headerAction,
}: FormScreenProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeIcon === 'back' ? 'Volver' : 'Cerrar'}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
            <Icon name={closeIcon} color={colors.text.primary} />
          </Pressable>
          <AppText variant="heading" style={styles.flex} numberOfLines={1}>
            {title}
          </AppText>
          {headerAction}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 56,
  },
  closeButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.border,
  },
  content: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  footer: {
    paddingHorizontal: sizes.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
