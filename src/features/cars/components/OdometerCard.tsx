import { View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon } from '@/shared/ui';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { useSettings } from '@/features/settings/SettingsProvider';
import { kmSinceLast } from '@/features/odometer/sinceLast';
import { useAppData } from '@/features/session/SessionProvider';
import { useCountUp } from '@/shared/hooks/useCountUp';
import { formatDaysAgo, formatKm } from '@/shared/utils/format';

import type { OdometerSummary } from '../types';

type OdometerCardProps = {
  odometer: OdometerSummary;
  onUpdate: () => void;
};

/** Kilometraje registrado (protagonista) y estimado (separado, con "~"). */
export function OdometerCard({ odometer, onUpdate }: OdometerCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { settings } = useSettings();
  const { history } = useAppData();
  const { estimate } = odometer;
  // El número sube rodando cuando registras un km nuevo (quieto si el celular apaga las animaciones).
  const shownKm = useCountUp(odometer.registeredKm);
  const since = kmSinceLast(history);

  return (
    <Card>
      <AppText variant="caption" tone="secondary">
        Kilometraje registrado
      </AppText>
      <AppText variant="display" numeric accessibilityLabel={formatKm(odometer.registeredKm)}>
        {formatKm(shownKm)}
      </AppText>
      {since !== undefined && (
        <AppText variant="captionStrong" color={colors.status.ok.color}>
          +{formatKm(since)} desde la última vez
        </AppText>
      )}
      <AppText variant="caption" tone="secondary">
        Último registro: {formatDate(parseISODate(odometer.lastReadingDate))} (
        {formatDaysAgo(odometer.daysSinceReading)})
      </AppText>

      {!settings.showEstimate ? (
        <View style={styles.spacer} />
      ) : (
      <View style={styles.estimate}>
        <Icon name="info" size={sizes.iconSm} color={colors.text.muted} />
        <View style={styles.estimateTexts}>
          {estimate.kind === 'available' ? (
            <>
              <AppText variant="bodyStrong" numeric>
                ~{formatKm(estimate.km)} estimado
              </AppText>
              <AppText variant="caption" tone="secondary">
                Aproximado según tu ritmo (~{formatKm(estimate.kmPerDay)}/día). No reemplaza tu registro.
              </AppText>
            </>
          ) : (
            <AppText variant="bodyStrong">Estimado: sin suficiente información</AppText>
          )}
        </View>
      </View>
      )}

      <Button label="Actualizar kilometraje" icon="odometer" fullWidth onPress={onUpdate} />
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  spacer: {
    height: spacing.lg,
  },
  estimate: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  estimateTexts: {
    flex: 1,
    gap: 2,
  },
}));
