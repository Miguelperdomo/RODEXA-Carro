import { useState } from 'react';
import { View } from 'react-native';

import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { UsageStyle } from '@/features/settings/types';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon, NumberField, useToast } from '@/shared/ui';
import { addDays, toISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

import { fuelWords, monthlyFuelExpense, SUGGESTION_SNOOZE_DAYS } from '../style';
import { useApplyStyle } from '../useApplyStyle';

/** Tranqui + "un valor al mes": "¿Cuánto gastas en combustible al mes, más o menos?". */
export function MonthlyFuelCard() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { profile } = useAppData();
  const { recurringExpenses, setRecurringExpenses } = useSession();
  const { update } = useSettings();
  const [amount, setAmount] = useState<number | null>(null);
  const words = fuelWords(profile);

  const save = async () => {
    if (amount === null || amount <= 0) return;
    const item = monthlyFuelExpense(amount, today(), words.monthName);
    if (!(await persist(() => setRecurringExpenses([...recurringExpenses, item])))) return;
    toast.show(`${words.monthName}: ${formatCop(amount)}. A fin de mes solo confirmas`);
  };

  return (
    <Card tone="highlight">
      <View style={styles.header}>
        <Icon name="fuel" color={colors.brand.accent} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">¿Cuánto gastas en {words.noun} al mes?</AppText>
          <AppText variant="caption" tone="secondary">
            Un valor aproximado. A fin de mes te preguntamos si fue ese valor y no tienes que registrar cada carga.
          </AppText>
        </View>
      </View>
      <View style={styles.body}>
        <NumberField value={amount} onChange={setAmount} prefix="$" size="md" accessibilityLabel={`${words.monthName}: valor`} />
        <View style={styles.actions}>
          <Button label="Guardar" icon="check" disabled={amount === null || amount <= 0} onPress={save} />
          <Button
            label="Prefiero no llevarlo"
            variant="ghost"
            onPress={() => {
              update({ fuelTracking: 'none' });
              toast.show(`No te pediremos ${words.topic}`);
            }}
          />
        </View>
      </View>
    </Card>
  );
}

/** "Parece que te gusta el detalle" / "¿Te cuesta registrar todo?". Con "No, gracias". */
export function StyleSuggestionCard({ suggest }: { suggest: UsageStyle }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { update } = useSettings();
  const applyStyle = useApplyStyle();
  const toDetail = suggest === 'detail';

  const accept = () => {
    applyStyle({ usageStyle: suggest });
    toast.show(toDetail ? 'Estilo cambiado a Al detalle' : 'Estilo cambiado a Tranqui');
  };
  const decline = () => update({ styleSuggestionSnoozedUntil: toISODate(addDays(today(), SUGGESTION_SNOOZE_DAYS)) });

  return (
    <Card tone="highlight">
      <View style={styles.header}>
        <Icon name={toDetail ? 'stats' : 'usagePersonal'} color={colors.brand.accent} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">
            {toDetail ? 'Parece que te gusta el detalle' : '¿Te cuesta registrar todo?'}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {toDetail
              ? '¿Cambiamos al estilo Al detalle? Verás cuánto rinde tu carro, en qué gastas y más.'
              : 'Prueba el estilo Tranqui: no te pedimos el km ni el combustible a cada rato, solo te avisamos lo importante.'}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label={toDetail ? 'Sí, cambiar' : 'Probar Tranqui'} onPress={accept} />
        <Button label="No, gracias" variant="ghost" onPress={decline} />
      </View>
      <AppText variant="caption" tone="muted" style={styles.note}>
        Puedes cambiarlo cuando quieras en Configuración → Mi estilo.
      </AppText>
    </Card>
  );
}

const useStyles = createStyles(() => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  body: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  note: {
    marginTop: spacing.sm,
  },
}));
