import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { FaqButton } from '@/features/help/components/FaqButton';
import { useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { FuelTracking, UsageStyle } from '@/features/settings/types';
import { USAGE_STYLES } from '@/features/settings/usageStyle';
import { FUEL_TRACKING_OPTIONS, fuelWords } from '@/features/tranqui/style';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, FormScreen, Icon } from '@/shared/ui';

/**
 * Primer ingreso → "¿Cómo quieres usar RODEXA?". Viene marcado "Al detalle" (y va primero).
 * Se puede cambiar después en Configuración → Mi estilo.
 */
export default function OnboardingStyleScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { update } = useSettings();
  const { draft } = useSession();
  const [style, setStyle] = useState<UsageStyle>('detail');
  // Solo en Tranqui: ¿y el combustible? (en "Al detalle" se registra cada carga, como siempre).
  const [fuel, setFuel] = useState<FuelTracking>('monthly');
  const words = fuelWords(draft?.profile);

  const next = () => {
    update(style === 'tranqui' ? { usageStyle: style, fuelTracking: fuel } : { usageStyle: style, fuelTracking: 'each' });
    router.replace('/preparando');
  };

  return (
    <FormScreen
      title="¿Cómo quieres usar RODEXA?"
      closeIcon="back"
      headerAction={<FaqButton />}
      footer={<Button label="Crear mi RODEXA Carro" fullWidth onPress={next} />}>
      <AppText tone="secondary">Elige el estilo que prefieras.</AppText>

      <View style={styles.options} accessibilityRole="radiogroup">
        {USAGE_STYLES.map((option) => {
          const selected = option.value === style;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${option.title}: ${option.promise}`}
              onPress={() => setStyle(option.value)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
              <View style={styles.header}>
                <View style={styles.iconBox}>
                  <AppText style={styles.emoji}>{option.emoji}</AppText>
                </View>
                <View style={styles.flex}>
                  <AppText variant="title">{option.title}</AppText>
                  <AppText variant="bodyStrong" color={colors.brand.accent}>
                    {option.promise}
                  </AppText>
                </View>
                <Icon name={selected ? 'checked' : 'unchecked'} color={selected ? colors.brand.accent : colors.text.muted} />
              </View>
              {option.points.map((point) => (
                <View key={point} style={styles.point}>
                  <Icon name="check" size={16} color={colors.text.secondary} />
                  <AppText variant="caption" tone="secondary" style={styles.flex}>
                    {point}
                  </AppText>
                </View>
              ))}
            </Pressable>
          );
        })}
      </View>

      {style === 'tranqui' && (
        <View style={styles.fuel} accessibilityRole="radiogroup">
          <AppText variant="bodyStrong">{words.question}</AppText>
          {FUEL_TRACKING_OPTIONS.map((option) => {
            const selected = option.value === fuel;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${option.label}: ${option.description}`}
                onPress={() => setFuel(option.value)}
                style={({ pressed }) => [styles.fuelOption, selected && styles.optionSelected, pressed && styles.pressed]}>
                <Icon name={option.icon} color={colors.text.secondary} />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{option.label}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {option.description}
                  </AppText>
                </View>
                <Icon name={selected ? 'checked' : 'unchecked'} color={selected ? colors.brand.accent : colors.text.muted} />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Dónde cambiarlo después, con la ruta exacta. */}
      <View style={styles.hint}>
        <Icon name="info" size={18} color={colors.brand.accent} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          Puedes cambiarlo después en <AppText variant="captionStrong">Configuración → Mi estilo</AppText>. Tus datos
          no se pierden al cambiar.
        </AppText>
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  options: {
    gap: spacing.md,
  },
  option: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.brand.accent,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  flex: {
    flex: 1,
  },
  fuel: {
    gap: spacing.sm,
  },
  fuelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
}));
