import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { darkColors, lightColors, withHighContrast, type ColorScheme, type Palette } from './colors';

/** Preferencia del usuario: "system" sigue el tema del dispositivo. */
export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeValue = {
  preference: ThemePreference;
  /** Tema efectivamente aplicado. */
  scheme: ColorScheme;
  isDark: boolean;
  colors: Palette;
  /** "Letra grande" (Configuración): 1 = normal; LARGE_TEXT_SCALE = 15 % más grande. */
  textScale: number;
  /** Modo sol (alto contraste). */
  highContrast: boolean;
};

/** Cuánto crece el texto con "Letra grande". */
export const LARGE_TEXT_SCALE = 1.15;

const ThemeContext = createContext<ThemeValue>({
  preference: 'light',
  scheme: 'light',
  isDark: false,
  colors: lightColors,
  textScale: 1,
  highContrast: false,
});

/**
 * Único sistema de tema de la app. Recibe la preferencia (de SettingsProvider)
 * y, en modo "system", reacciona a los cambios del dispositivo (useColorScheme).
 */
export function ThemeProvider({
  preference,
  textScale = 1,
  highContrast = false,
  children,
}: {
  preference: ThemePreference;
  textScale?: number;
  highContrast?: boolean;
  children: ReactNode;
}) {
  const deviceScheme = useColorScheme();
  const scheme: ColorScheme =
    preference === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeValue>(
    () => ({
      preference,
      scheme,
      isDark: scheme === 'dark',
      colors: highContrast
        ? withHighContrast(scheme === 'dark' ? darkColors : lightColors)
        : scheme === 'dark'
          ? darkColors
          : lightColors,
      textScale,
      highContrast,
    }),
    [preference, scheme, textScale, highContrast],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/**
 * Estilos que dependen del tema. Se crean una vez por tema y se reutilizan:
 *
 *   const useStyles = createStyles((colors) => ({ card: { backgroundColor: colors.surface } }));
 *   function Card() { const styles = useStyles(); … }
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T) {
  // Una versión por tema y por Modo sol.
  const cache: Partial<Record<string, T>> = {};
  return function useStyles(): T {
    const { scheme, colors } = useTheme();
    const key = colors.highContrast ? `${scheme}-sol` : scheme;
    const cached = cache[key];
    if (cached) return cached;
    const created = StyleSheet.create(factory(colors));
    cache[key] = created;
    return created;
  };
}
