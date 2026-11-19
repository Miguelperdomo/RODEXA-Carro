import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';

import { LoadingDots } from '@/features/onboarding/components/LoadingDots';
import { useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { spacing, useTheme } from '@/shared/theme';
import { AppText, BrandMark, Screen } from '@/shared/ui';

const MESSAGES = [
  'Guardando los datos de tu carro…',
  'Preparando tu mantenimiento…',
  'Revisando tus próximos pendientes…',
  'Todo listo.',
];
const MESSAGE_MS = 550;

/**
 * Preparación (~2,2 s). Al terminar marca el primer ingreso como completo; cuando
 * queda guardado en el teléfono, la navegación protegida lleva al Inicio existente.
 */
export default function PreparingScreen() {
  const { colors } = useTheme();
  const { completeOnboarding } = useSession();
  const persist = usePersist();
  const [index, setIndex] = useState(0);
  const opacity = useState(() => new Animated.Value(1))[0];

  // La preparación no se interrumpe con el botón "atrás".
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (index === MESSAGES.length - 1) {
      // Solo al quedar guardado cambia la navegación al Inicio; si falla, vuelve al resumen.
      const done = setTimeout(async () => {
        if (!(await persist(completeOnboarding))) router.replace('/resumen');
      }, MESSAGE_MS);
      return () => clearTimeout(done);
    }
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setIndex((i) => i + 1);
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      });
    }, MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [index, opacity, completeOnboarding, persist]);

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.center}>
        <BrandMark size="lg" iconOnly />
        <AppText variant="title" align="center">
          Estamos preparando tu RODEXA Carro…
        </AppText>
        <Animated.View style={{ opacity }}>
          <AppText tone="secondary" align="center">
            {MESSAGES[index]}
          </AppText>
        </Animated.View>
        <View style={styles.loader}>
          <LoadingDots color={colors.brand.accent} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loader: {
    marginTop: spacing.lg,
  },
});
