import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  customStatus,
  markDone,
  MAX_CUSTOM_REMINDERS,
  repeatText,
  validateCustom,
  type CustomReminder,
  type CustomTrigger,
} from '@/features/customReminders/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { newId } from '@/features/session/userDataActions';
import { createStyles, spacing } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  Chip,
  DateField,
  Field,
  FormScreen,
  NumberField,
  SegmentedControl,
  TextField,
  useToast,
} from '@/shared/ui';
import { parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatKm } from '@/shared/utils/format';
import { appAlert } from '@/shared/ui/AppDialog';

/** Crear o cambiar un recordatorio (con ?id= se edita y se puede marcar como hecho). */
export default function CustomReminderFormScreen() {
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { customReminders, setCustomReminders } = useSession();
  const { odometer } = useAppData();
  const currentKm = odometer.registeredKm;
  const editing = customReminders.find((r) => r.id === id);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [type, setType] = useState<CustomTrigger['type']>(editing?.trigger.type ?? 'date');
  const [date, setDate] = useState<Date | null>(
    editing?.trigger.type === 'date' ? parseISODate(editing.trigger.date) : null,
  );
  const [km, setKm] = useState<number | null>(editing?.trigger.type === 'km' ? editing.trigger.km : null);
  const [repeat, setRepeat] = useState(editing ? !!editing.repeatEvery : false);
  const [repeatEvery, setRepeatEvery] = useState<number | null>(editing?.repeatEvery ?? null);
  const [note, setNote] = useState(editing?.note ?? '');
  const [submitted, setSubmitted] = useState(false);

  const errors = validateCustom({ title, type, date, km, repeat, repeatEvery }, currentKm);
  const shown = submitted ? errors : {};
  const full = !editing && customReminders.length >= MAX_CUSTOM_REMINDERS;

  const saveList = async (list: CustomReminder[], message: string) => {
    if (!(await persist(() => setCustomReminders(list)))) return;
    toast.show(message);
    router.back();
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || full) return;
    const trigger: CustomTrigger = type === 'date' ? { type: 'date', date: toISODate(date!) } : { type: 'km', km: km! };
    const item: CustomReminder = {
      id: editing?.id ?? newId('rem'),
      title: title.trim(),
      trigger,
      createdAt: editing?.createdAt ?? toISODate(today()),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(repeat && repeatEvery ? { repeatEvery } : {}),
    };
    const list = editing ? customReminders.map((r) => (r.id === item.id ? item : r)) : [...customReminders, item];
    await saveList(list, editing ? 'Recordatorio actualizado' : 'Recordatorio creado');
  };

  const done = async () => {
    if (!editing) return;
    const next = markDone(editing, currentKm, today());
    await saveList(
      customReminders.map((r) => (r.id === editing.id ? next : r)),
      next.doneAt ? 'Marcado como hecho' : `Hecho. Próximo: ${customStatus(next, currentKm, today()).detail.toLowerCase()}`,
    );
  };

  const reopen = () =>
    editing && saveList(customReminders.map((r) => (r.id === editing.id ? { ...r, doneAt: undefined } : r)), 'Recordatorio activo de nuevo');

  const remove = () =>
    appAlert('¿Borrar este recordatorio?', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => saveList(customReminders.filter((r) => r.id !== editing?.id), 'Recordatorio borrado'),
      },
    ]);

  return (
    <FormScreen
      title={editing ? 'Recordatorio' : 'Nuevo recordatorio'}
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          {editing && !editing.doneAt && <Button label="Ya lo hice" icon="check" fullWidth onPress={done} />}
          <Button
            label={full ? `Máximo ${MAX_CUSTOM_REMINDERS} recordatorios` : editing ? 'Guardar cambios' : 'Crear recordatorio'}
            variant={editing && !editing.doneAt ? 'secondary' : 'primary'}
            fullWidth
            onPress={save}
          />
          {editing?.doneAt && <Button label="Volver a activar" variant="ghost" fullWidth onPress={reopen} />}
          {editing && <Button label="Borrar" variant="ghost" fullWidth onPress={remove} />}
        </View>
      }>
      {editing && (
        <Card>
          <AppText variant="bodyStrong">{customStatus(editing, currentKm, today()).detail}</AppText>
          <AppText variant="caption" tone="secondary">
            {repeatText(editing)}
          </AppText>
        </Card>
      )}

      <Field label="¿Qué te recordamos?" error={shown.title}>
        <TextField
          value={title}
          onChange={setTitle}
          placeholder="Ej.: Cambiar plumillas"
          maxLength={60}
          invalid={!!shown.title}
          accessibilityLabel="Qué te recordamos"
        />
      </Field>

      <Field label="¿Cuándo?">
        <SegmentedControl
          options={[
            { value: 'date', label: 'Por fecha' },
            { value: 'km', label: 'Por kilometraje' },
          ]}
          value={type}
          onChange={(v) => setType(v as CustomTrigger['type'])}
        />
      </Field>

      {type === 'date' ? (
        <Field label="Fecha" hint="Ese día te llega una notificación a las 9:00 a. m." error={shown.date}>
          <DateField value={date} onChange={setDate} minDate={today()} maxDate={null} quickOptions={false} invalid={!!shown.date} />
        </Field>
      ) : (
        <Field
          label="¿A qué kilometraje?"
          hint={`Tu kilometraje registrado: ${formatKm(currentKm)}. Lo verás en Inicio cuando te acerques.`}
          error={shown.km}>
          <NumberField value={km} onChange={setKm} suffix="km" invalid={!!shown.km} accessibilityLabel="Kilometraje" />
        </Field>
      )}

      <Field label="¿Se repite?" error={shown.repeatEvery}>
        <View style={styles.chips}>
          <Chip label="Una sola vez" selected={!repeat} onPress={() => setRepeat(false)} />
          <Chip label="Se repite" selected={repeat} onPress={() => setRepeat(true)} />
        </View>
        {repeat && (
          <View style={styles.repeat}>
            <AppText tone="secondary">Cada</AppText>
            <View style={styles.repeatField}>
              <NumberField
                value={repeatEvery}
                onChange={setRepeatEvery}
                size="md"
                invalid={!!shown.repeatEvery}
                accessibilityLabel={type === 'km' ? 'Cada cuántos kilómetros' : 'Cada cuántos meses'}
              />
            </View>
            <AppText tone="secondary">{type === 'km' ? 'km' : 'meses'}</AppText>
          </View>
        )}
      </Field>

      <Field label="Nota" optional>
        <TextField value={note} onChange={setNote} placeholder="Ej.: las del conductor y el pasajero" maxLength={120} accessibilityLabel="Nota" />
      </Field>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  footer: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  repeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  repeatField: {
    width: 120,
  },
}));
