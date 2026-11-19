import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useT } from '@/i18n';
import { createStyles, radius, sizes, useTheme } from '@/shared/theme';
import { Icon } from '@/shared/ui';

/**
 * Botón ⚙️ de Configuración, igual en las 4 pestañas (arriba a la derecha): así se
 * entra a Configuración desde cualquier lado, sin volver a Inicio.
 */
export function SettingsButton() {
  const { colors } = useTheme();
  const styles = useStyles();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('settings.title')}
      onPress={() => router.push('/configuracion')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name="settings" color={colors.text.secondary} />
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
