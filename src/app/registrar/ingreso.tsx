import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  incomeSavedMessage,
  lastWork,
  QUICK_AMOUNTS,
  validateIncome,
  WORK_TYPES,
  type NewIncome,
  type WorkType,
} from '@/features/income/income';
import { useSession } from '@/features/session/SessionProvider';
import { newId } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { spacing } from '@/shared/theme';
import { Button, Chip, DateField, Field, FormScreen, NumberField, OptionGrid, TextField, useToast } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';

const WORK_OPTIONS = WORK_TYPES.map((w) => ({ value: w.code, label: w.label, icon: w.icon }));

/** Registrar un ingreso: valor (con atajos que suman), en qué trabajó, fecha y nota. */
export default function RegisterIncomeScreen() {
  const toast = useToast();
  const persist = usePersist();
  const { incomes, setIncomes } = useSession();
  const [amount, setAmount] = useState<number | null>(null);
  // Queda elegido el último tipo de trabajo usado.
  const [work, setWork] = useState<WorkType | null>(() => lastWork(incomes));
  const [date, setDate] = useState(() => today());
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const errors = validateIncome({ amount, work });
  const shown = submitted ? errors : {};

  const save = async () => {
    setSubmitted(true);
    if (errors.amount || errors.work || amount === null || work === null) return;
    const income: NewIncome = { date: toISODate(date), amountCop: amount, work, ...(note.trim() ? { note: note.trim() } : {}) };
    if (!(await persist(() => setIncomes([...incomes, { ...income, id: newId('income') }])))) return;
    toast.show(incomeSavedMessage(incomes, income, today()));
    router.back();
  };

  return (
    <FormScreen title="Registrar ingreso" closeIcon="back" footer={<Button label="Guardar ingreso" icon="check" fullWidth onPress={save} />}>
      <Field label="¿Cuánto generaste?" error={shown.amount}>
        <NumberField value={amount} onChange={setAmount} prefix="$" invalid={!!shown.amount} accessibilityLabel="Valor del ingreso" />
        <View style={styles.chips}>
          {QUICK_AMOUNTS.map((v) => (
            <Chip
              key={v}
              label={`+${v / 1000} mil`}
              selected={false}
              onPress={() => setAmount((current) => (current ?? 0) + v)}
            />
          ))}
        </View>
      </Field>

      <Field label="¿En qué trabajaste?" error={shown.work}>
        <OptionGrid
          options={WORK_OPTIONS}
          selected={work ? [work] : []}
          onToggle={(code) => setWork((current) => (current === code ? null : code))}
        />
      </Field>

      <Field label="Fecha">
        <DateField value={date} onChange={setDate} />
      </Field>

      <Field label="Nota" optional>
        <TextField value={note} onChange={setNote} placeholder="Ej.: Turno de la mañana" maxLength={120} accessibilityLabel="Nota" />
      </Field>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
