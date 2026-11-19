import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BudgetWatcher } from '@/features/budget/components/BudgetWatcher';
import { LocalReminders } from '@/features/notifications/local/LocalReminders';
import { SplashOverlay } from '@/features/onboarding/components/SplashOverlay';
import { APP_ROUTES } from '@/features/session/appRoutes';
import { SessionProvider, useSession } from '@/features/session/SessionProvider';
import { SettingsProvider } from '@/features/settings/SettingsProvider';
import { createStyles, useTheme } from '@/shared/theme';
import { AppDialogHost, ToastProvider } from '@/shared/ui';

/**
 * Si alguna pantalla falla, en vez de cerrarse la app se muestra esto con "Reintentar". Los
 * datos guardados no se tocan. Colores fijos y sin proveedores de la app: así funciona aunque
 * lo que falló sea el tema o la sesión.
 */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={rescue.root}>
      <Text style={rescue.title}>Algo no salió bien</Text>
      <Text style={rescue.text}>
        Esta pantalla tuvo un problema, pero tus datos están guardados en el celular. Toca Reintentar; si vuelve a pasar,
        cierra y abre RODEXA.
      </Text>
      <Pressable accessibilityRole="button" onPress={() => void retry()} style={rescue.button}>
        <Text style={rescue.buttonText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const rescue = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 32, gap: 16, backgroundColor: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  text: { fontSize: 16, lineHeight: 22, color: '#374151' },
  button: { alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1E4FD8' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

export default function RootLayout() {
  return (
    // Preferencias (incluye el único ThemeProvider) → sesión → avisos breves → navegación.
    <SettingsProvider>
      <SessionProvider>
        <ToastProvider>
          <RootNavigator />
          {/* Recordatorios del teléfono (notificaciones locales). */}
          <LocalReminders />
          {/* Aviso al llegar al 80 % y al pasar el presupuesto del mes. */}
          <BudgetWatcher />
          {/* Ventanas de confirmación con el diseño de RODEXA (en lugar de las del sistema). */}
          <AppDialogHost />
        </ToastProvider>
      </SessionProvider>
    </SettingsProvider>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const { onboardingDone } = useSession();
  // La splash aparece en cada apertura de la app, encima de la navegación.
  const [splashVisible, setSplashVisible] = useState(true);
  const hideSplash = useCallback(() => setSplashVisible(false), []);

  // Fondo de la ventana del sistema (lo que se ve detrás de las pantallas, p. ej. al abrir el
  // teclado) con el color del tema: sin destellos blancos en tema oscuro.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  // Colores de la navegación (fondos de transición, etc.) alineados con el tema de RODEXA.
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.brand.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text.primary,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={styles.root}>
        {/* La splash usa el fondo del tema: íconos claros en oscuro y oscuros en claro. */}
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          {/* Primer ingreso: solo disponible mientras no se haya completado. */}
          <Stack.Protected guard={!onboardingDone}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>

          {/* App principal: solo disponible después del primer ingreso. */}
          <Stack.Protected guard={onboardingDone}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="nuevo"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
                sheetCornerRadius: 24,
                contentStyle: { backgroundColor: colors.surfaceElevated },
              }}
            />
            {/* El resto de pantallas también, aunque se abran desde una notificación o un enlace. */}
            {APP_ROUTES.map((name) => (
              <Stack.Screen key={name} name={name} />
            ))}
          </Stack.Protected>
        </Stack>

        {splashVisible && <SplashOverlay onFinish={hideSplash} />}
      </View>
    </NavigationThemeProvider>
  );
}

const useStyles = createStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
}));
