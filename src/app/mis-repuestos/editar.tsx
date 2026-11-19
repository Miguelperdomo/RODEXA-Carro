import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MAX_PART_TEXT, MAX_PARTS, PART_TYPES, partTypeLabel, validatePart, type MyPart, type PartType } from '@/features/parts/myParts';
import { useSession } from '@/features/session/SessionProvider';
import { newId } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, spacing } from '@/shared/theme';
import { Button, DateField, Field, FormScreen, NumberField, SelectField, TextField, useToast } from '@/shared/ui';
import { appAlert } from '@/shared/ui/AppDialog';
import { parseISODate, toISODate, today } from '@/shared/utils/date';

const TYPE_OPTIONS = PART_TYPES.map((t) => ({ value: t, label: partTypeLabel(t) }));

/**
 * Anotar o cambiar un repuesto (con ?id= se edita). Con ?tipo= (desde "¿Qué le pusiste?" al
 * registrar un mantenimiento) llega con el tipo elegido.
 */
export default function PartFormScreen() {
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { id, tipo } = useLocalSearchParams<{ id?: string; tipo?: string }>();
  const { myParts, setMyParts } = useSession();
  const editing = myParts.find((p) => p.id === id);
  const [type, setType] = useState<PartType | null>(
    editing?.type ?? (PART_TYPES.includes(tipo as PartType) ? (tipo as PartType) : null),
  );
  const [name, setName] = useState(editing?.name ?? '');
  const [reference, setReference] = useState(editing?.reference ?? '');
  const [date, setDate] = useState<Date | null>(editing?.lastPurchase ? parseISODate(editing.lastPurchase.date) : null);
  const [price, setPrice] = useState<number | null>(editing?.lastPurchase?.priceCop ?? null);
  const [store, setStore] = useState(editing?.lastPurchase?.store ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [submitted, setSubmitted] = useState(false);
  const errors = validatePart({ type, name, priceCop: price });
  const shown = submitted ? errors : {};
  const full = !editing && myParts.length >= MAX_PARTS;

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || type === null || full) return;
    // La compra se guarda si dijo cuándo, cuánto o dónde (sin fecha, se toma hoy).
    const hasPurchase = date !== null || price !== null || store.trim() !== '';
    const part: MyPart = {
      id: editing?.id ?? newId('part'),
      type,
      name: name.trim(),
      createdAt: editing?.createdAt ?? toISODate(today()),
      ...(reference.trim() ? { reference: reference.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(hasPurchase
        ? {
            lastPurchase: {
              date: toISODate(date ?? today()),
              ...(price ? { priceCop: price } : {}),
              ...(store.trim() ? { store: store.trim() } : {}),
            },
          }
        : {}),
    };
    const list = editing ? myParts.map((p) => (p.id === part.id ? part : p)) : [...myParts, part];
    if (!(await persist(() => setMyParts(list)))) return;
    toast.show(editing ? 'Cambios guardados' : 'Repuesto guardado');
    router.back();
  };

  const remove = () =>
    appAlert('¿Quitar este repuesto?', 'Se borra de tu lista. Tus gastos registrados no cambian.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => setMyParts(myParts.filter((p) => p.id !== editing?.id))))) return;
          toast.show('Repuesto quitado');
          router.back();
        },
      },
    ]);

  return (
    <FormScreen
      title={editing ? 'Repuesto' : 'Anotar un repuesto'}
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button label={full ? `Máximo ${MAX_PARTS}` : 'Guardar'} fullWidth onPress={save} />
          {editing && <Button label="Quitar" variant="ghost" fullWidth onPress={remove} />}
        </View>
      }>
      <Field label="¿Qué repuesto es?" error={shown.type}>
        <SelectField title="Repuesto" icon="parts" placeholder="Elige el repuesto" options={TYPE_OPTIONS} value={type} onChange={(v) => setType(v as PartType)} />
      </Field>
      <Field label={type === 'other' ? 'Nombre del repuesto' : 'Marca y descripción'} error={shown.name}>
        <TextField value={name} onChange={setName} placeholder={type === 'other' ? 'Ej.: Sensor de oxígeno' : 'Ej.: Bosch, para motor 1.6'} maxLength={MAX_PART_TEXT} accessibilityLabel="Marca y descripción" />
      </Field>
      <Field label="Referencia o código" optional hint="Como aparece en la caja o en la factura.">
        <TextField value={reference} onChange={setReference} autoCapitalize="characters" maxLength={40} accessibilityLabel="Referencia" />
      </Field>
      <Field label="¿Cuándo lo compraste?" optional>
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="¿Cuánto pagaste?" optional error={shown.price}>
        <NumberField value={price} onChange={setPrice} prefix="$" size="md" invalid={!!shown.price} accessibilityLabel="Precio" />
      </Field>
      <Field label="¿Dónde lo compraste?" optional>
        <TextField value={store} onChange={setStore} placeholder="Ej.: Almacén del barrio" maxLength={MAX_PART_TEXT} accessibilityLabel="Dónde lo compraste" />
      </Field>
      <Field label="Nota" optional>
        <TextField value={note} onChange={setNote} multiline maxLength={200} accessibilityLabel="Nota" />
      </Field>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  footer: {
    gap: spacing.xs,
  },
}));
