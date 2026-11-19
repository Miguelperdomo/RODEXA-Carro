import { StyleSheet, View } from 'react-native';

import { creditDueDayPassed, MAX_INSTALLMENTS, monthLabel } from '@/features/credit/credit';
import { spacing } from '@/shared/theme';
import { AppText, Chip, Field, NumberField } from '@/shared/ui';
import { toISODate } from '@/shared/utils/date';

import type { StepProps } from './types';

/**
 * Paso opcional — ¿Tu carro está a crédito? Con 4 datos queda el aviso de cada cuota y cuándo
 * terminas. RODEXA no calcula intereses: solo cuenta cuotas. Se puede saltar.
 */
export function CreditStep({ form, update, errors }: StepProps) {
  const now = new Date();
  const dayOk = form.creditDay !== null && form.creditDay >= 1 && form.creditDay <= 31;
  const askThisMonth = form.creditHas === true && dayOk && creditDueDayPassed(form.creditDay!, now);
  const month = monthLabel(toISODate(now).slice(0, 7)).split(' ')[0].toLowerCase();

  return (
    <>
      <Field label="¿Tu carro está a crédito o leasing?" optional>
        <View style={styles.chips}>
          <Chip label="Sí" selected={form.creditHas === true} onPress={() => update({ creditHas: true })} />
          <Chip label="No" selected={form.creditHas === false} onPress={() => update({ creditHas: false })} />
        </View>
      </Field>

      {form.creditHas === true && (
        <>
          <Field label="Valor de la cuota" error={errors.creditAmount} hint="Lo encuentras en tu contrato o extracto.">
            <NumberField
              value={form.creditAmount}
              onChange={(creditAmount) => update({ creditAmount })}
              prefix="$"
              size="md"
              invalid={!!errors.creditAmount}
              accessibilityLabel="Valor de la cuota"
            />
          </Field>
          <Field label="¿Cuántas cuotas son en total?" error={errors.creditTotal} hint={`De 1 a ${MAX_INSTALLMENTS}.`}>
            <NumberField
              value={form.creditTotal}
              onChange={(creditTotal) => update({ creditTotal })}
              grouping={false}
              maxDigits={3}
              size="md"
              invalid={!!errors.creditTotal}
              accessibilityLabel="Cuotas en total"
            />
          </Field>
          <Field label="¿Cuántas ya pagaste?" optional error={errors.creditPaid}>
            <NumberField
              value={form.creditPaid}
              onChange={(creditPaid) => update({ creditPaid })}
              grouping={false}
              maxDigits={3}
              size="md"
              invalid={!!errors.creditPaid}
              accessibilityLabel="Cuotas ya pagadas"
            />
          </Field>
          <Field label="Día del mes en que pagas" error={errors.creditDay}>
            <NumberField
              value={form.creditDay}
              onChange={(creditDay) => update({ creditDay, creditPaidThisMonth: null })}
              grouping={false}
              maxDigits={2}
              size="md"
              invalid={!!errors.creditDay}
              accessibilityLabel="Día de pago"
            />
          </Field>
          {askThisMonth && (
            <Field label={`¿Ya pagaste la cuota de ${month}?`} error={errors.creditPaidThisMonth}>
              <View style={styles.chips}>
                <Chip
                  label="Sí, y la conté arriba"
                  selected={form.creditPaidThisMonth === true}
                  onPress={() => update({ creditPaidThisMonth: true })}
                />
                <Chip
                  label="Todavía no"
                  selected={form.creditPaidThisMonth === false}
                  onPress={() => update({ creditPaidThisMonth: false })}
                />
              </View>
            </Field>
          )}
          <AppText variant="caption" tone="muted">
            Te avisamos 2 días antes de cada cuota y te decimos cuándo terminas. RODEXA no calcula intereses.
          </AppText>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
