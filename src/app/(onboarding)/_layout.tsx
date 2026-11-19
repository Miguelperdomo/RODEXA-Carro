import { Stack } from 'expo-router';

import { useTheme } from '@/shared/theme';

// La primera pantalla del grupo es la bienvenida.
export const unstable_settings = { initialRouteName: 'bienvenida' };

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      initialRouteName="bienvenida"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="bienvenida" />
      <Stack.Screen name="datos" />
      <Stack.Screen name="recuperar" />
      <Stack.Screen name="resumen" />
      <Stack.Screen name="estilo" />
      {/* Sin gesto de volver: la preparación no se interrumpe. */}
      <Stack.Screen name="preparando" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}
