import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/shared/hooks/useReduceMotion';

/** Carga sutil: tres puntos que se encienden en secuencia (Animated de React Native). */
export function LoadingDots({ color }: { color: string }) {
  const values = useState(() => [0, 1, 2].map(() => new Animated.Value(0.3)))[0];
  // Sin animaciones en bucle si el celular las apaga (los puntos quedan encendidos).
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      values.forEach((v) => v.setValue(1));
      return;
    }
    const animations = values.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(value, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.3, duration: 360, useNativeDriver: true }),
          Animated.delay((2 - i) * 180),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [values, reduceMotion]);

  return (
    <View style={styles.row} accessibilityLabel="Cargando">
      {values.map((value, i) => (
        <Animated.View key={i} style={[styles.dot, { backgroundColor: color, opacity: value }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
