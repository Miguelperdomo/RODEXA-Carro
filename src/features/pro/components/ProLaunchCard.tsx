import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Icon } from '@/shared/ui';

import { PRO_AVAILABLE, PRO_TRIAL_DAYS } from '../config';

/** ¿Se muestra el aviso del lanzamiento? Solo cuando Pro exista, a quien lo pidió y una sola vez. */
export function shouldShowProLaunch(available: boolean, notifyMe: boolean, seen: boolean): boolean {
  return available && notifyMe && !seen;
}

/**
 * "Avísame cuando salga": el día que Pro deje de estar en "Próximamente", quien lo pidió lo
 * ve PRIMERO en Inicio (una sola vez). Mientras sea "Próximamente", no se muestra nada.
 * RODEXA no tiene servidor: el aviso llega con la actualización de la app.
 */
export function ProLaunchCard() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { settings, update } = useSettings();
  if (!shouldShowProLaunch(PRO_AVAILABLE, settings.proNotifyMe, settings.proLaunchSeen)) return null;

  const seen = () => update({ proLaunchSeen: true });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <AppText variant="heading" color={colors.brand.onPrimary} style={styles.flex}>
          ✦ RODEXA Pro ya está disponible
        </AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={seen} hitSlop={8}>
          <Icon name="close" color={colors.brand.onPrimary} />
        </Pressable>
      </View>
      <AppText color={colors.brand.onPrimary}>
        Pediste que te avisáramos: eres de los primeros en verlo. Pruébalo {PRO_TRIAL_DAYS} días gratis.
      </AppText>
      <Button
        label="Ver RODEXA Pro"
        variant="secondary"
        onPress={() => {
          seen();
          router.push('/pro');
        }}
      />
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
