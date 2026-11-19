import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CONTACT_KINDS, contactKind, MAX_CONTACTS, validateContact, type CarContact, type ContactKind } from '@/features/contacts/rules';
import { useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { newId } from '@/features/session/userDataActions';
import { createStyles, spacing } from '@/shared/theme';
import { Button, Field, FormScreen, OptionGrid, TextField, useToast } from '@/shared/ui';
import { appAlert } from '@/shared/ui/AppDialog';

const KIND_OPTIONS = CONTACT_KINDS.map((k) => ({ value: k.kind, label: k.label, icon: k.icon }));

/** Crear o cambiar un contacto del carro (con ?id= se edita). */
export default function ContactFormScreen() {
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { contacts, setContacts } = useSession();
  const editing = contacts.find((c) => c.id === id);

  const [kind, setKind] = useState<ContactKind>(editing?.kind ?? 'mechanic');
  const [name, setName] = useState(editing?.name ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [submitted, setSubmitted] = useState(false);

  const errors = validateContact({ name, phone });
  const shown = submitted ? errors : {};
  const full = !editing && contacts.length >= MAX_CONTACTS;

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || full) return;
    const item: CarContact = {
      id: editing?.id ?? newId('contact'),
      kind,
      name: name.trim(),
      phone: phone.trim(),
      ...(note.trim() ? { note: note.trim() } : {}),
      // La ⭐ de Inicio se conserva al editar.
      ...(editing?.pinned ? { pinned: true } : {}),
    };
    const list = editing ? contacts.map((c) => (c.id === item.id ? item : c)) : [...contacts, item];
    if (!(await persist(() => setContacts(list)))) return;
    toast.show(editing ? 'Contacto actualizado' : 'Contacto guardado');
    router.back();
  };

  const remove = () =>
    appAlert('¿Borrar este contacto?', 'Se borra solo de RODEXA, no de los contactos de tu celular.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => setContacts(contacts.filter((c) => c.id !== editing?.id))))) return;
          toast.show('Contacto borrado');
          router.back();
        },
      },
    ]);

  return (
    <FormScreen
      title={editing ? 'Contacto' : 'Nuevo contacto'}
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button label={full ? `Máximo ${MAX_CONTACTS} contactos` : 'Guardar'} fullWidth onPress={save} />
          {editing && <Button label="Borrar" variant="ghost" fullWidth onPress={remove} />}
        </View>
      }>
      <Field label="¿Quién es?">
        <OptionGrid options={KIND_OPTIONS} selected={[kind]} onToggle={(k) => setKind(k)} columns={3} />
      </Field>

      <Field label="Nombre" error={shown.name}>
        <TextField
          value={name}
          onChange={setName}
          placeholder={contactKind(kind).placeholder}
          maxLength={60}
          invalid={!!shown.name}
          accessibilityLabel="Nombre"
        />
      </Field>

      <Field label="Teléfono" error={shown.phone}>
        <TextField
          value={phone}
          onChange={setPhone}
          placeholder="Ej.: 300 123 4567"
          maxLength={20}
          keyboardType="phone-pad"
          invalid={!!shown.phone}
          accessibilityLabel="Teléfono"
        />
      </Field>

      <Field label="Nota" optional>
        <TextField
          value={note}
          onChange={setNote}
          placeholder={kind === 'insurance' ? 'Ej.: número de póliza 12345' : 'Ej.: atiende de lunes a sábado'}
          maxLength={120}
          accessibilityLabel="Nota"
        />
      </Field>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  footer: {
    gap: spacing.sm,
  },
}));
