import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  buildCredit,
  creditDueDayPassed,
  creditOf,
  MAX_INSTALLMENTS,
  monthLabel,
  validateCredit,
} from '@/features/credit/credit';
import { creditPaidCount } from '@/features/recurring/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { newId } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { spacing } from '@/shared/theme';
import { AppText, Button, Chip, Field, FormScreen, NumberField, useToast } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';

/** Anotar o cambiar el crédito del carro (cuota, cuotas, pagadas y día de pago). */
export default function CreditFormScreen() {
  const toast = useToast();
  const persist = usePersist();
  const { history } = useAppData();
  const { recurringExpenses, setRecurringExpenses } = useSession();
  const editing = creditOf(recurringExpenses);
  // Al editar, "pagadas" muestra las que lleva hoy (las de antes + las registradas en RODEXA).
  const registered = editing ? creditPaidCount(editing, history) - editing.credit.paidBefore : 0;
  const [amount, setAmount] = useState<number | null>(editing?.amountCop ?? null);
  const [total, setTotal] = useState<number | null>(editing?.credit.totalInstallments ?? null);
  const [paid, setPaid] = useState<number | null>(editing ? editing.credit.paidBefore + registered : null);
  const [day, setDay] = useState<number | null>(editing?.dayOfMonth ?? null);
  const [paidThisMonth, setPaidThisMonth] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const errors = validateCredit({ amountCop: amount, totalInstallments: total, paidBefore: paid, dayOfMonth: day });
  const now = today();
  const askThisMonth = !editing && day !== null && !errors.day && creditDueDayPassed(day, now);
  const monthError = submitted && askThisMonth && paidThisMonth === null ? 'Elige una opción.' : undefined;
  const shown = submitted ? errors : {};
  const month = monthLabel(toISODate(now).slice(0, 7)).split(' ')[0].toLowerCase();

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || amount === null || total === null || day === null) return;
    if (askThisMonth && paidThisMonth === null) return;
    const paidCount = paid ?? 0;
    const item = editing
      ? {
          ...editing,
          amountCop: amount,
          dayOfMonth: day,
          // "Pagadas" es el total de hoy: lo registrado en RODEXA se sigue contando aparte.
          credit: { totalInstallments: total, paidBefore: Math.max(0, Math.min(paidCount - registered, total - 1)) },
        }
      : buildCredit(
          { amountCop: amount, totalInstallments: total, paidBefore: paidCount, dayOfMonth: day, paidThisMonth },
          newId('credit'),
          now,
        );
    const list = editing ? recurringExpenses.map((r) => (r.id === item.id ? item : r)) : [...recurringExpenses, item];
    if (!(await persist(() => setRecurringExpenses(list)))) return;
    toast.show(editing ? 'Cambios guardados' : 'Crédito guardado');
    router.back();
  };

  return (
    <FormScreen
      title={editing ? 'Editar crédito' : 'Crédito del carro'}
      closeIcon="back"
      footer={<Button label="Guardar" fullWidth onPress={save} />}>
      <Field label="Valor de la cuota" error={shown.amount} hint="Lo encuentras en tu contrato o extracto.">
        <NumberField value={amount} onChange={setAmount} prefix="$" invalid={!!shown.amount} accessibilityLabel="Valor de la cuota" />
      </Field>
      <Field label="¿Cuántas cuotas son en total?" error={shown.total} hint={`De 1 a ${MAX_INSTALLMENTS}.`}>
        <NumberField value={total} onChange={setTotal} grouping={false} maxDigits={3} size="md" invalid={!!shown.total} accessibilityLabel="Cuotas en total" />
      </Field>
      <Field label="¿Cuántas llevas pagadas?" optional error={shown.paid}>
        <NumberField value={paid} onChange={setPaid} grouping={false} maxDigits={3} size="md" invalid={!!shown.paid} accessibilityLabel="Cuotas pagadas" />
      </Field>
      <Field label="Día del mes en que pagas" error={shown.day} hint="En los meses más cortos se toma el último día.">
        <NumberField
          value={day}
          onChange={(v) => {
            setDay(v);
            setPaidThisMonth(null);
          }}
          grouping={false}
          maxDigits={2}
          size="md"
          invalid={!!shown.day}
          accessibilityLabel="Día de pago"
        />
      </Field>
      {askThisMonth && (
        <Field label={`¿Ya pagaste la cuota de ${month}?`} error={monthError}>
          <View style={styles.chips}>
            <Chip label="Sí, y la conté arriba" selected={paidThisMonth === true} onPress={() => setPaidThisMonth(true)} />
            <Chip label="Todavía no" selected={paidThisMonth === false} onPress={() => setPaidThisMonth(false)} />
          </View>
        </Field>
      )}
      <AppText variant="caption" tone="muted">
        Te avisamos 2 días antes de cada cuota y te decimos cuándo terminas. RODEXA no calcula intereses: solo cuenta cuotas
        con el valor que escribes.
      </AppText>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
