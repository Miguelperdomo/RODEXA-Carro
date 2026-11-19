import { router } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import { creditOf, creditPayments, creditProgress, creditShort, monthLabel } from '@/features/credit/credit';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, radius, spacing } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, InfoRow, SectionHeader, useToast } from '@/shared/ui';
import { formatDate, parseISODate, today, toISODate } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';
import { appAlert } from '@/shared/ui/AppDialog';

/**
 * Crédito de mi carro: cuotas pagadas, progreso, próxima cuota y cuándo terminas. Los pagos se
 * registran como gasto (no se anotan dos veces) y "Hoy" pregunta por la cuota desde su día.
 */
export default function CreditScreen() {
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { history } = useAppData();
  const { recurringExpenses, setRecurringExpenses } = useSession();
  const credit = creditOf(recurringExpenses);

  if (!credit) {
    return (
      <FormScreen title="Crédito del carro" closeIcon="back">
        <EmptyState
          icon="loan"
          title="¿Tu carro está a crédito o leasing?"
          message="Anota la cuota y cuántas son: te avisamos 2 días antes de cada pago y te decimos cuándo terminas."
          action={<Button label="Anotar mi crédito" onPress={() => router.push('/mi-carro/credito-editar')} />}
        />
      </FormScreen>
    );
  }

  const now = today();
  const p = creditProgress(credit, history, now);
  const payments = creditPayments(credit, history).slice(0, 6);
  const dueThisMonth = !p.finished && !p.paidThisMonth && p.nextDue !== undefined && p.nextDue <= toISODate(now);
  const month = monthLabel(toISODate(now).slice(0, 7)).split(' ')[0].toLowerCase();

  const remove = () =>
    appAlert('¿Quitar el crédito?', 'Los pagos que ya registraste se conservan en tu historial.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => setRecurringExpenses(recurringExpenses.filter((r) => r.id !== credit.id))))) return;
          toast.show('Crédito quitado');
          router.back();
        },
      },
    ]);

  return (
    <FormScreen title="Crédito del carro" closeIcon="back">
      <Card>
        <AppText variant="heading">{creditShort(p)}</AppText>
        <View style={styles.bar} accessible accessibilityLabel={`${p.paid} de ${p.total} cuotas pagadas`}>
          <View style={[styles.fill, { width: `${Math.round(p.ratio * 100)}%` }]} />
        </View>
        <AppText tone="secondary" numeric>
          {p.paid} de {p.total} cuotas pagadas
        </AppText>
      </Card>

      {dueThisMonth && (
        <Card tone="highlight">
          <AppText variant="bodyStrong">¿Ya pagaste la cuota de {month}?</AppText>
          <AppText variant="caption" tone="secondary">
            Regístrala como gasto: así se cuenta la cuota y sabes cuánto te cuesta el carro.
          </AppText>
          <View style={styles.action}>
            <Button
              label="Registrar el pago"
              icon="check"
              onPress={() => router.push({ pathname: '/registrar/gasto', params: { recurrente: credit.id } })}
            />
          </View>
        </Card>
      )}

      <Card>
        <InfoRow label="Cuota" value={formatCop(credit.amountCop)} />
        <InfoRow label="Día de pago" value={`El ${credit.dayOfMonth} de cada mes`} divider />
        {p.nextDue && <InfoRow label="Próxima cuota" value={formatDate(parseISODate(p.nextDue))} divider />}
        <InfoRow label="Pagado (cuota fija)" value={formatCop(p.paidCop)} divider />
        {!p.finished && <InfoRow label="Falta (cuota fija)" value={formatCop(p.remainingCop)} divider />}
      </Card>
      <AppText variant="caption" tone="muted">
        Las cuentas usan el valor de la cuota que escribiste. RODEXA no calcula intereses, mora ni abonos a capital.
      </AppText>

      {payments.length > 0 && (
        <View>
          <SectionHeader title="Pagos registrados en RODEXA" />
          <Card flush>
            {payments.map((e, i) => (
              <Fragment key={e.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <AppText style={styles.flex}>{formatDate(parseISODate(e.date))}</AppText>
                  <AppText variant="bodyStrong" numeric>
                    {formatCop(e.amountCop)}
                  </AppText>
                </View>
              </Fragment>
            ))}
          </Card>
        </View>
      )}

      <View style={styles.footer}>
        <Button label="Editar crédito" variant="secondary" fullWidth onPress={() => router.push('/mi-carro/credito-editar')} />
        <Button label="Quitar crédito" variant="ghost" fullWidth onPress={remove} />
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  bar: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
  },
  action: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  footer: {
    gap: spacing.xs,
  },
}));
