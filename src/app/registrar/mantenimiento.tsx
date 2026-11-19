import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { recommendApp } from '@/features/about/share';
import { applicableCategories } from '@/features/maintenance/applicability';
import {
  MAINTENANCE_ITEMS,
  categoryForComponent,
  findMaintenanceItem,
  type ComponentCode,
  type MaintenanceCategoryCode,
  type MaintenanceItemCode,
} from '@/features/maintenance/catalog';
import { capabilitiesOf } from '@/features/cars/capabilities';
import { useEditingEntry } from '@/features/history/useEditingEntry';
import { MaintenancePicker } from '@/features/maintenance/components/MaintenancePicker';
import { validateMaintenance } from '@/features/maintenance/validation';
import { RecordKmField } from '@/features/odometer/components/RecordKmField';
import { formatRecordKm } from '@/features/odometer/recordKm';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import {
  AppText,
  Button,
  Card,
  DateField,
  Field,
  FormScreen,
  NumberField,
  SuccessView,
  TextField,
  useToast,
} from '@/shared/ui';
import { formatDateWithRelative, parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';
import { hasErrors } from '@/shared/utils/validation';
import { PART_TYPES, type PartType } from '@/features/parts/myParts';

/** El primer repuesto del catálogo entre lo que se hizo (para dejarlo elegido). */
const partTypeOf = (types: string[]): PartType | undefined => PART_TYPES.find((t) => t !== 'other' && types.includes(t));

/**
 * ?tipo= puede ser un mantenimiento ("oil") → se preselecciona,
 * o un componente controlado ("tires") → se abre su categoría.
 */
function initialSelection(tipo?: string): {
  types: MaintenanceItemCode[];
  expanded?: MaintenanceCategoryCode;
} {
  if (!tipo) return { types: [] };
  const item = findMaintenanceItem(tipo);
  if (item) return { types: [item.code], expanded: item.category };
  return { types: [], expanded: categoryForComponent(tipo as ComponentCode) };
}

export default function RegisterMaintenanceScreen() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const { odometer, profile } = useAppData();
  const { addMaintenance, editEntry } = useSession();
  const persist = usePersist();
  const toast = useToast();
  // Con ?id= se corrige un mantenimiento existente (se precarga tal cual se guardó).
  const editing = useEditingEntry('maintenance');
  const editingOther = editing?.types.includes('other') ?? false;
  // Último km registrado: precarga el campo.
  const lastKm = odometer.registeredKm;
  const [initial] = useState(() =>
    editing
      ? { types: editing.types, expanded: findMaintenanceItem(editing.types[0])?.category }
      : initialSelection(tipo),
  );

  const [types, setTypes] = useState<MaintenanceItemCode[]>(initial.types);
  // Catálogo filtrado por las capacidades del carro (regla central en maintenance/applicability).
  // Al corregir un registro viejo se conservan sus ítems aunque hoy no apliquen.
  const [categories] = useState(() => applicableCategories(capabilitiesOf(profile), initial.types));
  const [notApplicable, setNotApplicable] = useState<MaintenanceCategoryCode[]>([]);
  // En "Otro", la descripción se guardó en la nota: se precarga como descripción.
  const [otherDescription, setOtherDescription] = useState(editingOther ? (editing?.note ?? '') : '');
  const [km, setKm] = useState<number | null>(editing ? editing.km : lastKm);
  const [kmUnknown, setKmUnknown] = useState(editing ? editing.km === null : false);
  const [date, setDate] = useState(() => (editing ? parseISODate(editing.date) : today()));
  const [cost, setCost] = useState<number | null>(editing?.costCop ?? null);
  const [note, setNote] = useState(editing && !editingOther ? (editing.note ?? '') : '');
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const validation = validateMaintenance({ types, otherDescription, km, kmUnknown });
  // Desconocido = null explícito: nunca 0 ni el último km registrado.
  const recordKm = kmUnknown ? null : km;
  const errors = submitted ? validation : {};

  // Nombres en el orden del catálogo; "Otro" muestra lo que escribió el usuario.
  const selectedLabels = MAINTENANCE_ITEMS.filter((item) => types.includes(item.code)).map(
    (item) => (item.code === 'other' ? otherDescription.trim() || 'Otro' : item.label),
  );

  const toggleType = (code: MaintenanceItemCode) => {
    setTypes((current) =>
      current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
    );
  };

  const toggleNotApplicable = (category: MaintenanceCategoryCode) => {
    const marking = !notApplicable.includes(category);
    setNotApplicable((current) =>
      marking ? [...current, category] : current.filter((c) => c !== category),
    );
    // Si la categoría deja de aplicar, se quitan sus mantenimientos seleccionados.
    if (marking) {
      setTypes((current) =>
        current.filter((code) => findMaintenanceItem(code)?.category !== category),
      );
    }
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (hasErrors(validation) || saved) return;
    const details = [types.includes('other') ? otherDescription.trim() : '', note.trim()].filter(Boolean);
    const record = {
      date: toISODate(date),
      km: recordKm,
      types,
      costCop: cost ?? undefined,
      note: details.length > 0 ? details.join(' · ') : undefined,
    };
    if (editing) {
      if (!(await persist(() => editEntry(editing.id, { ...record, id: editing.id, kind: 'maintenance' })))) return;
      toast.show('Cambios guardados');
      router.back();
      return;
    }
    if (await persist(() => addMaintenance(record))) setSaved(true);
  };

  if (saved) {
    return (
      <FormScreen
        title="Registrar mantenimiento"
        footer={<Button label="Listo" fullWidth onPress={() => router.back()} />}>
        <SuccessView
          title="Mantenimiento registrado"
          summary={[
            { label: 'Qué se hizo', value: selectedLabels.join(', ') },
            { label: 'Kilometraje', value: formatRecordKm(recordKm) },
            { label: 'Fecha', value: formatDateWithRelative(date) },
            ...(cost !== null ? [{ label: 'Costo', value: formatCop(cost) }] : []),
          ]}
          message="Guardado en tu celular."
        />
        {/* "¿Qué le pusiste?": el momento justo para anotar la marca y la referencia del repuesto. */}
        <Card style={{ gap: 8 }}>
          <AppText variant="bodyStrong">¿Qué le pusiste?</AppText>
          <AppText variant="caption" tone="secondary">
            Anota la marca y la referencia del repuesto: la próxima vez lo pides por WhatsApp con un toque.
          </AppText>
          <Button
            label="Anotar el repuesto"
            icon="parts"
            variant="secondary"
            onPress={() =>
              router.replace({
                pathname: '/mis-repuestos/editar',
                params: partTypeOf(types) ? { tipo: partTypeOf(types)! } : {},
              })
            }
          />
        </Card>
        {/* El momento justo para recomendar: acaba de usar RODEXA para algo útil. */}
        <Card tone="highlight" style={{ gap: 8 }}>
          <AppText variant="bodyStrong">¿RODEXA te está sirviendo?</AppText>
          <AppText variant="caption" tone="secondary">
            Recomiéndala a otra persona con carro: le ayuda a llevar sus mantenimientos, documentos y gastos.
          </AppText>
          <Button label="Recomendar RODEXA" icon="recommend" variant="secondary" onPress={recommendApp} />
        </Card>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={editing ? 'Editar mantenimiento' : 'Registrar mantenimiento'}
      footer={
        <Button label={editing ? 'Guardar cambios' : 'Guardar mantenimiento'} fullWidth onPress={handleSave} />
      }>
      <Field
        label="¿Qué mantenimiento hiciste?"
        hint={
          selectedLabels.length > 0
            ? `${selectedLabels.length} ${selectedLabels.length === 1 ? 'seleccionado' : 'seleccionados'}: ${selectedLabels.join(', ')}`
            : tipo === 'tires'
              ? 'Elige cuál cambiaste: llanta delantera, trasera o ambas.'
              : 'Abre una categoría y elige. Puedes elegir varios.'
        }
        error={errors.types}>
        <MaintenancePicker
          categories={categories}
          selected={types}
          onToggle={toggleType}
          notApplicable={notApplicable}
          onToggleNotApplicable={toggleNotApplicable}
          initialExpanded={initial.expanded}
        />
      </Field>

      {types.includes('other') && (
        <Field label="¿Qué se hizo?" error={errors.otherDescription}>
          <TextField
            value={otherDescription}
            onChange={setOtherDescription}
            placeholder="Ej.: cambio de espejo retrovisor"
            accessibilityLabel="Descripción del mantenimiento"
          />
        </Field>
      )}

      <RecordKmField
        value={km}
        onChange={setKm}
        unknown={kmUnknown}
        onUnknownChange={setKmUnknown}
        hint={
          kmUnknown
            ? undefined
            : km !== null && km > lastKm
              ? 'Es mayor a tu último registro: también actualizará tu kilometraje.'
              : 'El que marcaba el carro cuando se hizo.'
        }
        error={errors.km}
        accessibilityLabel="Kilometraje del mantenimiento"
      />

      <Field label="Fecha">
        <DateField value={date} onChange={setDate} />
      </Field>

      <Field label="Costo" optional hint="Si tiene costo, también se sumará a tus gastos del mes.">
        <NumberField value={cost} onChange={setCost} prefix="$" accessibilityLabel="Costo" />
      </Field>

      <Field label="Nota" optional>
        <TextField
          value={note}
          onChange={setNote}
          placeholder="Taller, marca del aceite, repuestos usados…"
          multiline
          accessibilityLabel="Nota"
        />
      </Field>
    </FormScreen>
  );
}
