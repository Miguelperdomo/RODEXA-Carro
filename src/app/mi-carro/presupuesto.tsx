import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BudgetBar } from '@/features/budget/components/BudgetBar';
import { budgetStatus, validateBudget, type BudgetConfig } from '@/features/budget/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Field, FormScreen, Icon, NumberField, useToast } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';
import { appAlert } from '@/shared/ui/AppDialog';

/**
 * Presupuesto mensual: el usuario elige cuánto quiere gastar como máximo al mes en su
 * carro. RODEXA no sugiere montos; compara con lo registrado y avisa desde el 80 %.
 */
export default function BudgetScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { dashboard } = useAppData();
  const { budget, setBudget } = useSession();
  const [amount, setAmount] = useState<number | null>(budget?.monthlyCop ?? null);
  const [submitted, setSubmitted] = useState(false);

  const error = validateBudget(amount);
  const spent = dashboard.month.totalCop;
  // Vista previa con el valor que se está escribiendo (o el guardado).
  const preview = budgetStatus(
    !error && amount !== null ? { monthlyCop: amount, updatedAt: '' } : budget,
    spent,
  );

  const save = async () => {
    setSubmitted(true);
    if (error || amount === null) return;
    const config: BudgetConfig = { monthlyCop: amount, updatedAt: toISODate(today()) };
    if (!(await persist(() => setBudget(config)))) return;
    toast.show('Presupuesto guardado');
    router.back();
  };

  const remove = () =>
    appAlert('¿Quitar el presupuesto?', 'Dejarás de ver el avance y los avisos del presupuesto.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => setBudget(null)))) return;
          toast.show('Presupuesto quitado');
          router.back();
        },
      },
    ]);

  return (
    <FormScreen
      title="Presupuesto mensual"
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button label="Guardar" fullWidth onPress={save} />
          {budget && <Button label="Quitar presupuesto" variant="ghost" fullWidth onPress={remove} />}
        </View>
      }>
      <AppText tone="secondary">
        Elige cuánto quieres gastar como máximo al mes en tu carro. Te avisamos cuando llegues al 80 % y si te pasas.
      </AppText>

      <Field label="¿Cuánto quieres gastar como máximo al mes?" error={submitted ? error : undefined}>
        <NumberField
          value={amount}
          onChange={setAmount}
          prefix="$"
          autoFocus={!budget}
          invalid={submitted && !!error}
          accessibilityLabel="Presupuesto mensual"
        />
      </Field>

      <Card style={styles.card}>
        <AppText variant="bodyStrong">Este mes</AppText>
        {preview ? (
          <BudgetBar status={preview} />
        ) : (
          <AppText variant="caption" tone="secondary">
            Llevas {formatCop(spent)} registrados este mes. Escribe un valor para ver cómo vas.
          </AppText>
        )}
      </Card>

      <View style={styles.note}>
        <Icon name="info" size={18} color={colors.text.secondary} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          Cuenta todo lo que registras con valor en el mes: cargas de combustible o energía, mantenimientos, gastos y documentos. Es lo
          mismo que ves en &quot;Este mes&quot; y en Estadísticas. El valor lo decides tú: RODEXA no sugiere montos.
        </AppText>
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  flex: {
    flex: 1,
  },
  footer: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
}));
