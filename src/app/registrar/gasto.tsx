import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { energyRecordKinds } from '@/features/cars/energy';
import type { DocumentType } from '@/features/cars/types';
import { findPossibleDuplicatePayment } from '@/features/expenses/duplicates';
import { expenseAmountWarning } from '@/features/plausibility/rules';
import { ENERGY_META } from '@/features/energy/meta';
import { EXPENSE_CATEGORIES, NEW_EXPENSE_CATEGORIES, type ExpenseCategoryCode, type ExpenseCategory } from '@/features/expenses/catalog';
import { costDateOf } from '@/features/history/presentation';
import { validateExpense } from '@/features/expenses/validation';
import { useEditingEntry } from '@/features/history/useEditingEntry';
import { recurringLabel, type RecurringExpense } from '@/features/recurring/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { newId } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { spacing, useTheme } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  DateField,
  Field,
  FormScreen,
  Icon,
  NumberField,
  OptionGrid,
  SettingsRow,
  SettingsSection,
  SuccessView,
  TextField,
  useToast,
} from '@/shared/ui';
import { formatDateWithRelative, parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';
import { hasErrors } from '@/shared/utils/validation';

/** Categorías de gasto que suelen ser el pago de un documento (y cuál). */
const DOCUMENT_FOR_CATEGORY: Partial<Record<ExpenseCategoryCode, DocumentType>> = {
  soat: 'soat',
  rtm: 'rtm',
  tax: 'tax',
  insurance: 'policy',
  // La licencia es un documento del conductor: allí se registra su vencimiento para avisarte.
  driver_license: 'license',
};

const toOptions = (categories: ExpenseCategory[]) =>
  categories.map((category) => ({ value: category.code, label: category.label, icon: category.icon }));
const NEW_OPTIONS = toOptions(NEW_EXPENSE_CATEGORIES);
/** Al corregir un gasto viejo de "Combustible", esa opción se sigue mostrando. */
const ALL_OPTIONS = toOptions(EXPENSE_CATEGORIES);

export default function RegisterExpenseScreen() {
  const { colors } = useTheme();
  const { addExpense, addExpenseWithRecurring, editEntry, recurringExpenses } = useSession();
  const persist = usePersist();
  const toast = useToast();
  // Con ?id= se corrige un gasto existente.
  const editing = useEditingEntry('expense');
  // Con ?recurrente= se registra el pago del mes de un gasto que se repite (desde "Hoy").
  const { recurrente } = useLocalSearchParams<{ recurrente?: string }>();
  const fromRecurring = editing ? undefined : recurringExpenses.find((r) => r.id === recurrente);
  const [amount, setAmount] = useState<number | null>(editing?.amountCop ?? fromRecurring?.amountCop ?? null);
  const [category, setCategory] = useState<ExpenseCategoryCode | null>(
    editing?.category ?? fromRecurring?.category ?? null,
  );
  const [date, setDate] = useState(() => (editing ? parseISODate(editing.date) : today()));
  const [note, setNote] = useState(editing?.note ?? fromRecurring?.note ?? '');
  // "Se repite cada mes": solo al registrar un gasto nuevo (no al corregir ni al pagar uno fijo).
  const [repeats, setRepeats] = useState(false);
  const canRepeat = !editing && !fromRecurring;
  const [submitted, setSubmitted] = useState(false);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [saved, setSaved] = useState(false);
  const { history, profile } = useAppData();
  // También el pago del "Combustible del mes" de Tranqui (un gasto fijo de combustible).
  const categoryOptions = editing?.category === 'fuel' || fromRecurring?.category === 'fuel' ? ALL_OPTIONS : NEW_OPTIONS;
  // Tanqueo / GNC / carga eléctrica, según el carro: se registran en Tanquear, no como gasto.
  const energyKind = energyRecordKinds(profile)[0];

  const validation = validateExpense({ amount, category });
  const errors = submitted ? validation : {};
  // El pago de un documento se registra en el documento (así cuenta una sola vez).
  const documentType = category ? DOCUMENT_FOR_CATEGORY[category] : undefined;
  // Posible pago repetido (misma categoría, mismo valor, ≤ 7 días): se advierte, no se bloquea.
  const duplicate =
    category && amount
      ? findPossibleDuplicatePayment(history, { category, amountCop: amount, date: toISODate(date), excludeId: editing?.id })
      : undefined;
  // ¿Un cero de más? (comparado con lo que suele registrar en esa categoría).
  const amountWarning = category ? expenseAmountWarning(history, { category, amountCop: amount, excludeId: editing?.id }) : undefined;
  const needsConfirm = !!duplicate || !!amountWarning;

  const handleSave = async () => {
    setSubmitted(true);
    if (hasErrors(validation) || saved || amount === null || category === null) return;
    if (needsConfirm && !confirmedDuplicate) {
      setConfirmedDuplicate(true);
      return;
    }
    const recurringId = editing?.recurringId ?? fromRecurring?.id;
    const record = {
      date: toISODate(date),
      category,
      amountCop: amount,
      note: note.trim() || undefined,
      ...(recurringId ? { recurringId } : {}),
    };
    if (editing) {
      if (!(await persist(() => editEntry(editing.id, { ...record, id: editing.id, kind: 'expense' })))) return;
      toast.show('Cambios guardados');
      router.back();
      return;
    }
    if (canRepeat && repeats) {
      const recurring: RecurringExpense = {
        id: newId('rec'),
        category,
        amountCop: amount,
        dayOfMonth: date.getDate(),
        createdAt: toISODate(date),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      if (await persist(() => addExpenseWithRecurring(record, recurring))) setSaved(true);
      return;
    }
    if (await persist(() => addExpense(record))) setSaved(true);
  };

  const reset = () => {
    setAmount(null);
    setCategory(null);
    setDate(today());
    setNote('');
    setSubmitted(false);
    setSaved(false);
    setRepeats(false);
  };

  if (saved && amount !== null && category !== null) {
    const categoryLabel = EXPENSE_CATEGORIES.find((c) => c.code === category)?.label ?? '';
    return (
      <FormScreen
        title="Registrar gasto"
        footer={
          <View style={styles.footerButtons}>
            <Button label="Listo" fullWidth onPress={() => router.back()} />
            <Button label="Registrar otro gasto" variant="ghost" fullWidth onPress={reset} />
          </View>
        }>
        <SuccessView
          title="Gasto registrado"
          summary={[
            { label: 'Valor', value: formatCop(amount) },
            { label: 'Categoría', value: categoryLabel },
            { label: 'Fecha', value: formatDateWithRelative(date) },
            ...(canRepeat && repeats ? [{ label: 'Se repite', value: `Cada mes, el día ${date.getDate()}` }] : []),
          ]}
          message="Guardado en tu celular."
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={editing ? 'Editar gasto' : 'Registrar gasto'}
      footer={
        <Button
          label={confirmedDuplicate && needsConfirm ? 'Sí, guardar' : editing ? 'Guardar cambios' : 'Guardar gasto'}
          fullWidth
          onPress={handleSave}
        />
      }>
      {fromRecurring && (
        <AppText tone="secondary">
          Pago de este mes: {recurringLabel(fromRecurring)}. Revisa el valor y la fecha, y guárdalo.
        </AppText>
      )}

      <Field
        label="¿Cuánto gastaste?"
        error={errors.amount}
        warning={
          !submitted
            ? undefined
            : amountWarning
              ? amountWarning
              : duplicate
                ? `Parece que ya registraste este pago el ${formatDateWithRelative(parseISODate(costDateOf(duplicate)))}. Toca "Sí, guardar" si es otro.`
                : undefined
        }>
        <NumberField
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setConfirmedDuplicate(false);
          }}
          prefix="$"
          autoFocus
          invalid={!!errors.amount}
          accessibilityLabel="Valor del gasto"
        />
      </Field>

      <Field label="Categoría" error={errors.category}>
        <OptionGrid
          options={categoryOptions}
          selected={category ? [category] : []}
          onToggle={(code) => {
            setCategory((current) => (current === code ? null : code));
            setConfirmedDuplicate(false);
          }}
          columns={3}
        />
      </Field>

      {documentType === 'license' && !editing && (
        // La licencia es del conductor: el gasto se guarda aquí y el vencimiento, en Documentos.
        <Card tone="highlight" onPress={() => router.push({ pathname: '/registrar/documento', params: { tipo: 'license' } })}>
          <View style={styles.hintRow}>
            <Icon name="driverLicense" color={colors.brand.accent} />
            <View style={styles.hintTexts}>
              <AppText variant="bodyStrong">¿Renovaste la licencia?</AppText>
              <AppText variant="caption" tone="secondary">
                Guarda aquí lo que pagaste y actualiza la fecha de vencimiento en Documentos para que te avisemos.
              </AppText>
            </View>
            <Icon name="chevronRight" color={colors.brand.accent} />
          </View>
        </Card>
      )}

      {documentType && documentType !== 'license' && !editing && (
        <Card
          tone="highlight"
          onPress={() => router.replace({ pathname: '/registrar/documento', params: { tipo: documentType } })}>
          <View style={styles.hintRow}>
            <Icon name="document" color={colors.brand.accent} />
            <View style={styles.hintTexts}>
              <AppText variant="bodyStrong">¿Es el pago de un documento?</AppText>
              <AppText variant="caption" tone="secondary">
                Regístralo en Documentos: así cuenta una sola vez y además te avisamos antes del vencimiento.
              </AppText>
            </View>
            <Icon name="chevronRight" color={colors.brand.accent} />
          </View>
        </Card>
      )}

      {energyKind && !editing && (
        <Card
          tone="highlight"
          onPress={() => router.replace({ pathname: '/registrar/energia', params: { tipo: energyKind } })}>
          <View style={styles.hintRow}>
            <Icon name={ENERGY_META[energyKind].icon} color={colors.brand.accent} />
            <View style={styles.hintTexts}>
              <AppText variant="bodyStrong">¿Cargaste combustible o energía?</AppText>
              <AppText variant="caption" tone="secondary">
                Regístralo como carga: así se calcula el consumo de tu carro y no se cuenta dos veces.
              </AppText>
            </View>
            <Icon name="chevronRight" color={colors.brand.accent} />
          </View>
        </Card>
      )}

      <Card tone="highlight" onPress={() => router.replace('/registrar/mantenimiento')}>
        <View style={styles.hintRow}>
          <Icon name="maintenance" color={colors.brand.accent} />
          <View style={styles.hintTexts}>
            <AppText variant="bodyStrong">¿Fue aceite, llantas o frenos?</AppText>
            <AppText variant="caption" tone="secondary">
              Regístralo como mantenimiento: así también se actualiza el estado de tu carro.
            </AppText>
          </View>
          <Icon name="chevronRight" color={colors.brand.accent} />
        </View>
      </Card>

      <Field label="Fecha">
        <DateField value={date} onChange={setDate} />
      </Field>

      {canRepeat && category && (
        <SettingsSection
          footnote={
            repeats
              ? `Cada mes, desde el día ${date.getDate()}, te preguntamos en Inicio si ya lo pagaste. Lo manejas en Mi carro → Gastos que se repiten.`
              : 'Para el garaje, la cuota del crédito, el seguro…'
          }>
          <SettingsRow
            icon="calendar"
            label="Se repite cada mes"
            accessory={{ type: 'switch', value: repeats, onChange: setRepeats }}
          />
        </SettingsSection>
      )}

      <Field label="Nota" optional>
        <TextField
          value={note}
          onChange={setNote}
          placeholder="Ej.: parqueadero del centro comercial"
          multiline
          accessibilityLabel="Nota"
        />
      </Field>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footerButtons: {
    gap: spacing.xs,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hintTexts: {
    flex: 1,
    gap: 2,
  },
});
