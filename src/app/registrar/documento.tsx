import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DocumentType } from '@/features/cars/types';
import { getDepartments } from '@/features/catalogs/repository';
import { DOCUMENT_DEFINITIONS, DOCUMENT_ORDER, documentExpenseCategory } from '@/features/documents/catalog';
import { documentRecords, isTaxPaid } from '@/features/documents/summary';
import {
  acceptsPayment,
  needsExpiryDate,
  validateDocument,
  type TaxState,
} from '@/features/documents/validation';
import { findPossibleDuplicatePayment } from '@/features/expenses/duplicates';
import { costDateOf } from '@/features/history/presentation';
import { useEditingEntry } from '@/features/history/useEditingEntry';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { newId } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { spacing, useTheme } from '@/shared/theme';
import {
  AppText,
  Button,
  Chip,
  DateField,
  Field,
  FormScreen,
  Icon,
  NumberField,
  SelectField,
  SuccessView,
  TextField,
  useToast,
  type SelectOption,
} from '@/shared/ui';
import { formatDate, parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';
import { hasErrors } from '@/shared/utils/validation';

// Los 33 departamentos oficiales (se guarda el nombre, como antes).
const DEPARTMENTS: SelectOption[] = getDepartments().map((d) => ({ value: d.name, label: d.name }));

const TAX_STATES: { value: TaxState; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'exempt', label: 'Exento / no aplica' },
];

const isDocumentType = (value: string | undefined): value is DocumentType =>
  value !== undefined && value in DOCUMENT_DEFINITIONS;

/**
 * Registrar, renovar o corregir (?id=) un documento. Los campos salen del catálogo
 * (features/documents/catalog). ?tipo= preselecciona el tipo; ?serie= renueva un "Otro".
 * El valor pagado ES el gasto del documento: no se crea otro gasto aparte.
 */
export default function RegisterDocumentScreen() {
  const { tipo, serie } = useLocalSearchParams<{ tipo?: string; serie?: string }>();
  const editing = useEditingEntry('document');
  const { colors } = useTheme();
  const { history } = useAppData();
  const { addDocument, editEntry } = useSession();
  const persist = usePersist();
  const toast = useToast();

  const initialType: DocumentType = editing?.docType ?? (isDocumentType(tipo) ? tipo : 'soat');
  // Renovación: se precargan los datos que no cambian (entidad, número, nombre…), nunca fechas ni valores.
  const [previous] = useState(() => {
    // Solo es renovación si se llegó con un tipo o serie (desde el detalle del documento).
    if (editing || (!tipo && !serie)) return undefined;
    const key = serie ? `other:${serie}` : DOCUMENT_DEFINITIONS[initialType].multiple ? undefined : initialType;
    return key ? documentRecords(history, key)[0] : undefined;
  });
  const base = editing ?? previous;

  const [type, setType] = useState<DocumentType>(initialType);
  const [otherName, setOtherName] = useState(base?.name ?? '');
  const [notApplicable, setNotApplicable] = useState(editing?.notApplicable ?? false);
  const [hasExpiry, setHasExpiry] = useState(editing?.hasExpiry ?? base?.hasExpiry ?? true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(editing?.expiresAt ? parseISODate(editing.expiresAt) : null);
  const [number, setNumber] = useState(base?.number ?? base?.reference ?? '');
  const [issuer, setIssuer] = useState(base?.issuer ?? '');
  const [coverage, setCoverage] = useState(base?.coverage ?? '');
  const [licenseCategory, setLicenseCategory] = useState(base?.licenseCategory ?? '');
  const [taxYear, setTaxYear] = useState<number | null>(editing?.taxYear ?? null);
  const [department, setDepartment] = useState<string | null>(base?.department ?? null);
  const [dueDate, setDueDate] = useState<Date | null>(editing?.dueDate ? parseISODate(editing.dueDate) : null);
  const [taxState, setTaxState] = useState<TaxState>(
    editing?.exempt ? 'exempt' : editing && isTaxPaid(editing) ? 'paid' : 'pending',
  );
  const [costCop, setCostCop] = useState<number | null>(editing?.costCop ?? null);
  // Fecha de pago: se propone hoy (editable).
  const [paidAt, setPaidAt] = useState<Date | null>(editing?.paidAt ? parseISODate(editing.paidAt) : today());
  const [notes, setNotes] = useState(editing?.note ?? '');
  // "Más detalles": abierto si ya hay algo escrito (al editar o renovar), cerrado en un documento nuevo.
  const [moreOpen, setMoreOpen] = useState(() =>
    [base?.number ?? base?.reference, base?.issuer, base?.coverage, base?.licenseCategory, editing?.note].some((v) => !!v?.trim()),
  );
  const [submitted, setSubmitted] = useState(false);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [saved, setSaved] = useState(false);

  const definition = DOCUMENT_DEFINITIONS[type];
  const input = {
    type,
    otherName,
    notApplicable,
    hasExpiry,
    expiresAt,
    taxYear,
    taxState,
    costCop,
    paidAt,
    currentYear: today().getFullYear(),
  };
  const validation = validateDocument(input);
  const errors = submitted ? validation : {};
  const showExpiry = needsExpiryDate(input);
  const showPayment = acceptsPayment(input);
  const category = documentExpenseCategory(type);
  const title = definition.multiple ? otherName.trim() || definition.title : definition.title;

  // Posible pago repetido (mismo tipo de gasto, mismo valor, ≤ 7 días): se advierte, no se bloquea.
  const duplicate =
    showPayment && category && costCop && paidAt
      ? findPossibleDuplicatePayment(history, {
          category,
          amountCop: costCop,
          date: toISODate(paidAt),
          excludeId: editing?.id,
        })
      : undefined;

  const change = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setConfirmedDuplicate(false);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (hasErrors(validation) || saved) return;
    if (duplicate && !confirmedDuplicate) {
      setConfirmedDuplicate(true);
      return;
    }
    const text = (value: string) => value.trim() || undefined;
    const paid = showPayment && (definition.hasTaxFields ? true : costCop !== null);
    const record = {
      // Al corregir se conserva la fecha en que se registró.
      date: editing ? editing.date : toISODate(today()),
      docType: type,
      seriesId: definition.multiple ? (editing?.seriesId ?? serie ?? previous?.seriesId ?? newId('serie')) : undefined,
      name: definition.multiple ? text(otherName) : undefined,
      hasExpiry: definition.expiry === 'optional' ? hasExpiry : undefined,
      expiresAt: showExpiry && expiresAt ? toISODate(expiresAt) : undefined,
      notApplicable: definition.allowNotApplicable && notApplicable ? true : undefined,
      // La fecha de expedición ya no se pide; si el documento la tenía, se conserva.
      issuedAt: editing?.issuedAt,
      number: definition.hasTaxFields ? undefined : text(number),
      reference: definition.hasTaxFields ? text(number) : undefined,
      issuer: definition.issuerLabel ? text(issuer) : undefined,
      coverage: definition.hasCoverage ? text(coverage) : undefined,
      licenseCategory: definition.hasLicenseCategory ? text(licenseCategory) : undefined,
      taxYear: definition.hasTaxFields ? (taxYear ?? undefined) : undefined,
      department: definition.hasTaxFields ? (department ?? undefined) : undefined,
      dueDate: definition.hasTaxFields && taxState === 'pending' && dueDate ? toISODate(dueDate) : undefined,
      exempt: definition.hasTaxFields && taxState === 'exempt' ? true : undefined,
      costCop: paid && costCop !== null ? costCop : undefined,
      paidAt: paid && paidAt ? toISODate(paidAt) : undefined,
      note: text(notes),
    };
    if (editing) {
      if (!(await persist(() => editEntry(editing.id, { ...record, id: editing.id, kind: 'document' })))) return;
      toast.show('Cambios guardados');
      router.back();
      return;
    }
    if (await persist(() => addDocument(record))) setSaved(true);
  };

  if (saved) {
    const reminds = definition.reminderSetting !== undefined && (showExpiry || (definition.hasTaxFields && taxState === 'pending' && dueDate));
    return (
      <FormScreen title="Documento" footer={<Button label="Listo" fullWidth onPress={() => router.back()} />}>
        <SuccessView
          title="Documento guardado"
          summary={[
            { label: 'Documento', value: title },
            ...(showExpiry && expiresAt ? [{ label: 'Vence', value: formatDate(expiresAt) }] : []),
            ...(showPayment && costCop !== null ? [{ label: 'Valor pagado', value: formatCop(costCop) }] : []),
          ]}
          message={
            reminds
              ? 'Guardado en tu celular. Te avisaremos 30, 7 y 1 día antes de la fecha que registraste.'
              : 'Guardado en tu celular.'
          }
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={editing ? 'Editar documento' : previous ? `Renovar ${title.toLowerCase()}` : 'Registrar documento'}
      footer={
        <Button
          label={confirmedDuplicate && duplicate ? 'Sí, guardar' : editing ? 'Guardar cambios' : 'Guardar documento'}
          fullWidth
          onPress={handleSave}
        />
      }>
      {!editing && !previous && (
        <Field label="Tipo de documento">
          <View style={styles.chips}>
            {DOCUMENT_ORDER.map((docType) => (
              <Chip
                key={docType}
                label={DOCUMENT_DEFINITIONS[docType].title}
                selected={type === docType}
                onPress={() => change(setType)(docType)}
              />
            ))}
          </View>
        </Field>
      )}

      {definition.multiple && (
        <Field label="¿Qué documento es?" error={errors.otherName}>
          <TextField
            value={otherName}
            onChange={setOtherName}
            placeholder="Nombre del documento"
            invalid={!!errors.otherName}
            accessibilityLabel="Nombre del documento"
          />
        </Field>
      )}

      {definition.allowNotApplicable && (
        <Field label="¿Tu carro ya requiere tecnomecánica?" hint="Tú lo decides según tu caso: RODEXA no calcula plazos.">
          <View style={styles.chips}>
            <Chip label="Sí" selected={!notApplicable} onPress={() => setNotApplicable(false)} />
            <Chip label="Aún no aplica" selected={notApplicable} onPress={() => setNotApplicable(true)} />
          </View>
        </Field>
      )}

      {definition.expiry === 'optional' && (
        <Field label="¿Tiene fecha de vencimiento?">
          <View style={styles.chips}>
            <Chip label="Sí" selected={hasExpiry} onPress={() => setHasExpiry(true)} />
            <Chip label="No" selected={!hasExpiry} onPress={() => setHasExpiry(false)} />
          </View>
        </Field>
      )}

      {definition.hasTaxFields && (
        <>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field label="Año" optional error={errors.taxYear}>
                <NumberField
                  value={taxYear}
                  onChange={setTaxYear}
                  placeholder={String(today().getFullYear())}
                  grouping={false}
                  maxDigits={4}
                  size="md"
                  invalid={!!errors.taxYear}
                  accessibilityLabel="Año del impuesto"
                />
              </Field>
            </View>
          </View>
          <Field label="Departamento" optional hint="Las fechas y reglas del impuesto dependen de cada departamento.">
            <SelectField
              title="Departamento"
              placeholder="Elige el departamento"
              options={DEPARTMENTS}
              value={department}
              onChange={setDepartment}
            />
          </Field>
          <Field label="Estado del pago">
            <View style={styles.chips}>
              {TAX_STATES.map((state) => (
                <Chip key={state.value} label={state.label} selected={taxState === state.value} onPress={() => change(setTaxState)(state.value)} />
              ))}
            </View>
          </Field>
          {taxState === 'pending' && (
            <Field label="Fecha límite de pago" optional hint="La que indica tu Secretaría de Hacienda. RODEXA no la calcula.">
              <DateField value={dueDate} onChange={setDueDate} maxDate={null} quickOptions={false} />
            </Field>
          )}
        </>
      )}

      {showExpiry && (
        <Field label="Fecha de vencimiento" error={errors.expiresAt}>
          <DateField
            value={expiresAt}
            onChange={setExpiresAt}
            maxDate={null}
            quickOptions={false}
            invalid={!!errors.expiresAt}
          />
        </Field>
      )}

      {showPayment && (
        <>
          <Field
            label="Valor pagado"
            optional
            hint="Cuenta como gasto de tu carro en Estadísticas. No lo registres también como gasto aparte."
            error={errors.costCop}
            warning={
              duplicate && submitted
                ? `Parece que ya registraste un pago de ${formatCop(costCop ?? 0)} el ${formatDate(parseISODate(costDateOf(duplicate)))}. Toca "Sí, guardar" si es otro pago.`
                : undefined
            }>
            <NumberField
              value={costCop}
              onChange={change(setCostCop)}
              prefix="$"
              invalid={!!errors.costCop}
              accessibilityLabel="Valor pagado"
            />
          </Field>
          <Field label="Fecha de pago" error={errors.paidAt}>
            <DateField value={paidAt} onChange={change(setPaidAt)} quickOptions={false} />
          </Field>
        </>
      )}

      {/* Lo secundario va plegado: el formulario se ve corto y lo importante (fechas y pago) a la vista. */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: moreOpen }}
        onPress={() => setMoreOpen((v) => !v)}
        style={styles.moreToggle}>
        <AppText variant="bodyStrong" style={styles.flex}>
          Más detalles (opcional)
        </AppText>
        <Icon name={moreOpen ? 'expandLess' : 'expandMore'} color={colors.brand.accent} />
      </Pressable>
      {moreOpen && (
        <>
        <Field label={definition.numberLabel} optional>
          <TextField
            value={number}
            onChange={setNumber}
            autoCapitalize="characters"
            placeholder={definition.numberLabel}
            accessibilityLabel={definition.numberLabel}
          />
        </Field>

        {definition.issuerLabel && (
          <Field label={definition.issuerLabel} optional>
            <TextField
              value={issuer}
              onChange={setIssuer}
              placeholder={definition.issuerPlaceholder}
              autoCapitalize="words"
              accessibilityLabel={definition.issuerLabel}
            />
          </Field>
        )}

        {definition.hasCoverage && (
          <Field label="Cobertura" optional>
            <TextField value={coverage} onChange={setCoverage} placeholder="Qué cubre la póliza" accessibilityLabel="Cobertura" />
          </Field>
        )}

        {definition.hasLicenseCategory && (
          <Field label="Categoría" optional hint="Como aparece en tu licencia.">
            <TextField
              value={licenseCategory}
              onChange={setLicenseCategory}
              autoCapitalize="characters"
              placeholder="Categoría"
              accessibilityLabel="Categoría de la licencia"
            />
          </Field>
        )}

        <Field label="Observaciones" optional>
          <TextField
            value={notes}
            onChange={setNotes}
            multiline
            placeholder="Cualquier dato que quieras recordar"
            accessibilityLabel="Observaciones"
          />
        </Field>
        </>
      )}

      <AppText variant="caption" tone="muted">
        RODEXA te ayuda a organizar tus documentos con las fechas que tú registras; no consulta
        entidades oficiales.
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
});

