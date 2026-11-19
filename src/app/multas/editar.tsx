import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { discountDeadlines, FINE_KIND_LABEL, type FineKind, type FineRecord } from '@/features/law/fines';
import { useSession } from '@/features/session/SessionProvider';
import { newId } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, Button, Chip, DateField, Field, FormScreen, NumberField, TextField, useToast } from '@/shared/ui';
import { appAlert } from '@/shared/ui/AppDialog';
import { formatDate, parseISODate, toISODate, today } from '@/shared/utils/date';

const KINDS: FineKind[] = ['street', 'camera'];

/** Anotar o corregir un comparendo (con ?id= se edita). */
export default function FineFormScreen() {
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { fines, setFines } = useSession();
  const editing = fines.find((f) => f.id === id);
  const [kind, setKind] = useState<FineKind>(editing?.kind ?? 'street');
  const [date, setDate] = useState<Date>(editing ? parseISODate(editing.date) : today());
  const [number, setNumber] = useState(editing?.number ?? '');
  const [amount, setAmount] = useState<number | null>(editing?.amountCop ?? null);
  const [note, setNote] = useState(editing?.note ?? '');
  const deadlines = discountDeadlines({ kind, date: toISODate(date) });

  const save = async () => {
    const fine: FineRecord = {
      id: editing?.id ?? newId('fine'),
      kind,
      date: toISODate(date),
      ...(number.trim() ? { number: number.trim() } : {}),
      ...(amount ? { amountCop: amount } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(editing?.paidAt ? { paidAt: editing.paidAt } : {}),
    };
    const list = editing ? fines.map((f) => (f.id === fine.id ? fine : f)) : [...fines, fine];
    if (!(await persist(() => setFines(list)))) return;
    toast.show(editing ? 'Cambios guardados' : 'Comparendo anotado');
    router.back();
  };

  const remove = () =>
    appAlert('¿Quitar este comparendo?', 'Se borra de tu celular. No cambia nada en el SIMIT.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => setFines(fines.filter((f) => f.id !== editing?.id))))) return;
          toast.show('Comparendo quitado');
          router.back();
        },
      },
    ]);

  return (
    <FormScreen
      title={editing ? 'Comparendo' : 'Anotar un comparendo'}
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button label="Guardar" fullWidth onPress={save} />
          {editing && <Button label="Quitar" variant="ghost" fullWidth onPress={remove} />}
        </View>
      }>
      <Field label="¿Cómo te lo pusieron?">
        <View style={styles.chips}>
          {KINDS.map((k) => (
            <Chip key={k} label={FINE_KIND_LABEL[k]} selected={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
      </Field>
      <Field label={kind === 'camera' ? 'Fecha en que te notificaron' : 'Fecha del comparendo'}>
        <DateField value={date} onChange={setDate} />
      </Field>
      <AppText variant="caption" tone="secondary">
        Con el curso de normas de tránsito: 50 % hasta el {formatDate(parseISODate(deadlines.full))} y 25 % hasta el{' '}
        {formatDate(parseISODate(deadlines.partial))} (días hábiles, sin fines de semana ni festivos).
      </AppText>
      <Field label="Número del comparendo" optional>
        <TextField value={number} onChange={setNumber} autoCapitalize="characters" maxLength={40} accessibilityLabel="Número del comparendo" />
      </Field>
      <Field label="Valor de la multa" optional hint="Como aparece en el comparendo o en el SIMIT.">
        <NumberField value={amount} onChange={setAmount} prefix="$" size="md" accessibilityLabel="Valor de la multa" />
      </Field>
      <Field label="Nota" optional>
        <TextField value={note} onChange={setNote} maxLength={120} accessibilityLabel="Nota" />
      </Field>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  footer: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
}));
