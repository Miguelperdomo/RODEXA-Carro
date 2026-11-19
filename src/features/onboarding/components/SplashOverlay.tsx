import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND } from '@/config/brand';
import { OPENING_BACKGROUND, spacing, useTheme } from '@/shared/theme';
import { AppText, BrandMark } from '@/shared/ui';

import { LoadingDots } from './LoadingDots';
import { reduceMotionNow } from '@/shared/hooks/useReduceMotion';

/** Duración visible antes de desvanecerse (≈1,6 s + 0,3 s de salida). */
const VISIBLE_MS = 1600;
const FADE_MS = 300;

/**
 * Splash de RODEXA Carro: aparece cada vez que se abre la app, encima de la navegación (no es
 * una ruta), y luego se desvanece. En tema oscuro el logo va sobre su placa blanca.
 */
export function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const opacity = useState(() => new Animated.Value(1))[0];
  const entrance = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    // Sin animaciones si el celular las apaga: aparece y se quita sin transición.
    const still = reduceMotionNow();
    if (still) entrance.setValue(1);
    else Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      if (still) onFinish();
      else Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => onFinish());
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [entrance, opacity, onFinish]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { opacity, backgroundColor: OPENING_BACKGROUND[isDark ? 'dark' : 'light'] }]}>
      <Animated.View
        style={[
          styles.center,
          {
            opacity: entrance,
            transform: [
              { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          },
        ]}>
        <BrandMark size="lg" />
        <AppText tone="secondary" align="center">
          {BRAND.tagline}
        </AppText>
        <View style={styles.loader}>
          <LoadingDots color={colors.brand.accent} />
        </View>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <AppText variant="caption" tone="muted" align="center">
          {BRAND.madeBy}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loader: {
    marginTop: spacing.xl,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
