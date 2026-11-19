import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EXPENSE_CATEGORIES, NEW_EXPENSE_CATEGORIES, type ExpenseCategoryCode } from '@/features/expenses/catalog';
import { MAX_RECURRING, validateRecurring, type RecurringExpense } from '@/features/recurring/rules';
import { useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { newId } from '@/features/session/userDataActions';
import { createStyles, spacing } from '@/shared/theme';
import { Button, Field, FormScreen, NumberField, OptionGrid, TextField, useToast } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';
import { appAlert } from '@/shared/ui/AppDialog';

const toOptions = (list: typeof EXPENSE_CATEGORIES) => list.map((c) => ({ value: c.code, label: c.label, icon: c.icon }));
const CATEGORY_OPTIONS = toOptions(NEW_EXPENSE_CATEGORIES);
/** Al editar el "Combustible del mes" de Tranqui, su categoría se sigue mostrando. */
const ALL_CATEGORY_OPTIONS = toOptions(EXPENSE_CATEGORIES);

/** Crear o cambiar un gasto que se repite (con ?id= se edita). */
export default function RecurringExpenseFormScreen() {
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { recurringExpenses, setRecurringExpenses } = useSession();
  const editing = recurringExpenses.find((r) => r.id === id);

  const [category, setCategory] = useState<ExpenseCategoryCode | null>(editing?.category ?? null);
  const [amount, setAmount] = useState<number | null>(editing?.amountCop ?? null);
  const [day, setDay] = useState<number | null>(editing?.dayOfMonth ?? today().getDate());
  const [note, setNote] = useState(editing?.note ?? '');
  const [submitted, setSubmitted] = useState(false);

  const fuelItem = editing?.category === 'fuel';
  const errors = validateRecurring({ category, amountCop: amount, dayOfMonth: day }, { allowFuel: fuelItem });
  const shown = submitted ? errors : {};
  const full = !editing && recurringExpenses.length >= MAX_RECURRING;

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || category === null || amount === null || day === null || full) return;
    const item: RecurringExpense = {
      id: editing?.id ?? newId('rec'),
      category,
      amountCop: amount,
      dayOfMonth: day,
      createdAt: editing?.createdAt ?? toISODate(today()),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(editing?.paused ? { paused: true } : {}),
    };
    const list = editing ? recurringExpenses.map((r) => (r.id === item.id ? item : r)) : [...recurringExpenses, item];
    if (!(await persist(() => setRecurringExpenses(list)))) return;
    toast.show(editing ? 'Cambios guardados' : 'Gasto que se repite guardado');
    router.back();
  };

  const remove = () =>
    appAlert('¿Quitar este gasto que se repite?', 'Los pagos que ya registraste se conservan en tu historial.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => setRecurringExpenses(recurringExpenses.filter((r) => r.id !== editing?.id))))) return;
          toast.show('Gasto que se repite quitado');
          router.back();
        },
      },
    ]);

  return (
    <FormScreen
      title={editing ? 'Gasto que se repite' : 'Nuevo gasto que se repite'}
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button label={full ? `Máximo ${MAX_RECURRING}` : 'Guardar'} fullWidth onPress={save} />
          {editing && <Button label="Quitar" variant="ghost" fullWidth onPress={remove} />}
        </View>
      }>
      <Field label="¿Cuánto pagas cada mes?" error={shown.amount}>
        <NumberField value={amount} onChange={setAmount} prefix="$" invalid={!!shown.amount} accessibilityLabel="Valor mensual" />
      </Field>

      <Field label="Categoría" error={shown.category}>
        <OptionGrid
          options={fuelItem ? ALL_CATEGORY_OPTIONS : CATEGORY_OPTIONS}
          selected={category ? [category] : []}
          onToggle={(code) => setCategory((current) => (current === code ? null : code))}
          columns={3}
        />
      </Field>

      <Field
        label="¿Qué día del mes lo pagas?"
        hint="En los meses más cortos se toma el último día."
        error={shown.day}>
        <NumberField value={day} onChange={setDay} maxDigits={2} grouping={false} invalid={!!shown.day} accessibilityLabel="Día del mes" />
      </Field>

      <Field label="Nombre" optional hint="Si no escribes uno, se usa el de la categoría.">
        <TextField value={note} onChange={setNote} placeholder="Ej.: Garaje del edificio" maxLength={60} accessibilityLabel="Nombre" />
      </Field>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  footer: {
    gap: spacing.sm,
  },
}));
