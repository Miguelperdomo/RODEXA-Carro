import { router } from 'expo-router';
import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon } from '@/shared/ui';

/** Acceso desde Inicio a la revisión "Voy a viajar". */
export function TravelCard() {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Card tone="highlight">
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name="travel" color={colors.brand.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">¿Vas a viajar?</AppText>
          <AppText variant="caption" tone="secondary">
            Revisa tu carro antes de salir.
          </AppText>
        </View>
      </View>
      <View style={styles.action}>
        <Button
          label="Revisar carro"
          icon="checklist"
          variant="secondary"
          onPress={() => router.push('/revision-viaje')}
        />
      </View>
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
}));
