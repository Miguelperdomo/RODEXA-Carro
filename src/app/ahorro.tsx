import { useState } from 'react';
import { Share, View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { savingsShareText, transitSavings, tripsPerMonth } from '@/features/savings/transitSavings';
import { computeMonthStats } from '@/features/stats/compute';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Chip, Field, FormScreen, InfoRow, NumberField, useToast } from '@/shared/ui';
import { formatMonthYear, today, toISODate } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

const TRIPS_PER_DAY = [1, 2, 3, 4];
const DAYS_PER_WEEK = [3, 5, 6, 7];

/**
 * "¿Cuánto me ahorro en carro?": lo que costarían tus viajes en transporte público (el pasaje y
 * los viajes los escribes tú: las tarifas cambian por ciudad y RODEXA no las inventa) frente a
 * lo que de verdad le gastaste al carro este mes (tus registros). Si sale más caro, lo dice.
 */
export default function SavingsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { history } = useAppData();
  const { settings, update } = useSettings();
  const [fare, setFare] = useState<number | null>(settings.transitFareCop > 0 ? settings.transitFareCop : null);
  const [perDay, setPerDay] = useState(2);
  const [days, setDays] = useState(5);
  const [showForm, setShowForm] = useState(settings.transitFareCop <= 0 || settings.transitTripsPerMonth <= 0);

  const now = today();
  const spentThisMonth = computeMonthStats(history, toISODate(now).slice(0, 7), now).totalCop;
  const result = transitSavings(settings.transitFareCop, settings.transitTripsPerMonth, spentThisMonth);
  const monthName = formatMonthYear(now).split(' ')[0].toLowerCase();

  const save = () => {
    if (!fare || fare <= 0) {
      toast.show('Escribe cuánto vale un pasaje');
      return;
    }
    update({ transitFareCop: fare, transitTripsPerMonth: tripsPerMonth(perDay, days) });
    setShowForm(false);
  };

  const share = async () => {
    if (!result) return;
    try {
      await Share.share({ message: savingsShareText(result, monthName) });
    } catch {
      toast.show('No se pudo abrir el menú para compartir');
    }
  };

  return (
    <FormScreen
      title="¿Cuánto me ahorro en carro?"
      closeIcon="back"
      footer={
        showForm ? (
          <Button label="Calcular" fullWidth onPress={save} />
        ) : result ? (
          <Button label="Compartir" icon="share" fullWidth onPress={() => void share()} />
        ) : undefined
      }>
      {showForm || !result ? (
        <>
          <AppText tone="secondary">
            Si no tuvieras carro, ¿cuánto pagarías en el transporte público de tu ciudad? Escribe el valor del pasaje que
            pagas: RODEXA no lo inventa.
          </AppText>
          <Field label="Valor de un pasaje">
            <NumberField value={fare} onChange={setFare} prefix="$" accessibilityLabel="Valor de un pasaje" />
          </Field>
          <Field label="Viajes al día">
            <View style={styles.chips}>
              {TRIPS_PER_DAY.map((n) => (
                <Chip key={n} label={String(n)} selected={perDay === n} onPress={() => setPerDay(n)} />
              ))}
            </View>
          </Field>
          <Field label="Días a la semana">
            <View style={styles.chips}>
              {DAYS_PER_WEEK.map((n) => (
                <Chip key={n} label={String(n)} selected={days === n} onPress={() => setDays(n)} />
              ))}
            </View>
          </Field>
        </>
      ) : (
        <>
          <Card tone="highlight">
            <AppText variant="captionStrong" tone="secondary">
              EN {monthName.toUpperCase()}
            </AppText>
            {result.savedCop > 0 ? (
              <>
                <AppText variant="display" color={colors.status.ok.color} numeric>
                  {formatCop(result.savedCop)}
                </AppText>
                <AppText tone="secondary">es lo que te ahorraste frente al transporte público.</AppText>
              </>
            ) : (
              <>
                <AppText variant="display" color={colors.status.due.color} numeric>
                  {formatCop(Math.abs(result.savedCop))}
                </AppText>
                <AppText tone="secondary">
                  {result.savedCop === 0
                    ? 'Este mes el carro te costó lo mismo que el transporte público.'
                    : 'Este mes el carro te salió más caro que el transporte público.'}
                </AppText>
              </>
            )}
          </Card>
          <Card>
            <InfoRow label="Transporte público" value={formatCop(result.transitCop)} />
            <InfoRow label="Viajes al mes" value={String(settings.transitTripsPerMonth)} divider />
            <InfoRow label="Gastos del carro este mes" value={formatCop(result.carCop)} divider />
          </Card>
          <AppText variant="caption" tone="muted">
            Con el pasaje que escribiste y los gastos que registraste este mes. Si te faltan gastos por anotar, el ahorro es
            menor.
          </AppText>
          <Button label="Cambiar pasaje y viajes" variant="ghost" fullWidth onPress={() => setShowForm(true)} />
        </>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
}));
