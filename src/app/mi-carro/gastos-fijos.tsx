import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { paidInMonth, recurringDue, recurringIcon, recurringLabel } from '@/features/recurring/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, Icon } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

/**
 * Gastos que se repiten cada mes. No se registran solos: cada mes, desde el día de pago,
 * Inicio pregunta "¿Ya pagaste…?" y se registra con un toque.
 */
export default function RecurringExpensesScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { recurringExpenses } = useSession();
  const { history } = useAppData();
  const now = today();
  const monthKey = toISODate(now).slice(0, 7);
  const dueIds = new Set(recurringDue(recurringExpenses, history, now).map((d) => d.item.id));
  // Los que están en pausa (el "Combustible del mes" fuera de Tranqui) no suman.
  const monthlyTotal = recurringExpenses.reduce((sum, r) => sum + (r.paused ? 0 : r.amountCop), 0);

  return (
    <FormScreen
      title="Gastos que se repiten"
      closeIcon="back"
      footer={<Button label="Agregar gasto que se repite" icon="add" fullWidth onPress={() => router.push('/mi-carro/gasto-fijo')} />}>
      <AppText tone="secondary">
        Garaje, cuota del crédito, seguro… Cada mes, desde el día de pago, te preguntamos en Inicio si ya lo pagaste y lo
        registras con un toque. Nunca se registra solo.
      </AppText>

      {recurringExpenses.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Aún no tienes gastos que se repiten"
          message="También puedes marcar «Se repite cada mes» al registrar un gasto."
        />
      ) : (
        <>
          <Card flush>
            {recurringExpenses.map((item, i) => {
              const paid = paidInMonth(item, history, monthKey);
              const due = dueIds.has(item.id);
              const tone = paid ? colors.status.ok : due ? colors.status.soon : undefined;
              return (
                <Fragment key={item.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/mi-carro/gasto-fijo', params: { id: item.id } })}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                    <View style={styles.icon}>
                      <Icon name={recurringIcon(item)} size={20} color={colors.brand.accent} />
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="bodyStrong">{recurringLabel(item)}</AppText>
                      <AppText variant="caption" tone="secondary" numeric>
                        {formatCop(item.amountCop)} · cada mes, el día {item.dayOfMonth}
                      </AppText>
                      <AppText variant="caption" color={tone?.color ?? colors.text.muted}>
                        {item.paused
                          ? 'En pausa (solo se usa en el estilo Tranqui)'
                          : paid
                            ? 'Pagado este mes'
                            : due
                              ? 'Pendiente este mes'
                              : `Este mes: el día ${item.dayOfMonth}`}
                      </AppText>
                    </View>
                    <Icon name="chevronRight" color={colors.text.muted} />
                  </Pressable>
                </Fragment>
              );
            })}
          </Card>
          <AppText variant="caption" tone="secondary" numeric>
            En total, {formatCop(monthlyTotal)} al mes en gastos que se repiten.
          </AppText>
        </>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
}));
