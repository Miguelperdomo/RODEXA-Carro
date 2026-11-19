import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { createStyles, radius, sizes, useTheme } from '@/shared/theme';
import { Icon } from '@/shared/ui';

/**
 * "?" de preguntas frecuentes, en el encabezado del primer ingreso: las dudas
 * ("¿es gratis?", "¿mis datos se suben?") aparecen ANTES de registrar el carro, no solo
 * después en Configuración. Abre la misma pantalla de Ayuda.
 */
export function FaqButton() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Preguntas frecuentes"
      onPress={() => router.push('/configuracion/ayuda')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name="faq" color={colors.text.secondary} />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  button: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.border,
  },
}));
