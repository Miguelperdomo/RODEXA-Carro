import { View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon } from '@/shared/ui';
import { today } from '@/shared/utils/date';

import { currentRainSeason, departmentOfCity, RAIN_ADVICE, seasonEndText } from '../rainSeasons';

/**
 * Inicio: aviso de temporada de lluvias (IDEAM, fechas aproximadas) solo DURANTE la temporada y
 * solo donde las fechas están confirmadas. "Entendido" lo cierra hasta la próxima temporada.
 */
export function RainSeasonCard() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAppData();
  const { settings, update } = useSettings();
  const season = currentRainSeason(today(), departmentOfCity(user.cityId));
  if (!season || settings.rainSeasonDismissed === season.key) return null;

  return (
    <Card>
      <View style={styles.header}>
        <Icon name="info" color={colors.brand.accent} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Estamos en la {season.label}</AppText>
          <AppText variant="caption" tone="secondary">
            Según el IDEAM, {seasonEndText(season)}. {RAIN_ADVICE}
          </AppText>
        </View>
      </View>
      <View style={styles.action}>
        <Button label="Entendido" variant="ghost" onPress={() => update({ rainSeasonDismissed: season.key })} />
      </View>
    </Card>
  );
}

const useStyles = createStyles(() => ({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  action: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
}));
