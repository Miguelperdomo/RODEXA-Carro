import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND } from '@/config/brand';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, BrandMark, Button, Icon, Screen, type IconName } from '@/shared/ui';

/** Solo lo que la app hace HOY (el asistente por voz entra cuando exista). */
const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'document', title: 'Te avisa a tiempo', text: 'SOAT, tecnomecánica y licencia, antes de que venzan.' },
  { icon: 'maintenance', title: 'Mantenimiento al día', text: 'Aceite, frenos y llantas según tus kilómetros.' },
  { icon: 'calendar', title: 'Pico y placa y avisos', text: 'Te recuerda tus días de restricción según lo que configures.' },
  { icon: 'expense', title: 'Cuánto te cuesta tu carro', text: 'Combustible, mantenimiento y gastos del mes.' },
  { icon: 'emergency', title: 'Ayuda en la vía', text: 'Si tienes un accidente: qué hacer y a quién llamar.' },
];

const TRUST = ['Gratis', 'Sin crear cuenta', 'Sin internet'];

/** Entrada muy ligera: toda la pantalla aparece de una vez (sin cascada). */
function useFadeIn() {
  const value = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) value.setValue(1);
        else Animated.timing(value, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [value]);
  return {
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
}

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const fadeIn = useFadeIn();

  return (
    // Pensada para verse COMPLETA sin bajar. `scroll` solo actúa si no cabe (p. ej. letra muy grande).
    <Screen scroll edges={['top']} contentStyle={styles.content}>
      <Animated.View style={[styles.body, fadeIn]}>
        <View style={styles.hero}>
          <BrandMark size="lg" iconOnly />
          <AppText variant="title" align="center">
            RODEXA Carro
          </AppText>
          <AppText tone="secondary" align="center" style={styles.lead}>
            Cuida tu carro en un solo lugar. Tus datos se quedan en tu celular.
          </AppText>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Icon name={benefit.icon} size={sizes.iconMd} color={colors.brand.accent} />
              </View>
              <View style={styles.flex}>
                <AppText variant="heading">{benefit.title}</AppText>
                <AppText tone="secondary">{benefit.text}</AppText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.trust} accessible accessibilityLabel={TRUST.join('. ')}>
          {TRUST.map((item) => (
            <View key={item} style={styles.trustItem}>
              <Icon name="check" size={16} color={colors.status.ok.color} />
              <AppText variant="captionStrong" tone="secondary">
                {item}
              </AppText>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label="Comenzar" fullWidth onPress={() => router.push('/datos')} />
        {/* Celular nuevo: se recupera la copia (.rodexa) y se salta el registro. */}
        <Button
          label="Ya tenía RODEXA: recuperar mi copia"
          icon="importData"
          variant="ghost"
          fullWidth
          onPress={() => router.push('/recuperar')}
        />
        {/* Las dudas aparecen ANTES de empezar: las preguntas frecuentes, a la vista. */}
        <AppText
          variant="captionStrong"
          tone="brand"
          align="center"
          accessibilityRole="link"
          onPress={() => router.push('/configuracion/ayuda')}
          style={styles.faqLink}>
          ¿Tienes dudas? Preguntas frecuentes
        </AppText>
        <AppText variant="caption" tone="muted" align="center">
          Al continuar aceptas los{' '}
          <AppText
            variant="caption"
            tone="brand"
            accessibilityRole="link"
            onPress={() => router.push('/configuracion/terminos')}
            style={styles.link}>
            Términos y condiciones
          </AppText>{' '}
          y la{' '}
          <AppText
            variant="caption"
            tone="brand"
            accessibilityRole="link"
            onPress={() => router.push('/configuracion/politica-privacidad')}
            style={styles.link}>
            Política de privacidad
          </AppText>
          . {BRAND.madeBy}.
        </AppText>
      </View>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  content: {
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  // Ocupa todo el alto disponible: los beneficios se reparten el espacio (sin huecos en blanco).
  body: {
    flexGrow: 1,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  lead: {
    maxWidth: 320,
    marginTop: spacing.xs,
  },
  // Beneficios grandes y sin tarjetas: se reparten la pantalla.
  benefits: {
    flexGrow: 1,
    justifyContent: 'space-evenly',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: spacing.xs,
  },
  faqLink: {
    paddingVertical: spacing.xs,
  },
  trust: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  link: {
    textDecorationLine: 'underline',
  },
}));
